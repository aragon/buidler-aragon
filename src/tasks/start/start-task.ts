import chokidar from 'chokidar'
import { task } from '@nomiclabs/buidler/config'
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'
import { TASK_START, TASK_COMPILE } from '../task-names'
import { createDao } from './utils/backend/dao'
import { deployImplementation } from './utils/backend/app'
import { createProxy, updateProxy } from './utils/backend/proxy'
import { createRepo, updateRepo } from './utils/backend/repo'
import { setAllPermissionsOpenly } from './utils/backend/permissions'
import {
  installAragonClientIfNeeded,
  startAragonClient
} from './utils/frontend/client'
import { buildAppArtifacts, watchAppFrontEnd } from './utils/frontend/build'
import { KernelInstance, RepoInstance } from '~/typechain'
import { getAppId } from './utils/id'
import { logFront, logBack, logMain } from './utils/logger'
import { readArapp } from './utils/arapp'
import { AragonConfig } from '~/src/types'
import { getAppName, getAppEnsName } from './utils/arapp'

/**
 * Main, composite, task. Calls startBackend, then startFrontend,
 * and then returns an unresolving promise to keep the task open.
 */
task(TASK_START, 'Starts Aragon app development').setAction(
  async (params, bre: BuidlerRuntimeEnvironment) => {
    logMain(`Starting...`)

    const { daoAddress, appAddress } = await startBackend(bre)
    await startFrontend(bre, daoAddress, appAddress)
  }
)

/**
 * Starts the task's backend sub-tasks. Logic is contained in ./tasks/start/utils/backend/.
 * Creates a Dao and a Repo for the app in development and watches for changes in
 * contracts. When contracts change, it compiles the contracts, deploys them and updates the
 * proxy in the Dao.
 * @returns Promise<{ daoAddress: string, appAddress: string }> Dao and app address that can
 * be used with an Aragon client to view the app.
 */
async function startBackend(
  bre: BuidlerRuntimeEnvironment
): Promise<{ daoAddress: string; appAddress: string }> {
  const appEnsName = await getAppEnsName()
  const appName = await getAppName()
  const appId: string = getAppId(appName)
  console.log(`App name: ${appName}`)
  console.log(`App ens name: ${appEnsName}`)
  console.log(`App id: ${appId}`)

  const config: AragonConfig = bre.config.aragon as AragonConfig
  console.log(`config`, config)

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

  // Prepare proxy initialization params.
  // NOTE: This calls a function specified in the BuidlerConfig.
  let proxyInitParams: any[] = []
  if (config.proxyInitializationParamsFn) {
    const params = await config.proxyInitializationParamsFn(bre)
    if (params) {
      proxyInitParams = params
    }
  } else if (config.proxyInitializationParams) {
    const params = config.proxyInitializationParams
    if (params) {
      proxyInitParams = params
    }
  }
  console.log(`proxyInitParams`, proxyInitParams)

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
  await setAllPermissionsOpenly(dao, proxy, arapp, bre.web3, bre.artifacts)

  // Watch back-end files. Debounce for performance
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

/**
 * Starts the task's frontend sub-tasks. Logic is contained in ./tasks/start/utils/frontend/.
 * Retrieves the Aragon client using git, builds it, builds the app's frontend and serves the build.
 * Starts the Aragon client pointed at a Dao and an app, and watches for changes on the app's sources.
 * If changes are detected, the app's frontend is rebuilt.
 */
async function startFrontend(
  bre: BuidlerRuntimeEnvironment,
  daoAddress: string,
  appAddress: string
): Promise<void> {
  const config: AragonConfig = bre.config.aragon as AragonConfig

  await installAragonClientIfNeeded()

  await buildAppArtifacts(config.appBuildOutputPath as string, bre.artifacts)

  // Start Aragon client at the deployed address.
  const url: string = await startAragonClient(
    config.clientServePort as number,
    `${daoAddress}/${appAddress}`
  )
  logFront(`You can now view the Aragon client in the browser.
 Local:  ${url}
`)

  // Watch for changes to rebuild app.
  await watchAppFrontEnd(config.appSrcPath as string)
}
