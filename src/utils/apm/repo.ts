import { ethers } from 'ethers'
import { repoAbi } from './abis'
import { parseApmVersionReturn, toApmVersionArray, isAddress } from './utils'
import { ApmVersion, ApmVersionReturn, ApmRepoInstance } from './types'
import { getFullAppName } from '../appName'

/**
 * Internal logic shared with single and all version fetchers
 * @param repo Initialized ethers APM Repo contract
 * @param version Version to fetch: 'latest', '0.2.0', 14
 */
async function _getRepoVersion(
  repo: ApmRepoInstance,
  version: string | number
): Promise<ApmVersion> {
  const res: ApmVersionReturn =
    typeof version === 'number'
      ? await repo.getByVersionId(version)
      : version === 'latest'
      ? await repo.getLatest()
      : await repo.getBySemanticVersion(toApmVersionArray(version))
  return parseApmVersionReturn(res)
}

/**
 * Return a Repo instance of an ethers contract
 * @param appId "finance", "finance.aragonpm.eth", "0xa600c17..."
 * @param provider Initialized ethers provider
 */
function _getRepoInstance(
  appId: string,
  provider: ethers.providers.Provider
): ApmRepoInstance {
  const addressOrFullEnsName = isAddress(appId) ? appId : getFullAppName(appId) // Make sure appId is a full ENS domain
  return new ethers.Contract(
    addressOrFullEnsName,
    repoAbi,
    provider
  ) as ApmRepoInstance
}

/**
 * Fetch a single version of an APM Repo
 * @param repoNameOrAddress "finance", "finance.aragonpm.eth", "0xa600c17..."
 * @param version Version to fetch: 'latest', '0.2.0', 14
 * @param provider Initialized ethers provider
 */
export function getRepoVersion(
  repoNameOrAddress: string,
  version: 'latest' | string | number = 'latest',
  provider: ethers.providers.Provider
): Promise<ApmVersion> {
  const repo = _getRepoInstance(repoNameOrAddress, provider)
  return _getRepoVersion(repo, version)
}

/**
 * Returns true if the address can publish a new version to this repo
 * @param repoNameOrAddress "finance", "finance.aragonpm.eth", "0xa600c17..."
 * @param sender Account attempting to publish "0xE04cAbcB24e11620Dd62bB99c396E76cEB578914"
 * @param provider Initialized ethers provider
 */
export async function canPublishVersion(
  repoNameOrAddress: string,
  sender: string,
  provider: ethers.providers.Provider
): Promise<boolean> {
  const repo = _getRepoInstance(repoNameOrAddress, provider)
  const CREATE_VERSION_ROLE = await repo.CREATE_VERSION_ROLE()
  return await repo.canPerform(sender, CREATE_VERSION_ROLE, [])
}
