import chokidar from 'chokidar'
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'
import { createDao } from './dao'
import { deployImplementation } from './app'
import { createProxy, updateProxy } from './proxy'
import { createRepo, updateRepo } from './repo'
import { setAllPermissionsOpenly } from './permissions'
import { KernelInstance, RepoInstance } from '~/typechain'
import { logBack } from '../logger'
import { readArapp } from '../arapp'
import { AragonConfig, AragonConfigHooks } from '~/src/types'
import { TASK_COMPILE } from '../../../task-names'

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
  appId: string
): Promise<{ daoAddress: string; appAddress: string }> {
  const config: AragonConfig = bre.config.aragon as AragonConfig
  const hooks: AragonConfigHooks = config.hooks as AragonConfigHooks

  await bre.run(TASK_COMPILE)

  // Read arapp.json
  const arapp = readArapp()

  // Prepare a DAO and a Repo to hold the app.
  const dao: KernelInstance = await createDao(bre.web3, bre.artifacts)
  const repo: RepoInstance = await createRepo(
    appName,
    appId,
    bre.web3,
    bre.artifacts
  )

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
  const implementation: Truffle.ContractInstance = await deployImplementation(
    bre.artifacts
  )
  const proxy: Truffle.ContractInstance = await createProxy(
    implementation,
    appId,
    dao,
    bre.web3,
    bre.artifacts,
    proxyInitParams
  )
  await updateRepo(repo, implementation, config.appServePort as number)

  // TODO: What if user wants to set custom permissions?
  // Use a hook? A way to disable all open permissions?
  await setAllPermissionsOpenly(dao, proxy, arapp, bre.web3, bre.artifacts)

  // Call postInit hook.
  if (hooks && hooks.postInit) {
    await hooks.postInit(bre)
  }

  // Watch back-end files.
  chokidar
    .watch('./contracts/', {
      awaitWriteFinish: { stabilityThreshold: 1000 }
    })
    .on('change', async () => {
      logBack(`<<< Triggering backend build >>>`)
      await bre.run(TASK_COMPILE)

      // Update implementation and set it in Repo and Proxy.
      const newImplementation: Truffle.ContractInstance = await deployImplementation(
        bre.artifacts
      )
      await updateRepo(repo, newImplementation, config.appServePort as number)
      await updateProxy(newImplementation, appId, dao, bre.web3)
    })

  logBack(`
  App name: ${appName}
  App id: ${appId}
  DAO: ${dao.address}
  APMRegistry: ${repo.address}
  App proxy: ${proxy.address}
`)

  return { daoAddress: dao.address, appAddress: proxy.address }
}
