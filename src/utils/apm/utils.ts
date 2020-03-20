import { ethers } from 'ethers'
import semver from 'semver'
import fetch from 'node-fetch'
import { ApmVersion, ApmVersionReturn } from './types'

/**
 * Clean an IPFS hash of prefixes and suffixes commonly found
 * in both gateway URLs and content URLs
 * @param ipfsDirtyHash
 */
function stipIpfsPrefix(ipfsDirtyHash: string): string {
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
 * Return a fetchable URL to get the resources of a contentURI
 * @param contentUri "ipfs:QmaT4Eef..."
 * @param options
 */
export function getFetchUrlFromContentUri(
  contentUri: string,
  options?: { ipfsGateway?: string }
): string {
  const [protocol, location] = contentUri.split(/:(.+)/)
  switch (protocol) {
    case 'http':
    case 'https':
      return contentUri
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
 * Fetch and parse JSON from an HTTP(s) URL
 * @param url
 */
export async function fetchJson<T>(url: string): Promise<T> {
  return fetch(url).then(res => res.json())
}

/**
 * Returns true if is an address
 * @param address
 */
export function isAddress(address: string): boolean {
  try {
    ethers.utils.getAddress(address)
  } catch (e) {
    return false
  }
  return true
}

/**
 * Return hex format of data with 0x prefix
 * @param data
 */
export function utf8ToHex(data: string): string {
  return '0x' + Buffer.from(data, 'utf8').toString('hex')
}
