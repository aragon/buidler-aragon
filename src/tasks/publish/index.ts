import { task, types } from '@nomiclabs/buidler/config'
import { BuidlerPluginError } from '@nomiclabs/buidler/plugins'
import {
  BuidlerRuntimeEnvironment,
  HttpNetworkConfig
} from '@nomiclabs/buidler/types'
import {
  zeroAddress,
  etherscanSupportedChainIds,
  defaultIpfsGateway,
  etherscanChainUrls,
  defaultIpfsApiUrl
} from '../../params'
import execa from 'execa'
import { TASK_COMPILE, TASK_VERIFY_CONTRACT, TASK_PUBLISH } from '../task-names'
import { logMain } from '../../ui/logger'
import { AragonConfig } from '~/src/types'
import {
  uploadDirToIpfs,
  assertIpfsApiIsAvailable,
  guessGatewayUrl
} from '~/src/utils/ipfs'
import createIgnorePatternFromFiles from './createIgnorePatternFromFiles'
import parseAndValidateBumpOrVersion from './parseAndValidateBumpOrVersion'
import { getMainContractName } from '../../utils/arappUtils'
import * as apm from '~/src/utils/apm'
import { generateArtifacts, validateArtifacts } from '~/src/utils/artifact'
import { getFullAppName } from '~/src/utils/appName'
import { ethers } from 'ethers'
import { getPrettyPublishTxPreview, getPublishTxOutput } from './prettyOutput'
import { encodePublishVersionTxData } from '~/src/utils/apm'
import { getRootAccount } from '~/src/utils/accounts'

