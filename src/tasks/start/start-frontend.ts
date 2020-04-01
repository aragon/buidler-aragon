import chokidar from 'chokidar'
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'
import { logFront } from '~/src/ui/logger'
import { AragonConfig } from '~/src/types'
import { serveAppAndResolveWhenBuilt } from './frontend/serve-app'
import { copyAppUiAssets } from './frontend/copy-assets'
import { startAppWatcher } from './frontend/watch-app'
import { generateArtifacts } from '~/src/utils/artifact'
import { refreshClient } from './client/aragon-client'

/**
 * Starts the task's frontend sub-tasks. Logic is contained in ./tasks/start/utils/frontend/.
 * If changes are detected, the app's frontend is rebuilt.
 */
export async function startFrontend(
  bre: BuidlerRuntimeEnvironment
): Promise<{
  /**
   * Closes open file watchers and file servers
   */
  close: () => void
}> {
  const config: AragonConfig = bre.config.aragon as AragonConfig

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
      closeServerApp()
      closeWatchScript()
    }
  }
}
