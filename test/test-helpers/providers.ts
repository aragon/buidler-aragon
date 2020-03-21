import { ethers } from 'ethers'

export function getMainnetProvider(): ethers.providers.InfuraProvider {
  return new ethers.providers.InfuraProvider()
}