/**
 * Sets up the publish task
 * Note: Tasks must be setup in a function. If task() is run in the
 * module body on test teardown, they will not be setup again
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
      'ipfsApiUrl',
      'IPFS API URL to connect to an ipfs daemon API server',
      'http://localhost:5001',
      types.string
    )
    .addFlag(
      'onlyContent',
      'Prevents contract compilation, deployment and artifact generation.'
    )
    .addFlag('noVerify', 'Prevents etherscan verification.')
    .addFlag('dryRun', 'Output tx data without broadcasting')
    .setAction(
      async (
        params,
        bre: BuidlerRuntimeEnvironment
      ): Promise<apm.PublishVersionTxData> => {
        // Do param type verification here and call publishTask with clean params
        return await publishTask(
          {
            bumpOrVersion: params.bump,
            existingContractAddress: params.contract,
            managerAddress: params.managerAddress,
            ipfsApiUrl: params.ipfsApiUrl,
            onlyContent: params.onlyContent,
            noVerify: params.noVerify,
            dryRun: params.dryRun
          },
          bre
        )
      }
    )
}

async function publishTask(
  {
    bumpOrVersion,
    existingContractAddress,
    managerAddress,
    ipfsApiUrl: ipfsApiUrlArg,
    onlyContent,
    noVerify,
    dryRun
  }: {
    bumpOrVersion: string
    existingContractAddress: string
    managerAddress: string
    ipfsApiUrl: string
    onlyContent: boolean
    noVerify: boolean
    dryRun: boolean
  },
  bre: BuidlerRuntimeEnvironment
): Promise<apm.PublishVersionTxData> {
  const aragonConfig = bre.config.aragon as AragonConfig
  const appSrcPath = aragonConfig.appSrcPath as string
  const distPath = aragonConfig.appBuildOutputPath as string
  const ignoreFilesPath = aragonConfig.ignoreFilesPath as string
  const selectedNetwork = bre.network.name
  const ipfsApiUrl =
    ipfsApiUrlArg || (bre.config.aragon || {}).ipfsApi || defaultIpfsApiUrl
  // TODO: Warn the user their metadata files (e.g. appName) are not correct.

  const appName = _parseAppNameFromConfig(aragonConfig.appName, selectedNetwork)
  const contractName = getMainContractName()
  const rootAccount = await getRootAccount(bre)

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

  // Do sanity checks before compiling the contract or uploading files
  // So users do not have to wait a long time before seeing the config is not okay
  if (!rootAccount)
    throw new BuidlerPluginError(
      `No account configured. Provide a mnemonic or private key for ${selectedNetwork} in `
    )
  await apm.assertCanPublish(appName, rootAccount, provider)
  await assertIpfsApiIsAvailable(ipfsApiUrl)

  // Using let + if {} block instead of a ternary operator
  // to assign value and log status to console
  let contractAddress: string
  if (onlyContent) {
    contractAddress = zeroAddress
    logMain('No contract used for this version')
  } else if (existingContractAddress) {
    contractAddress = existingContractAddress
    logMain(`Using provided contract address: ${contractAddress}`)
  } else if (!prevVersion || bump === 'major') {
    logMain('Deploying new implementation contract')
    contractAddress = await _deployMainContract(contractName, noVerify, bre)
    logMain(`New implementation contract address: ${contractAddress}`)
  } else {
    contractAddress = prevVersion.contractAddress
    logMain(`Reusing previous version contract address: ${contractAddress}`)
  }

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
  const contentHash = await uploadDirToIpfs({
    dirPath: distPath,
    ipfsApiUrl,
    ignore: createIgnorePatternFromFiles(ignoreFilesPath)
  })
  logMain(`Release assets uploaded to IPFS: ${contentHash}`)

  // Generate tx to publish new app to aragonPM
  const versionInfo = {
    version: nextVersion,
    contractAddress,
    contentUri: apm.toContentUri('ipfs', contentHash)
  }

  const network = await provider.getNetwork()
  if (!managerAddress) managerAddress = rootAccount
  const txData = await apm.publishVersion(appName, versionInfo, provider, {
    managerAddress
  })

  const ipfsGateway =
    (bre.config.aragon || {}).ipfsGateway || defaultIpfsGateway
  const activeIpfsGateway = await guessGatewayUrl({
    ipfsApiUrl,
    ipfsGateway,
    contentHash
  })

  logMain(
    getPrettyPublishTxPreview({
      txData,
      appName,
      nextVersion,
      bump,
      contractAddress,
      contentHash,
      ipfsGateway: activeIpfsGateway || ipfsGateway
    })
  )

  if (dryRun) {
    logMain(getPublishTxOutput.dryRun({ txData, rootAccount }))
  } else {
    const etherscanTxUrl = etherscanChainUrls[network.chainId]

    const receipt = await bre.web3.eth
      .sendTransaction({
        from: rootAccount,
        to: txData.to,
        data: encodePublishVersionTxData(txData)
      })
      .on('transactionHash', (hash: string) => {
        logMain(getPublishTxOutput.txHash(hash, etherscanTxUrl))
      })
    logMain(getPublishTxOutput.receipt(receipt))
  }

  // For testing
  return txData
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
  const chainId = await _getChainId(bre)
  if (!noVerify && etherscanSupportedChainIds.has(chainId)) {
    try {
      logMain('Verifying on Etherscan')
      await bre.run(TASK_VERIFY_CONTRACT, {
        contractName,
        address: mainContract.address
      })
      logMain(`Successfully verified contract on Etherscan`)
    } catch (e) {
      logMain(`Etherscan verification failed. ${e} `)
    }
  }
  return mainContract.address
}

/**
 * Isolates logic to fix buidler issue that swaps web3 version when running the tests
 * It potentially loads version 1.2.1 instead of 1.2.6 where web3.eth.getChainId
 * is not a function and causes an error
 */
async function _getChainId(bre: BuidlerRuntimeEnvironment): Promise<number> {
  const provider = new ethers.providers.Web3Provider(bre.web3.currentProvider)
  const net = await provider.getNetwork()
  return net.chainId
}

/**
 * Utility to parse appName from the aragon config
 * @param appNameOrObj
 * @param network
 */
function _parseAppNameFromConfig(
  appNameOrObj: string | { [network: string]: string } | undefined,
  network: string
): string {
  switch (typeof appNameOrObj) {
    case 'string':
      if (!appNameOrObj)
        throw new BuidlerPluginError(
          `appName must not be empty in buidler.config`
        )
      return appNameOrObj

    case 'object':
      if (!appNameOrObj[network])
        throw new BuidlerPluginError(
          `No appName defined for network '${network}' in buidler.config`
        )
      else return appNameOrObj[network]

    default:
      throw new BuidlerPluginError(
        `appName is buidler.config is of type ${typeof appNameOrObj}
It must a string or an object { [network]: appName}`
      )
  }
}
