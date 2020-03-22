import chokidar from 'chokidar'
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'
import { logFront } from '~/src/ui/logger'
import { AragonConfig } from '~/src/types'
import { serveAppAndResolveWhenBuilt } from './frontend/serve-app'
import { copyAppUiAssets } from './frontend/copy-assets'
import { startAppWatcher } from './frontend/watch-app'
import { generateArtifacts } from '~/src/utils/artifact'
import {
  installAragonClientIfNeeded,
  startAragonClient,
  refreshClient
} from './frontend/aragon-client'

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
): Promise<{
  /**
   * Closes open file watchers and file servers
   */
  close: () => void
}> {
  const config: AragonConfig = bre.config.aragon as AragonConfig

  logFront('Checking Aragon client...')
  await installAragonClientIfNeeded()

  logFront('Generating app artifacts...')
  const appBuildOutputPath = config.appBuildOutputPath as string
  await generateArtifacts(appBuildOutputPath, bre)

  logFront('Building front end (takes a minute)...')
  const appSrcPath = config.appSrcPath as string
  const appServePort = config.appServePort as number
  await copyAppUiAssets(appSrcPath)
  const { close: closeServerApp } = await serveAppAndResolveWhenBuilt(
    appSrcPath,
    appServePort
  )

  // Start Aragon client at the deployed address.
  const appURL = `http://localhost:${appServePort}`
  const { url: clientURL, close: closeStaticServer } = await startAragonClient(
    config.clientServePort as number,
    `${daoAddress}/${appAddress}`,
    openBrowser
  )
  logFront(`You can now view the Aragon client in the browser.
App content: ${appURL}
Client:  ${clientURL}`)

  // Watch changes to app/src/script.js.
  const srcWatcher = chokidar
    .watch('./app/src/script.js', {
      awaitWriteFinish: { stabilityThreshold: 1000 }
    })
    .on('change', async () => {
      logFront(`script.js changed`)

      await refreshClient()
    })

  // Watch changes to artifact files.
  const artifactWatcher = chokidar
    .watch(['./arapp.json', './manifest.json'], {
      awaitWriteFinish: { stabilityThreshold: 1000 }
    })
    .on('change', path => {
      logFront(
        `Warning: Changes detected on ${path}. Hot reloading is not supported on this file. Please re-run the "start" task to load these changes.`
      )
    })

  logFront('Watching changes on front end...')
  const { close: closeWatchScript } = await startAppWatcher(appSrcPath)

  return {
    close: (): void => {
      srcWatcher.close()
      artifactWatcher.close()
      closeStaticServer()
      closeServerApp()
      closeWatchScript()
    }
  }
}
