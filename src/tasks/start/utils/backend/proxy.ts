import { getMainContractName } from '../arapp'
import { KernelInstance } from '~/typechain'
import { logBack } from '../logger'
import { getLog } from '../../../../utils/getLog'
import Web3 from 'web3'
import { TruffleEnvironmentArtifacts } from '@nomiclabs/buidler-truffle5/src/artifacts'

interface InitializableApp extends Truffle.ContractInstance {
  initialize: (...args: any[]) => void
}

/**
 * Creates a new app proxy using a Dao, and set's the specified implementation.
 * @returns Promise<Truffle.Contract<any>> The TruffleContract instance of the
 * deployed app contract, wrapped around an upgradeably proxy address.
 */
export async function createProxy(
  implementation: Truffle.ContractInstance,
  appId: string,
  dao: KernelInstance,
  web3: Web3,
  artifacts: TruffleEnvironmentArtifacts,
  proxyInitParams: any[]
): Promise<Truffle.ContractInstance> {
  const rootAccount: string = (await web3.eth.getAccounts())[0]

  // Create a new app proxy with base implementation.
  const txResponse: Truffle.TransactionResponse = await dao.newAppInstance(
    appId,
    implementation.address,
    '0x',
    false,
    { from: rootAccount }
  )

  // Retrieve proxy address and wrap around abi.
  const proxyAddress: string = getLog(txResponse, 'NewAppProxy', 'proxy')

  const mainContractName: string = getMainContractName()
  const App: Truffle.Contract<any> = artifacts.require(mainContractName)

  const proxy: InitializableApp = await App.at(proxyAddress)

  // Initialize the app.
  await proxy.initialize(...proxyInitParams)

  return proxy
}

/**
 * Updates the app proxy's implementation in the Kernel.
 */
export async function updateProxy(
  implementation: Truffle.ContractInstance,
  appId: string,
  dao: KernelInstance,
  web3: Web3
): Promise<void> {
  const rootAccount: string = (await web3.eth.getAccounts())[0]

  // Set the new implementation in the Kernel.
  await dao.setApp(
    await dao.APP_BASES_NAMESPACE(),
    appId,
    implementation.address,
    {
      from: rootAccount
    }
  )
}
