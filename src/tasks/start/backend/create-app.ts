import { BuidlerPluginError } from '@nomiclabs/buidler/plugins'
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'
import {
  RepoContract,
  RepoInstance,
  APMRegistryContract,
  APMRegistryInstance,
  AppStubInstance,
  KernelInstance
} from '~/typechain'
import { getRootAccount } from '~/src/utils/accounts'
import { getAppId, getAppNameParts } from '~/src/utils/appName'
import { getMainContractName } from '~/src/utils/arappUtils'
import { resolveName } from '~/src/utils/ens'
import { getLog } from '~/src/utils/getLog'
import { deployImplementation } from './deploy-implementation'

export async function createApp(
  {
    appName,
    dao,
    ensAddress
  }: {
    appName: string
    dao: KernelInstance
    ensAddress: string
  },
  bre: BuidlerRuntimeEnvironment
): Promise<{
  implementation: Truffle.ContractInstance
  proxy: AppStubInstance
  repo: RepoInstance
}> {
  // Deploy first app implementation.
  const implementation = await deployImplementation(bre.artifacts)

  // Create an app proxy.
  const proxy = await _createProxy(
    { implementationAddress: implementation.address, appName, dao },
    bre
  )

  // Deploy a repo for the app.
  const repo = await _createRepo({ appName, ensAddress }, bre)

  return { implementation, proxy, repo }
}

/**
 * Creates a new app proxy using a Dao, and set's the specified implementation.
 * @returns Promise<Truffle.Contract<any>> The TruffleContract instance of the
 * deployed app contract, wrapped around an upgradeably proxy address.
 */
async function _createProxy(
  {
    implementationAddress,
    appName,
    dao
  }: {
    implementationAddress: string
    appName: string
    dao: KernelInstance
  },
  bre: BuidlerRuntimeEnvironment
): Promise<AppStubInstance> {
  const rootAccount: string = await getRootAccount(bre)
  const appId = getAppId(appName)

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
  { appName, ensAddress }: { appName: string; ensAddress: string },
  bre: BuidlerRuntimeEnvironment
): Promise<RepoInstance> {
  const rootAccount: string = (await bre.web3.eth.getAccounts())[0]

  const { shortName, registryName } = getAppNameParts(appName)
  const apmAddress = await resolveName({ name: registryName, ensAddress }, bre)
  if (!apmAddress)
    throw new BuidlerPluginError(
      `No APM registry configured for ${registryName}`
    )

  // Create a new repo using the APM.
  const APMRegistry: APMRegistryContract = bre.artifacts.require('APMRegistry')
  const apmRegistry: APMRegistryInstance = await APMRegistry.at(apmAddress)
  const txResponse: Truffle.TransactionResponse = await apmRegistry.newRepo(
    shortName,
    rootAccount
  )

  // Retrieve repo address from creation tx logs.
  const repoAddress: string = getLog(txResponse, 'NewRepo', 'repo')

  // Wrap Repo address with abi.
  const Repo: RepoContract = bre.artifacts.require('Repo')
  const repo: RepoInstance = await Repo.at(repoAddress)

  return repo
}
