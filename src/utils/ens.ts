import {
  BuidlerRuntimeEnvironment,
  HttpNetworkConfig
} from '@nomiclabs/buidler/types'
import { ethers } from 'ethers'

/**
 * Resolve ENS name with custom ensAddress
 * @param name
 * @param bre
 * @param customEnsAddress
 */
export async function resolveName(
  {
    name,
    ensAddress
  }: {
    name: string
    ensAddress: string
  },
  bre: BuidlerRuntimeEnvironment
): Promise<string | undefined> {
  const networkConfig = bre.network.config as HttpNetworkConfig

  const provider = new ethers.providers.Web3Provider(bre.web3.currentProvider, {
    name: bre.network.name,
    chainId: networkConfig.chainId || 5555,
    ensAddress
  })
  return provider.resolveName(name)
}
