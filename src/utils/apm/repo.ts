import { ethers } from 'ethers'
import { repoAbi } from './abis'
import {
  parseApmVersionReturn,
  toApmVersionArray,
  getFetchUrlFromContentUri,
  fetchJson
} from './utils'
import {
  ApmVersion,
  ApmVersionReturn,
  ApmRepoInstance,
  AragonApmRepoData
} from './types'
import { AragonManifest, AragonArtifact } from '~/src/types'
import { isAddress } from 'web3-utils'
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

/* eslint-disable @typescript-eslint/explicit-function-return-type */
export function Repo(
  provider: ethers.providers.Provider,
  optionsGlobal?: { ipfsGateway?: string }
) {
  /**
   * Returns ApmRepoInstance ethers contract instance
   * Make sure appId is a full ENS domain
   * @param appId
   */
  function _getApmRepoInstance(appId: string): ApmRepoInstance {
    const addressOrFullEnsName = isAddress(appId)
      ? appId
      : getFullAppName(appId)
    return new ethers.Contract(
      addressOrFullEnsName,
      repoAbi,
      provider
    ) as ApmRepoInstance
  }

  return {
    /**
     * Fetch a single version of an APM Repo
     * @param appId 'finance.aragonpm.eth'
     * @param version Version to fetch: 'latest', '0.2.0', 14
     * @param provider Initialized ethers provider
     */
    getVersion: async function(
      appId: string,
      version: 'latest' | string | number = 'latest'
    ): Promise<ApmVersion> {
      const repo = _getApmRepoInstance(appId)
      return _getRepoVersion(repo, version)
    },

    /**
     * Fetch a single version of an APM Repo and resolve its contents
     * @param appId 'finance.aragonpm.eth'
     * @param version Version to fetch: 'latest', '0.2.0', 14
     * @param options additional options to process version data
     * @param options.ipfsGateway 'http://localhost:8080' | 'https://my-remote-ipfs.io'
     */
    getVersionContent: async function(
      appId: string,
      version: 'latest' | string | number = 'latest',
      options?: { ipfsGateway?: string }
    ): Promise<AragonApmRepoData> {
      const versionInfo = await this.getVersion(appId, version)

      const { contentUri } = versionInfo
      const ipfsGateway =
        (options || {}).ipfsGateway || (optionsGlobal || {}).ipfsGateway
      const url = getFetchUrlFromContentUri(contentUri, { ipfsGateway })

      const [manifest, artifact] = await Promise.all([
        fetchJson<AragonManifest>(`${url}/manifest.json`),
        fetchJson<AragonArtifact>(`${url}/artifact.json`)
      ])

      return {
        ...versionInfo,
        ...manifest,
        ...artifact
      }
    }
  }
}
