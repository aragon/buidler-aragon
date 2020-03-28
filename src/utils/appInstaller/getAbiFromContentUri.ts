import { ethers } from 'ethers'
import fetch from 'node-fetch'
import { AbiItem } from '~/src/types'
import { getContentHash } from './utils'

/**
 * Gets the ABI from an Aragon App release directory
 * @param contentURI
 * @param options
 */
export default async function getAbiFromContentUri(
  contentURI: string,
  options: { ipfsGateway: string }
): Promise<AbiItem[]> {
  const { ipfsGateway } = options

  const contentHash = ethers.utils.isHexString(contentURI)
    ? getContentHash(contentURI)
    : contentURI.split('/ipfs/')[1]

  if (!ipfsGateway) throw Error('ipfsGateway must be defined')
  if (!contentHash) throw Error('contentHash must be defined')

  const artifact = await fetch(
    `${ipfsGateway}${contentHash}/artifact.json`
  ).then(res => res.json())

  if (!artifact.abi) throw Error('artifact.json does not contain the ABI')
  return artifact.abi
}
