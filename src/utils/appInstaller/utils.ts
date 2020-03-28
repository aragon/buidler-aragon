import { ethers } from 'ethers'
import web3Utils from 'web3-utils'

/**
 * Returns a CID without and IPFS path
 * @param contentURI "0xab3416a5a43a4351618100011..."
 * @return "QmZ5LL015z..."
 */
export const getContentHash = (contentURI: string): string =>
  ethers.utils.toUtf8String(contentURI, true).replace('ipfs:', '')

/**
 * Convert UTF8 string to hex with 0x prefix
 * @param utf8
 */
export const utf8ToHex = (utf8: string): string => web3Utils.asciiToHex(utf8)

/**
 * Returns the ENS namehash of a domain
 * @param name
 */
export const namehash = (name: string): string => ethers.utils.namehash(name)
