import { BuidlerPluginError } from '@nomiclabs/buidler/plugins'
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'
import { Ens } from './resolveEns'
import {
  RepoContract,
  RepoInstance,
  APMRegistryContract,
  APMRegistryInstance
} from '~/typechain'
import { getLog } from '../../start/utils/backend/logs'
import semver from 'semver'

interface ApmRepoVersion {
  semanticVersion: [string, string, string]
  contractAddress: string
  contentURI: string
}

export default async function apmNewVersion(
  {
    bump,
    contractAddress,
    contentHash,
    appEnsName,
    developerAddress,
    registryAddress
  }: {
    bump: string
    contractAddress: string
    contentHash: string
    appEnsName: string
    developerAddress?: string
    registryAddress: string
  },
  bre: BuidlerRuntimeEnvironment
): Promise<{ versionId: number; version: string }> {
  const contentURI = `0x${Buffer.from(`ipfs:${contentHash}`).toString('hex')}`

  const ens = Ens({
    registryAddress,
    provider: bre.web3.currentProvider
  })

  const repoAddress = await ens.lookup(appEnsName)

  if (repoAddress) {
    // If repo address exists, release a new version
    const Repo: RepoContract = artifacts.require('Repo')
    const repo: RepoInstance = await Repo.at(repoAddress)
    const currentRelease: ApmRepoVersion = (await repo.getLatest()) as any
    const currentVersion = arrayToVersion(currentRelease.semanticVersion)
    const nextVersion = bumpSemver(currentVersion, bump)
    if (currentRelease.contractAddress !== contractAddress && bump !== 'major')
      throw new BuidlerPluginError(
        `Contract address has changed, bump must be major`
      )

    const txResponse = await repo.newVersion(
      versionToArray(nextVersion),
      contractAddress,
      contentURI
    )
    const versionId: string = getLog(txResponse, 'NewVersion', 'versionId')

    return { versionId: parseInt(versionId), version: nextVersion }
  } else {
    // If repo does not exists, create and release
    const initialVersion = bumpSemver('0.0.0', bump)
    if (!developerAddress)
      throw new BuidlerPluginError(
        `a developerAddress must be provided to release the initial version of a repo`
      )

    const apmRegistryName = getAppNameRegistry(appEnsName)
    const apmRegistryAddress = await ens.lookup(apmRegistryName)
    if (!apmRegistryAddress)
      throw new BuidlerPluginError(
        `APM registry ${apmRegistryName} does not exist. Is your app name correct? '${appEnsName}'`
      )
    const APMRegistry: APMRegistryContract = artifacts.require('APMRegistry')
    const apmRegistry: APMRegistryInstance = await APMRegistry.at(
      apmRegistryAddress
    )

    await apmRegistry.newRepoWithVersion(
      appEnsName,
      developerAddress,
      versionToArray(initialVersion),
      contractAddress,
      contentURI
    )
    return { versionId: 0, version: initialVersion }
  }
}

/**
 * Returns the APM registry of an app name
 * @param ensName "finance.custompm.eth"
 * @return "custompm.eth"
 */
function getAppNameRegistry(ensName: string): string {
  return ensName
    .split('.')
    .slice(1)
    .join('.')
}

/**
 * Wrapper since semver.inc happily returns null if bump is not valid
 * @param version "0.2.0"
 * @param bump "major"
 * @return "1.0.0"
 */
function bumpSemver(version: string, bump: string): string {
  const nextVersion = semver.inc(version, bump)
  if (!nextVersion) throw Error(`Invalid bump: ${bump}`)
  return nextVersion
}

/**
 * Util to convert a semver in string format to APM repo array form
 * @param version "1.2.3"
 * @return ["1", "2", "3"]
 */
function versionToArray(version: string): [string, string, string] {
  const major = semver.major(version)
  const minor = semver.minor(version)
  const patch = semver.patch(version)
  return [String(major), String(minor), String(patch)]
}

/**
 * Util to convert a semver in APM repo array form to string format
 * @param versionArray ["1", "2", "3"]
 * @return "1.2.3"
 */
function arrayToVersion(versionArray: [string, string, string]): string {
  const version = versionArray.slice(0, 3).join('.')
  if (!semver.valid(version))
    throw Error(`Invalid semver array: ${versionArray}`)
  return version
}
