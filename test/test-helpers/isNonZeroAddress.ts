import Web3Utils from 'web3-utils'

const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

export function isNonZeroAddress(address): boolean {
  if (address === ZERO_ADDR) {
    return false
  }

  return Web3Utils.isAddress(address)
}
