import { ethers } from 'ethers'
import * as repo from './repo'
import { apmRegistryAbi } from './abis'
import { getAppNameParts } from '../appName'
import { BuidlerPluginError } from '@nomiclabs/buidler/plugins'

/**
 * Asserts that a sender has permissions to publish a new version / repo
 * Otherwise will throw an error with a detailed message
 * @param appName "finance.aragonpm.eth"
 * @param sender Account attempting to publish "0xE04cAbcB24e11620Dd62bB99c396E76cEB578914"
 * @param provider Initialized ethers provider
 */
export async function assertCanPublish(
  appName: string,
  sender: string,
  provider: ethers.providers.Provider
): Promise<void> {
  const repoAddress = await provider.resolveName(appName)

  if (repoAddress) {
    // If the repo exists, check if user has create version role
    const isAllowed = await repo.canPublishVersion(appName, sender, provider)
    if (!isAllowed)
      throw new BuidlerPluginError(
        `Account ${sender} does not have permissions to publish a new version in repo ${appName}`
      )
  } else {
    // If the repo does not exist yet, create a repo with the first version
    const { registryName } = getAppNameParts(appName)
    const registryAddress = await provider.resolveName(registryName)

    if (!registryAddress)
      throw new BuidlerPluginError(`Registry ${registryName} does not exist`)

    const registry = new ethers.Contract(
      registryAddress,
      apmRegistryAbi,
      provider
    )
    const CREATE_REPO_ROLE = await registry.CREATE_REPO_ROLE()
    const isAllowed = await registry.canPerform(sender, CREATE_REPO_ROLE, [])
    if (!isAllowed)
      throw new BuidlerPluginError(
        `Account ${sender} does not have permissions to create a new repo in registry ${registryName}`
      )
  }
}
