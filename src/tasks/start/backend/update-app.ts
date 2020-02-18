import Web3 from 'web3'
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'
import { RepoInstance, KernelInstance } from '~/typechain'
import { deployImplementation } from './deploy-implementation'

export async function updateApp(
  appId: string,
  dao: KernelInstance,
  repo: RepoInstance,
  appServePort: number,
  bre: BuidlerRuntimeEnvironment
): Promise<{
  implementationAddress: string
  version: [number, number, number]
  uri: string
}> {
  // Deploy a new app implementation.
  const implementation = await deployImplementation(bre.artifacts)

  // Update the proxy with the new implementation.
  await _updateProxy(implementation.address, appId, dao, bre.web3)

  // Update the repo with the new implementation.
  const { version, uri } = await _updateRepo(
    repo,
    implementation.address,
    appServePort
  )

  return { implementationAddress: implementation.address, version, uri }
}

/**
 * Updates the app proxy's implementation in the Kernel.
 */
async function _updateProxy(
  implementationAddress: string,
  appId: string,
  dao: KernelInstance,
  web3: Web3
): Promise<void> {
  const rootAccount: string = (await web3.eth.getAccounts())[0]

  // Set the new implementation in the Kernel.
  await dao.setApp(
    await dao.APP_BASES_NAMESPACE(),
    appId,
    implementationAddress,
    {
      from: rootAccount
    }
  )
}

/**
 * Bump APM repository with a new version.
 */
async function _updateRepo(
  repo: RepoInstance,
  implementationAddress: string,
  appServePort: number
): Promise<{ version: [number, number, number]; uri: string }> {
  // Calculate next valid semver.
  const semver: [number, number, number] = [
    (await repo.getVersionsCount()).toNumber() + 1, // Updates to smart contracts require major bump.
    0,
    0
  ]

  // URI where this plugin is serving the app's front end.
  const contentUri = `http://localhost:${appServePort}`
  const contentUriBytes = `0x${Buffer.from(contentUri).toString('hex')}`

  // Create a new version in the app's repo, with the new implementation.
  await repo.newVersion(semver, implementationAddress, contentUriBytes)

  return { version: semver, uri: contentUri }
}
