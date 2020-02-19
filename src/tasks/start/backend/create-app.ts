import { getMainContractName } from '~/src/utils/arappUtils'
import { KernelInstance } from '~/typechain'
import { getLog } from '~/src/utils/getLog'
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'
import { deployImplementation } from './deploy-implementation'
import {
  RepoContract,
  RepoInstance,
  APMRegistryContract,
  APMRegistryInstance,
  AppStubInstance
} from '~/typechain'

export async function createApp(
  appName: string,
  appId: string,
  dao: KernelInstance,
  ensAddress: string,
  apmAddress: string,
  bre: BuidlerRuntimeEnvironment
): Promise<{
  implementation: Truffle.ContractInstance
  proxy: AppStubInstance
  repo: RepoInstance
}> {
  // Deploy first app implementation.
  const implementation = await deployImplementation(bre.artifacts)

  // Create an app proxy.
  const proxy = await _createProxy(implementation.address, appId, dao, bre)

  // Deploy a repo for the app.
  const repo = await _createRepo(appName, appId, ensAddress, apmAddress, bre)

  return { implementation, proxy, repo }
}

/**
 * Creates a new app proxy using a Dao, and set's the specified implementation.
 * @returns Promise<Truffle.Contract<any>> The TruffleContract instance of the
 * deployed app contract, wrapped around an upgradeably proxy address.
 */
async function _createProxy(
  implementationAddress: string,
  appId: string,
  dao: KernelInstance,
  bre: BuidlerRuntimeEnvironment
): Promise<AppStubInstance> {
  const rootAccount: string = (await bre.web3.eth.getAccounts())[0]

  // Create a new app proxy with base implementation.
  const txResponse: Truffle.TransactionResponse = await dao.newAppInstance(
    appId,
    implementationAddress,
    '0x',
    false,
    { from: rootAccount }
  )

  // Retrieve proxy address and wrap around abi.
  const proxyAddress: string = getLog(txResponse, 'NewAppProxy', 'proxy')
  const mainContractName: string = getMainContractName()
  const App: Truffle.Contract<any> = bre.artifacts.require(mainContractName)
  const proxy: AppStubInstance = await App.at(proxyAddress)

  return proxy
}

/**
 * Creates a new APM repository.
 * @returns Promise<RepoInstance> An APM repository for the app.
 */
async function _createRepo(
  appName: string,
  appId: string,
  ensAddress: string,
  apmAddress: string,
  bre: BuidlerRuntimeEnvironment
): Promise<RepoInstance> {
  const rootAccount: string = (await bre.web3.eth.getAccounts())[0]

  // Create a new repo using the APM.
  const APMRegistry: APMRegistryContract = bre.artifacts.require('APMRegistry')
  const apmRegistry: APMRegistryInstance = await APMRegistry.at(apmAddress)
  const txResponse: Truffle.TransactionResponse = await apmRegistry.newRepo(
    appName,
    rootAccount
  )

  // Retrieve repo address from creation tx logs.
  const repoAddress: string = getLog(txResponse, 'NewRepo', 'repo')

  // Wrap Repo address with abi.
  const Repo: RepoContract = bre.artifacts.require('Repo')
  const repo: RepoInstance = await Repo.at(repoAddress)

  return repo
}
