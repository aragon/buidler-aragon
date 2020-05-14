import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'

/**
 * Returns the root or default account from a runtime environment
 * @param bre
 */
export async function getRootAccount(
  bre: BuidlerRuntimeEnvironment
): Promise<string> {
  const from = bre.config.networks[bre.network.name].from

  return from || (await bre.web3.eth.getAccounts())[0]
}
