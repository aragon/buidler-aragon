import { ethers } from 'ethers'

/**
 * Returns a APM repo contract version array format from a semver string
 * @param version "1.2.3"
 * @return ["1", "2", "3"]
 */
export const toVersionArray = (version: string): string[] =>
  version.split('.').slice(0, 3)

/**
 * Returns the full ENS domain of a short app name
 * @param name "finance"
 * @return "finance.aragonpm.eth"
 */
export const getFullName = (name: string): string =>
  name.includes('.') ? name : name + '.aragonpm.eth'

/**
 * Returns the ENS namehash of a domain
 * @param name
 */
export const namehash = (name: string): string => ethers.utils.namehash(name)
