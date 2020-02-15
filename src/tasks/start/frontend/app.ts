import path from 'path'
import fsExtra from 'fs-extra'
import { execaRun } from '../utils/execa'
import { generateApplicationArtifact } from '../../../utils/generateArtifacts'
import { TruffleEnvironmentArtifacts } from '@nomiclabs/buidler-truffle5/src/artifacts'
import fetch from 'node-fetch'
import {
  readArapp,
  getMainContractName,
  getMainContractPath
} from '../utils/arapp'

export const manifestPath = 'manifest.json'

/**
 * Calls the app's aragon/ui copy-aragon-ui-assets script.
 */
export async function copyAppUiAssets(appSrcPath: string): Promise<void> {
  await execaRun('npm', ['run', 'sync-assets'], { cwd: appSrcPath })
}

/**
 * Calls the app's front end build watcher.
 */
export async function startAppWatcher(appSrcPath: string): Promise<void> {
  await execaRun('npm', ['run', 'watch'], { cwd: appSrcPath })
}

/**
 * Starts the app's front end sever.
 */
export async function serveAppAndResolveWhenBuilt(
  appSrcPath: string,
  appServePort: number
): Promise<void> {
  // Trigger serving in app/.
  execaRun('npm', ['run', 'serve', '--', '--port', `${appServePort}`], {
    cwd: appSrcPath
  })

  // Query the server for an index.html file.
  // and resolve only when the file is found (with a timeout).
  const maxWaitingTime = 60 * 1000
  const startingTime = Date.now()
  while (Date.now() - startingTime < maxWaitingTime) {
    try {
      await fetch(`http://localhost:${appServePort}`, { timeout: 10 * 1000 })

      // Server is active and serving, resolve.
      return
    } catch (e) {
      // Ignore errors, at worse after maxWaitingTime this will resolve.
      // Pause for a bit to prevent performing requests too fast.
      await new Promise(r => setTimeout(r, 1000))
    }
  }
}

/**
 * Generates the artifacts necessary for an Aragon App.
 * - manifest.json
 * - artifact.json
 */
export async function generateAppArtifacts(
  appBuildOutputPath: string,
  artifacts: TruffleEnvironmentArtifacts
): Promise<void> {
  await _copyManifest(appBuildOutputPath)
  await _generateUriArtifacts(appBuildOutputPath, artifacts)
}

async function _copyManifest(appBuildOutputPath: string): Promise<void> {
  await fsExtra.copy(
    manifestPath,
    path.join(appBuildOutputPath as string, manifestPath)
  )
}

async function _generateUriArtifacts(
  appBuildOutputPath: string,
  artifacts: TruffleEnvironmentArtifacts
): Promise<void> {
  // Retrieve main contract abi.
  const mainContractName: string = getMainContractName()
  const App: any = artifacts.require(mainContractName)
  const abi = App.abi

  // Retrieve contract source code.
  const mainContractPath = getMainContractPath()
  const source = await fsExtra.readFileSync(mainContractPath, 'utf8')

  // Retrieve arapp file.
  const arapp = readArapp()

  // Generate artifacts file.
  const appArtifacts = await generateApplicationArtifact(arapp, abi, source)

  // Write artifacts to file.
  await fsExtra.writeJSON(
    path.join(appBuildOutputPath as string, 'artifact.json'),
    appArtifacts,
    { spaces: 2 }
  )
}
