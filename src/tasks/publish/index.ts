import { task, types } from '@nomiclabs/buidler/config'
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'
import { BuidlerPluginError } from '@nomiclabs/buidler/plugins'
import { TASK_PUBLISH } from '../task-names'
import { AragonConfig } from '~/src/types'
import { execaPipe } from '../start/utils/execa'
import uploadDirToIpfs from './utils/uploadDirToIpfs'
import apmNewVersion from './utils/apmNewVersion'
import { generateAppArtifacts } from '../start/utils/frontend/app'
import { getMainContractName, getAppEnsName } from '../start/utils/arapp'

const validBumps = ['major', 'minor', 'patch']

/**
 * Main, composite, task. Calls startBackend, then startFrontend,
 * and then returns an unresolving promise to keep the task open.
 */
task(TASK_PUBLISH, 'Publish a new app version')
  .addPositionalParam(
    'bump',
    'Type of bump (major, minor or patch) or version number',
    undefined,
    types.string
  )
  .addOptionalParam(
    'developerAddress',
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
  .setAction(async (taskArgs, bre: BuidlerRuntimeEnvironment) => {
    const bump: string = taskArgs.bump
    const developerAddress: string = taskArgs.developerAddress
    const ipfsProvider: string = taskArgs.ipfsProvider
    const config: AragonConfig = bre.config.aragon as AragonConfig
    const contractName = getMainContractName()
    const appEnsName = getAppEnsName()
    const appSrcPath = config.appSrcPath as string
    const appBuildOutputPath = config.appBuildOutputPath as string
    const ipfsIgnore = ['subfolder/to/ignore/**']
    // Hardcoded until a better way to deal with dynamic ENS address is found
    const registryAddress = '0x5f6F7E8cc7346a11ca2dEf8f827b7a0b612c56a1'

    if (!validBumps.includes(bump))
      throw new BuidlerPluginError(
        `Invalid bump ${bump}, must be: ${validBumps.join(', ')}`
      )

    // Compile contracts
    await bre.run('compile')

    // Deploy contract
    const MainContract = bre.artifacts.require(contractName)
    const mainContract = await MainContract.new()
    const contractAddress = mainContract.address
    /* eslint-disable-next-line no-console */
    console.log(`Implementation contract deployed: ${contractAddress}`)

    // Prepare release directory
    // npm run build must create: index.html, src.js, script.js
    await execaPipe('npm', ['run', 'build'], { cwd: appSrcPath })
    await generateAppArtifacts(appBuildOutputPath, bre.artifacts)

    // Upload release directory to IPFS
    const contentHash = await uploadDirToIpfs(
      appBuildOutputPath,
      ipfsIgnore,
      ipfsProvider
    )
    /* eslint-disable-next-line no-console */
    console.log(`Release directory uploaded to IPFS: ${contentHash}`)

    // Publish new app to aragonPM
    const { versionId, version } = await apmNewVersion(
      {
        appEnsName,
        bump,
        contentHash,
        contractAddress,
        developerAddress,
        registryAddress
      },
      bre
    )
    /* eslint-disable-next-line no-console */
    console.log(`Successfully released version ${versionId}: ${version}`)
  })
