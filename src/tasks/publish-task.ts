import path from 'path'
import fs from 'fs'
import execa from 'execa'
import { task, types } from '@nomiclabs/buidler/config'
import { BuidlerPluginError } from '@nomiclabs/buidler/plugins'
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'
import {
  publishVersion,
  parseContractFunctions,
  getApmRepoVersion,
  ZERO_ADDRESS,
  ARTIFACT_FILE,
  MANIFEST_FILE,
  ARAPP_FILE,
  SOLIDITY_FILE
} from '@aragon/toolkit'
import {
  TASK_COMPILE,
  TASK_VERIFY_CONTRACT,
  TASK_PUBLISH,
  TASK_ARAGON_ARTIFACT_GET
} from './task-names'
import { logMain } from '../ui/logger'
import { AragonConfig } from '~/src/types'
import { AragonArtifact, AragonManifest, ApmVersion } from './publish/types'
import uploadReleaseToIpfs from './publish/uploadDistToIpfs'
import parseAndValidateBumpOrVersion from './publish/parseAndValidateBumpOrVersion'
import matchContractRoles from './publish/matchContractRoles'
import findMissingManifestFiles from './publish/findMissingManifestFiles'
import {
  getMainContractName,
  getAppEnsName,
  getAppName,
  getAppId
} from '../utils/arappUtils'

const readFile = (filepath: string): string => fs.readFileSync(filepath, 'utf8')
const readJson = <T>(filepath: string): T =>
  JSON.parse(fs.readFileSync(filepath, 'utf8'))
const writeJson = <T>(filepath: string, data: T) =>
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2))

const artifactName: string = ARTIFACT_FILE
const manifestName: string = MANIFEST_FILE
const flatCodeName: string = SOLIDITY_FILE
const arappName: string = ARAPP_FILE

export default function() {
  task(TASK_PUBLISH, 'Publish a new app version')
    .addPositionalParam(
      'bump',
      'Type of bump (major, minor or patch) or semantic version',
      undefined,
      types.string
    )
    .addOptionalParam(
      'contract',
      'Contract address previously deployed.',
      undefined,
      types.string
    )
    .addOptionalParam(
      'managerAddress',
      'Owner of the APM repo. Must be provided in the initial release',
      undefined,
      types.string
    )
    .addOptionalParam(
      'ipfsProvider',
      'Provider URL to connect to an ipfs daemon API server',
      'http://localhost:5001',
      types.string
    )
    .addFlag(
      'onlyContent',
      'Prevents contract compilation, deployment and artifact generation.'
    )
    .addFlag('noVerify', 'Prevents etherscan verification.')
    .setAction(
      async (
        {
          bump: bumpOrVersion,
          contract,
          managerAddress,
          ipfsProvider,
          onlyContent,
          noVerify
        },
        bre: BuidlerRuntimeEnvironment
      ) => {
        const config = bre.config.aragon as AragonConfig
        const appSrcPath = config.appSrcPath as string
        const appBuildOutputPath = config.appBuildOutputPath as string

        const contractName = getMainContractName()
        const appEnsName = getAppEnsName()
        const appName = getAppName()
        const appId = getAppId(appEnsName)

        // Hardcoded until a better way to deal with dynamic ENS address is found
        const ipfsIgnore = ['subfolder/to/ignore/**']
        const environment = 'rpc'

        const prevVersion: ApmVersion | undefined = await getApmRepoVersion(
          appEnsName,
          'latest'
        )

        const { bump, nextVersion } = parseAndValidateBumpOrVersion(
          bumpOrVersion,
          prevVersion ? prevVersion.version : undefined
        )
        logMain(`Applying version bump ${bump}, next version: ${nextVersion}`)

        async function getContractAddress(): Promise<string> {
          if (onlyContent) {
            // No need for contract deployment
            return ZERO_ADDRESS
          } else if (contract) {
            logMain('Using provided contract address')
            return contract
          } else if (!prevVersion || bump === 'major') {
            // Compile contracts
            await bre.run(TASK_COMPILE)
            // Deploy contract
            const MainContract = bre.artifacts.require(contractName)
            const mainContract = await MainContract.new()
            logMain('Implementation contract deployed')
            return mainContract.address
          } else {
            logMain('Reusing contract from previous version')
            return prevVersion.contractAddress
          }
        }

        const contractAddress = await getContractAddress()
        logMain(`contractAddress: ${contractAddress}`)

        // Prepare release directory
        // npm run build must create: index.html, src.js, script.js
        await execa('npm', ['run', 'build'], { cwd: appSrcPath })

        // Generate Aragon artifacts
        const { artifact, flatCode } = await bre.run(TASK_ARAGON_ARTIFACT_GET)
        const manifest = readJson<AragonManifest>(manifestName)
        writeJson(path.join(appBuildOutputPath, artifactName), artifact)
        writeJson(path.join(appBuildOutputPath, manifestName), manifest)
        fs.writeFileSync(path.join(appBuildOutputPath, flatCodeName), flatCode)

        // Validate release files
        _validateRelease(appBuildOutputPath)

        // Upload release directory to IPFS
        const contentHash = await uploadReleaseToIpfs(appBuildOutputPath, {
          ignorePatterns: ipfsIgnore
        })
        logMain(`Release directory uploaded to IPFS: ${contentHash}`)

        // Generate tx to publish new app to aragonPM
        const versionInfo = {
          version: nextVersion,
          contractAddress,
          contentUri: contentHash
        }

        const { to, methodName, params } = await publishVersion(
          appId,
          versionInfo,
          environment,
          {
            managerAddress
          }
        )
        logMain(
          `Successfully generate tx data. Will publish ${appName} ${nextVersion}:
          
          to: ${to}
          methodName: ${methodName}
          params: ${params}
          `
        )

        if (!noVerify) {
          // Etherscan verification
          await bre.run(TASK_VERIFY_CONTRACT, {
            contractName,
            address: contractAddress
            // TODO: constructorArguments
          })
          logMain(`Successfully verified contract.`)
        }
      }
    )
}

/**
 *
 */
function _validateRelease(distPath: string) {
  // Load files straight from the dist directory
  const artifact = readJson<AragonArtifact>(path.join(distPath, artifactName))
  const manifest = readJson<AragonManifest>(path.join(distPath, manifestName))
  const flatCode = readFile(path.join(distPath, flatCodeName))
  const functions = parseContractFunctions(flatCode, artifact.path)

  // Make sure all declared files in the manifest are there
  const missingFiles = findMissingManifestFiles(manifest, distPath)
  if (missingFiles.length)
    throw new BuidlerPluginError(
      `
Some files declared in manifest.json are not found in dist dir: ${distPath}
${missingFiles.map(file => ` - ${file.id}: ${file.path}`).join('\n')}
      
Make sure your app build process includes them in the dist directory on
every run of the designated NPM build script
`
    )

  // Make sure that the roles in the contract match the ones in arapp.json
  const roleMatchErrors = matchContractRoles(functions, artifact.roles)
  if (roleMatchErrors.length)
    throw new BuidlerPluginError(
      `
Some contract roles do not match declared roles in ${arappName}:
${roleMatchErrors.map(err => ` - ${err.id}: ${err.message}`).join('\n')}
`
    )
}
