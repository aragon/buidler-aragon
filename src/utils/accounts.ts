import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'

/**
 * Returns the root or default account from a runtime environment
 * @param bre
 */
export async function getRootAccount(
  bre: BuidlerRuntimeEnvironment
): Promise<string> {
  const accounts = await bre.web3.eth.getAccounts()
  return accounts[0]
}
