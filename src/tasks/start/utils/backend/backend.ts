import chokidar from 'chokidar'
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'
import { createDao } from './dao'
import { deployImplementation } from './app'
import { createProxy, updateProxy } from './proxy'
import { resolveRepo, majorBumpRepo } from './repo'
import { setAllPermissionsOpenly } from './permissions'
import { KernelInstance, RepoInstance } from '~/typechain'
import { logBack } from '../logger'
import { readArapp } from '../arapp'
import { AragonConfig, AragonConfigHooks } from '~/src/types'
import { TASK_COMPILE } from '../../../task-names'
import deployAragonBases from './bases'
import { startGanache } from './ganache'
import { Writable } from 'stream'
import {
  emitEvent,
  BACKEND_BUILD_STARTED,
  BACKEND_PROXY_UPDATED
} from '../../../../events'

/**
 * Starts the task's backend sub-tasks. Logic is contained in ./tasks/start/utils/backend/.
 * Creates a Dao and a Repo for the app in development and watches for changes in
 * contracts. When contracts change, it compiles the contracts, deploys them and updates the
 * proxy in the Dao.
 * @returns Promise<{ daoAddress: string, appAddress: string }> Dao and app address that can
 * be used with an Aragon client to view the app.
 */
export async function startBackend(
  bre: BuidlerRuntimeEnvironment,
  appName: string,
  appId: string,
  silent: boolean
): Promise<{ daoAddress: string; appAddress: string }> {
  emitEvent(BACKEND_BUILD_STARTED)

  const config: AragonConfig = bre.config.aragon as AragonConfig
  const hooks: AragonConfigHooks = config.hooks as AragonConfigHooks

  await _compileDisablingOutput(bre, silent)

  /**
   * Until BuidlerEVM JSON RPC is ready, a ganache server will be started
   * on the appropiate conditions.
   */
  const networkId = await startGanache(bre)
  if (networkId !== 0) {
    logBack(`Started a ganache testnet instance with id ${networkId}.`)
  }

  // Deploy bases.
  logBack('Deploying Aragon bases (ENS, DAOFactory, and APM)...')
  const { ensAddress, daoFactoryAddress, apmAddress } = await deployAragonBases(
    bre
  )
  logBack(`ENS deployed: ${ensAddress}`)
  logBack(`DAO factory deployed: ${daoFactoryAddress}`)
  logBack(`APM deployed: ${apmAddress}`)

  // Read arapp.json.
  const arapp = readArapp()

  // Call preDao hook.
  if (hooks && hooks.preDao) {
    await hooks.preDao(bre)
  }

  // Prepare a DAO and a Repo to hold the app.
  logBack('Deploying DAO and app repository...')
  const dao: KernelInstance = await createDao(
    bre.web3,
    bre.artifacts,
    daoFactoryAddress
  )
  const repo: RepoInstance = await resolveRepo(
    appName,
    appId,
    bre.web3,
    bre.artifacts,
    ensAddress,
    apmAddress
  )
  logBack(`DAO deployed: ${dao.address}`)
  logBack(`Repo deployed: ${repo.address}`)

  // Call postDao hook.
  if (hooks && hooks.postDao) {
    await hooks.postDao(dao, bre)
  }

  // Call preInit hook.
  if (hooks && hooks.preInit) {
    await hooks.preInit(bre)
  }

  // Call getInitParams hook.
  let proxyInitParams: any[] = []
  if (hooks && hooks.getInitParams) {
    const params = await hooks.getInitParams(bre)
    proxyInitParams = params ? params : proxyInitParams
  }
  if (proxyInitParams && proxyInitParams.length > 0) {
    logBack(`Proxy init params: ${proxyInitParams}`)
  }

  // Deploy first implementation and set it in the Repo and in a Proxy.
  logBack('Deploying app implementation...')
  const implementation: Truffle.ContractInstance = await deployImplementation(
    bre.artifacts
  )
  logBack(`App implementation deployed: ${implementation.address}`)

  logBack('Setting implementation in app repository...')
  await majorBumpRepo(repo, implementation, config.appServePort as number)

  logBack('Creating app proxy...')
  const proxy: Truffle.ContractInstance = await createProxy(
    implementation,
    appId,
    dao,
    bre.web3,
    bre.artifacts,
    proxyInitParams
  )
  logBack(`App proxy deployed: ${proxy.address}`)

  // TODO: What if user wants to set custom permissions?
  // Use a hook? A way to disable all open permissions?
  await setAllPermissionsOpenly(dao, proxy, arapp, bre.web3, bre.artifacts)
  logBack('All permissions set openly.')

  // Call postInit hook.
  if (hooks && hooks.postInit) {
    await hooks.postInit(proxy, bre)
  }

  // Watch back-end files.
  chokidar
    .watch('./contracts/', {
      awaitWriteFinish: { stabilityThreshold: 1000 }
    })
    .on('change', async () => {
      logBack(`Triggering backend build...`)
      const compilationSucceeded = await _compileDisablingOutput(
        bre,
        silent,
        false
      )

      // Do nothing if contract compilation fails.
      if (!compilationSucceeded) {
        logBack('Unable to update proxy, please check your contracts.')
        return
      }

      // Update implementation and set it in Repo and Proxy.
      logBack('Deploying app implementation...')
      const newImplementation: Truffle.ContractInstance = await deployImplementation(
        bre.artifacts
      )
      logBack(`App implementation deployed: ${implementation.address}`)

      logBack('Updating implementation in app repository and proxy...')
      await majorBumpRepo(
        repo,
        newImplementation,
        config.appServePort as number
      )
      await updateProxy(newImplementation, appId, dao, bre.web3)
      logBack(`Updated proxy implementation to: ${newImplementation.address}`)

      // Call postUpdate hook.
      if (hooks && hooks.postUpdate) {
        await hooks.postUpdate(proxy, bre)
      }

      emitEvent(BACKEND_PROXY_UPDATED)
    })

  return { daoAddress: dao.address, appAddress: proxy.address }
}

/**
 * Buidler's compile task currently calls console.logs.
 * Until they can be disabled as an option, this workaround removes them.
 */
async function _compileDisablingOutput(
  bre: BuidlerRuntimeEnvironment,
  silent: boolean,
  exitOnFailure = true
): Promise<boolean> {
  logBack('Compiling contracts...')

  const consoleCache = console

  if (silent) {
    // eslint-disable-next-line no-console
    console = new console.Console(new Writable())
  }

  let success = true
  await bre.run(TASK_COMPILE).catch(err => {
    logBack(err.message)

    success = false

    if (exitOnFailure) {
      process.exit(1)
    }
  })

  console = consoleCache

  if (success) {
    logBack('Contracts compiled.')
  }

  return success
}
