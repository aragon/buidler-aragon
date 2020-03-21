import { ethers } from 'ethers'
import semver from 'semver'
import { ApmVersion, AragonJsIntent, PublishVersionTxData } from './types'
import { toApmVersionArray } from './utils'
import { appStorageAbi, apmRegistryAbi } from './abis'

/**
 * Return the kernel address of an aragon app contract
 * @param appId 'finance.aragonpm.eth' | 'aragonpm.eth'
 * @param provider Initialized ethers provider
 */
function _getKernel(
  appId: string,
  provider: ethers.providers.Provider
): Promise<string> {
  const app = new ethers.Contract(appId, appStorageAbi, provider)
  return app.kernel()
}

function _parseAppName(
  appName: string
): { shortName: string; registryName: string } {
  const nameParts = appName.split('.')
  return {
    shortName: nameParts[0],
    registryName: nameParts.slice(1).join('.')
  }
}

/**
 * Return tx data to publish a new version of an APM repo
 * If the repo does not exist yet, it will return a tx to create
 * a new repo and publish first version to its registry
 * @param appId 'finance.aragonpm.eth'
 * @param versionInfo Object with required version info
 * @param options Additional options
 *  - managerAddress: Must be provided to deploy a new repo
 */
export async function publishVersion(
  appId: string,
  versionInfo: ApmVersion,
  provider: ethers.providers.Provider,
  options?: { managerAddress: string }
): Promise<PublishVersionTxData> {
  const { version, contentUri, contractAddress } = versionInfo
  if (!semver.valid(version)) {
    throw new Error(`${version} is not a valid semantic version`)
  }

  const repoAddress = await provider.resolveName(appId)
  const versionArray = toApmVersionArray(version)

  if (repoAddress) {
    // If the repo exists, create a new version in the repo
    return {
      to: repoAddress,
      methodName: 'newVersion',
      params: [versionArray, contractAddress, contentUri]
    }
  } else {
    // If the repo does not exist yet, create a repo with the first version
    const { shortName, registryName } = _parseAppName(appId)
    const registryAddress = await provider.resolveName(registryName)
    const managerAddress = options && options.managerAddress
    if (!registryAddress) throw Error(`Registry ${registryName} does not exist`)
    if (!managerAddress) throw Error('managerAddress must be provided')

    return {
      to: registryAddress,
      methodName: 'newRepoWithVersion',
      params: [
        shortName,
        managerAddress,
        versionArray,
        contractAddress,
        contentUri
      ]
    }
  }
}

/**
 * Wrapps publishVersion to return the tx data formated as an aragon.js intent
 * @param appId 'finance.aragonpm.eth'
 * @param versionInfo Object with required version info
 * @param options Additional options
 *  - managerAddress: Must be provided to deploy a new repo
 */
export async function publishVersionIntent(
  appId: string,
  versionInfo: ApmVersion,
  provider: ethers.providers.Provider,
  options?: { managerAddress: string }
): Promise<AragonJsIntent> {
  const txData = await publishVersion(appId, versionInfo, provider, options)
  const { to, methodName, params } = txData
  return {
    dao: await _getKernel(to, provider),
    proxyAddress: to,
    methodName,
    params,
    targetContract: to
  }
}

/**
 * Returns encoded tx data for publishing a new version
 */
export function encodePublishVersionTxData({
  methodName,
  params
}: {
  methodName: string
  params: any[]
}): string {
  const apmRegistry = new ethers.utils.Interface(apmRegistryAbi)
  return apmRegistry.functions[methodName].encode(params)
}
