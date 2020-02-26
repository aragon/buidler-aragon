import path from 'path'
import fsExtra from 'fs-extra'
import { generateApplicationArtifact } from '~/src/utils/generateArtifacts'
import { TruffleEnvironmentArtifacts } from '@nomiclabs/buidler-truffle5/src/artifacts'
import {
  readArapp,
  getMainContractName,
  getMainContractPath
} from '~/src/utils/arappUtils'

export const manifestPath = 'manifest.json'

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
  await generateUriArtifacts(appBuildOutputPath, artifacts)
}

export async function generateUriArtifacts(
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

async function _copyManifest(appBuildOutputPath: string): Promise<void> {
  await fsExtra.copy(
    manifestPath,
    path.join(appBuildOutputPath as string, manifestPath)
  )
}
