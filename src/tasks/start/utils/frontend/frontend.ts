import chokidar from 'chokidar'
import {
  installAragonClientIfNeeded,
  startAragonClient,
  refreshClient
} from './client'
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'
import { logFront } from '../logger'
import { AragonConfig } from '~/src/types'
import {
  generateAppArtifacts,
  serveAppAndResolveWhenBuilt,
  copyAppUiAssets,
  startAppWatcher
} from './app'
import { emitEvent, FRONTEND_STARTED_SERVING } from '../../../../events'

/**
 * Starts the task's frontend sub-tasks. Logic is contained in ./tasks/start/utils/frontend/.
 * Retrieves the Aragon client using git, builds it, builds the app's frontend and serves the build.
 * Starts the Aragon client pointed at a Dao and an app, and watches for changes on the app's sources.
 * If changes are detected, the app's frontend is rebuilt.
 */
export async function startFrontend(
  bre: BuidlerRuntimeEnvironment,
  daoAddress: string,
  appAddress: string,
  openBrowser: boolean
): Promise<void> {
  const config: AragonConfig = bre.config.aragon as AragonConfig

  logFront('Installing Aragon client...')
  await installAragonClientIfNeeded()

  const appBuildOutputPath = config.appBuildOutputPath as string
  await generateAppArtifacts(appBuildOutputPath, bre.artifacts)

  logFront('Building front end (first time takes a bit)...')
  const appSrcPath = config.appSrcPath as string
  const appServePort = config.appServePort as number
  await copyAppUiAssets(appSrcPath)
  await serveAppAndResolveWhenBuilt(appSrcPath, appServePort)

  // Start Aragon client at the deployed address.
  const url: string = await startAragonClient(
    config.clientServePort as number,
    `${daoAddress}/${appAddress}`,
    openBrowser
  )
  logFront(`You can now view the Aragon client in the browser.
Local:  ${url}`)

  // Watch changes to app/src/script.js.
  chokidar
    .watch('./app/src/script.js', {
      awaitWriteFinish: { stabilityThreshold: 1000 }
    })
    .on('change', async () => {
      logFront(`script.js changed`)

      await refreshClient()
    })

  // Watch changes to artifact files.
  chokidar
    .watch(['./arapp.json', './manifest.json'], {
      awaitWriteFinish: { stabilityThreshold: 1000 }
    })
    .on('change', path => {
      logFront(
        `Warning: Changes detected on ${path}. Hot reloading is not supported on this file. Please re-run the "start" task to load these changes.`
      )
    })

  emitEvent(FRONTEND_STARTED_SERVING, 1000)

  logFront('Watching changes on front end...')
  await startAppWatcher(appSrcPath)
}
