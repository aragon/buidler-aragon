import path from 'path'
import execa from 'execa'
import { task, types } from '@nomiclabs/buidler/config'
import { BuidlerPluginError } from '@nomiclabs/buidler/plugins'
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'
import {
  publishVersion,
  getApmRepoVersion,
  getAragonArtifact,
  parseContractFunctions
} from '@aragon/toolkit'
import {
  artifactName,
  manifestName,
  flatCodeName,
  zeroAddress
} from '../../params'
import { writeFile, readJson, writeJson } from '../../utils/fsUtils'
import {
  TASK_COMPILE,
  TASK_VERIFY_CONTRACT,
  TASK_PUBLISH,
  TASK_FLATTEN_GET_FLATTENED_SOURCE
} from '../task-names'
import { logMain } from '../../ui/logger'
import { AragonConfig } from '~/src/types'
import { AragonManifest, ApmVersion } from './types'
import uploadReleaseToIpfs from './uploadDistToIpfs'
import parseAndValidateBumpOrVersion from './parseAndValidateBumpOrVersion'
import validateRelease from './validateRelease'
import readArtifacts from './readArtifacts'
import {
  getMainContractName,
  getAppEnsName,
  getAppName,
  getAppId,
  readArapp
} from '../../utils/arappUtils'
import encodePublishVersionTxData from './encodePublishVersionTxData'

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
      const distPath = config.appBuildOutputPath as string

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
          return zeroAddress
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
          if (!noVerify) {
            logMain('Verifying on Etherscan')
            await bre.run(TASK_VERIFY_CONTRACT, {
              contractName,
              address: contractAddress
              // TODO: constructorArguments
            })
            logMain(`Successfully verified contract on Etherscan`)
          }
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
      const arapp = readArapp()
      const manifest = readJson<AragonManifest>(manifestName)
      const abi = readArtifacts(contractName)
      const flatCode = await _flatten(bre)
      const contractFunctions = parseContractFunctions(flatCode, contractName)
      const artifact = getAragonArtifact(arapp, contractFunctions, abi)
      writeJson(path.join(distPath, artifactName), artifact)
      writeJson(path.join(distPath, manifestName), manifest)
      writeFile(path.join(distPath, flatCodeName), flatCode)

      // Validate release files
      validateRelease(distPath)

      // Upload release directory to IPFS
      logMain('Uploading release assets to IPFS...')
      const contentHash = await uploadReleaseToIpfs(distPath, {
        ipfsProvider,
        ignorePatterns: ipfsIgnore
      })
      logMain(`Release assets uploaded to IPFS: ${contentHash}`)

      // Generate tx to publish new app to aragonPM
      const versionInfo = {
        version: nextVersion,
        contractAddress,
        contentUri: contentHash
      }

      const txData = await publishVersion(appId, versionInfo, environment, {
        managerAddress
      })

      logMain(
        `Successfully generated TX data for publishing ${appName} version ${nextVersion}

  to: ${txData.to}
  data: ${encodePublishVersionTxData(txData)}
`
      )
    }
  )

/**
 * Returns flatten source code
 * # TODO: Of which contract?
 * # TODO: Verify that buidler's flatten algorythm supports cyclic imports
 * @param bre
 */
async function _flatten(bre: BuidlerRuntimeEnvironment): Promise<string> {
  try {
    return await bre.run(TASK_FLATTEN_GET_FLATTENED_SOURCE)
  } catch (e) {
    throw new BuidlerPluginError(
      `Your contract constains a cyclic dependency. You can:
  - Remove unnecessary import statements, if any
  - Abstract the interface of imported contracts in a separate file
  - Merge multiple contracts in a single .sol file
`
    )
  }
}
