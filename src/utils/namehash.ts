import { ethers } from 'ethers'

/**
 * Returns the ENS namehash of a domain
 * @param name
 */
export const namehash = (name: string): string => ethers.utils.namehash(name)
