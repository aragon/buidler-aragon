import { task, types } from '@nomiclabs/buidler/config'
import { BuidlerPluginError } from '@nomiclabs/buidler/plugins'
import {
  BuidlerRuntimeEnvironment,
  HttpNetworkConfig
} from '@nomiclabs/buidler/types'
import { zeroAddress, etherscanSupportedChainIds } from '../../params'
import execa from 'execa'
import { TASK_COMPILE, TASK_VERIFY_CONTRACT, TASK_PUBLISH } from '../task-names'
import { logMain } from '../../ui/logger'
import { AragonConfig } from '~/src/types'
import uploadReleaseToIpfs from './uploadDistToIpfs'
import parseAndValidateBumpOrVersion from './parseAndValidateBumpOrVersion'
import { getMainContractName } from '../../utils/arappUtils'
import * as apm from '~/src/utils/apm'
import { generateArtifacts, validateArtifacts } from '~/src/utils/artifact'
import { getFullAppName } from '~/src/utils/appName'
import { ethers } from 'ethers'

/**
 * Sets up the publish task
 * Note: Tasks must be setup in a function. If task() is run in the
 * module body on test teardown the they will not be setup again
 */
export function setupPublishTask(): void {
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
    .setAction(async (params, bre: BuidlerRuntimeEnvironment) => {
      // Do param type verification here and call publishTask with clean params
      await publishTask(
        {
          bumpOrVersion: params.bump,
          existingContractAddress: params.contract,
          managerAddress: params.managerAddress,
          ipfsProvider: params.ipfsProvider,
          onlyContent: params.onlyContent,
          noVerify: params.noVerify
        },
        bre
      )
    })
}

async function publishTask(
  {
    bumpOrVersion,
    existingContractAddress,
    managerAddress,
    ipfsProvider,
    onlyContent,
    noVerify
  }: {
    bumpOrVersion: string
    existingContractAddress: string
    managerAddress: string
    ipfsProvider: string
    onlyContent: boolean
    noVerify: boolean
  },
  bre: BuidlerRuntimeEnvironment
): Promise<void> {
  const aragonConfig = bre.config.aragon as AragonConfig
  const appSrcPath = aragonConfig.appSrcPath as string
  const distPath = aragonConfig.appBuildOutputPath as string
  const ipfsIgnore = ['subfolder/to/ignore/**'] // Hardcoded until a better way to deal with dynamic ENS address is found
  const selectedNetwork = bre.network.name
  // ### Todo: Add logic to guess app name from file?
  const appName =
    typeof aragonConfig.appName === 'string'
      ? aragonConfig.appName
      : typeof aragonConfig.appName === 'object'
      ? aragonConfig.appName[selectedNetwork]
      : undefined
  if (!appName)
    throw new BuidlerPluginError(`appName must be defined in buidler.config`)
  const contractName = getMainContractName()

  // Initialize clients
  const networkConfig = bre.network.config as HttpNetworkConfig
  const provider = new ethers.providers.Web3Provider(
    bre.web3.currentProvider,
    networkConfig.ensAddress && {
      name: bre.network.name,
      chainId: networkConfig.chainId || 5555,
      ensAddress: networkConfig.ensAddress
    }
  )

  const prevVersion = await _getLastestVersionIfExists(appName, provider)

  const { bump, nextVersion } = parseAndValidateBumpOrVersion(
    bumpOrVersion,
    prevVersion ? prevVersion.version : undefined
  )
  logMain(`Applying version bump ${bump}, next version: ${nextVersion}`)

  // Using let + if {} block instead of a ternary operator
  // to assign value and log status to console
  let contractAddress: string
  if (onlyContent) {
    logMain('No contract used for this version')
    contractAddress = zeroAddress
  } else if (existingContractAddress) {
    logMain('Using provided contract address')
    contractAddress = existingContractAddress
  } else if (!prevVersion || bump === 'major') {
    logMain('Deploying new implementation contract')
    contractAddress = await _deployMainContract(contractName, noVerify, bre)
  } else {
    logMain('Reusing contract from previous version')
    contractAddress = prevVersion.contractAddress
  }
  logMain(`contractAddress: ${contractAddress}`)

  // Prepare release directory
  // npm run build must create: index.html, src.js, script.js
  logMain(`Building app front-end at ${appSrcPath}`)
  await execa('npm', ['run', 'build'], { cwd: appSrcPath })

  // Generate and validate Aragon artifacts, release files
  logMain(`Generating Aragon app artifacts`)
  await generateArtifacts(distPath, bre)
  validateArtifacts(distPath)

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
    contentUri: apm.toContentUri('ipfs', contentHash)
  }

  const txData = await apm.publishVersion(appName, versionInfo, provider, {
    managerAddress
  })

  logMain(
    `Successfully generated TX data for publishing ${appName} version ${nextVersion}

to: ${txData.to}
data: ${apm.encodePublishVersionTxData(txData)}
`
  )
}

/**
 * Returns latest version given a partial or full appName
 * Returns undefined if repo does not exists
 * @param appName "finance" | "finance.aragonpm.eth"
 * @param provider
 */
async function _getLastestVersionIfExists(
  appName: string,
  provider: ethers.providers.Provider
): Promise<apm.ApmVersion | undefined> {
  const fullAppName = getFullAppName(appName)
  // Check ENS name first since ethers causes an UnhandledPromiseRejectionWarning
  const repoAddress = await provider.resolveName(fullAppName)
  if (!repoAddress) return

  // Check for latest version but expect errors
  try {
    return await apm.getRepoVersion(repoAddress, 'latest', provider)
  } catch (e) {
    if (e.message.includes('ENS name not configured')) return
    throw e
  }
}

/**
 * Deploys a new implementation contract and returns its address
 * @param contractName
 * @param noVerify
 * @param bre
 */
async function _deployMainContract(
  contractName: string,
  noVerify: boolean,
  bre: BuidlerRuntimeEnvironment
): Promise<string> {
  // Compile contracts
  await bre.run(TASK_COMPILE)
  // Deploy contract
  const MainContract = bre.artifacts.require(contractName)
  const mainContract = await MainContract.new()
  logMain('Implementation contract deployed')
  const chainId = await bre.web3.eth.getChainId()
  if (!noVerify && etherscanSupportedChainIds.has(chainId)) {
    logMain('Verifying on Etherscan')
    await bre.run(TASK_VERIFY_CONTRACT, {
      contractName,
      address: mainContract.address
      // TODO: constructorArguments
    })
    logMain(`Successfully verified contract on Etherscan`)
  }
  return mainContract.address
}
