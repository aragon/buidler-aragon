import { ethers } from 'ethers'
import semver from 'semver'
import { ApmVersion, ApmVersionReturn } from './types'

/**
 * Parse a raw version response from an APM repo
 */
export function parseApmVersionReturn(res: ApmVersionReturn): ApmVersion {
  return {
    version: res.semanticVersion.join('.'),
    contractAddress: res.contractAddress,
    // toUtf8String(, true) to ignore UTF8 errors parsing and let downstream
    // components identify faulty content URIs
    contentUri: ethers.utils.toUtf8String(res.contentURI, true)
  }
}

/**
 * Return a semantic version string into the APM version array format
 * @param version "0.2.4"
 */
export function toApmVersionArray(version: string): [number, number, number] {
  const semverObj = semver.parse(version)
  if (!semverObj) throw Error(`Invalid semver ${version}`)
  return [semverObj.major, semverObj.minor, semverObj.patch]
}

/**
 * Clean an IPFS hash of prefixes and suffixes commonly found
 * in both gateway URLs and content URLs
 * @param ipfsDirtyHash
 */
export function stipIpfsPrefix(ipfsDirtyHash: string): string {
  return (
    ipfsDirtyHash
      // Trim ending /ipfs/ tag
      // "site.io:8080//ipfs//" => "site.io:8080"
      .replace(/\/*ipfs\/*$/, '')
      // Trim starting /ipfs/, ipfs: tag
      // "/ipfs/Qm" => "Qm"
      .replace(/^\/*ipfs[/:]*/, '')
  )
}

/**
 * Return a fetchable URL to get the resources of a contentURI
 * @param contentUri "ipfs:QmaT4Eef..."
 * @param options
 */
export function contentUriToFetchUrl(
  contentUri: string,
  options?: { ipfsGateway?: string }
): string {
  const [protocol, location] = contentUri.split(/[/:](.+)/)
  switch (protocol) {
    case 'http':
    case 'https':
      return location.includes('://') ? location : contentUri
    case 'ipfs':
      if (!options || !options.ipfsGateway)
        throw Error(`Must provide an ipfsGateway for protocol 'ipfs'`)
      return [
        stipIpfsPrefix(options.ipfsGateway),
        'ipfs',
        stipIpfsPrefix(location)
      ].join('/')
    default:
      throw Error(`Protocol '${protocol}' not supported`)
  }
}

/**
 * Returns contentURI in Aragon's protocol:location format as hex
 * @param protocol "ipfs"
 * @param location "QmbNG8dVgi363popKyCrojMNj3wRczxjEoSv27J8tvFgwQ"
 */
export function toContentUri(
  protocol: 'http' | 'https' | 'ipfs',
  location: string
): string {
  if (!protocol) throw Error('contentURI protocol must be defined')
  if (!location) throw Error('contentURI location must be defined')
  return utf8ToHex([protocol, location].join(':'))
}

/**
 * Returns true if is an address
 * @param address
 */
export function isAddress(address: string): boolean {
  try {
    ethers.utils.getAddress(address)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Return hex format of data with 0x prefix
 * @param data
 */
export function utf8ToHex(data: string): string {
  return '0x' + Buffer.from(data, 'utf8').toString('hex')
}
