import semver from 'semver'
import { BuidlerPluginError } from '@nomiclabs/buidler/plugins'
import { APM_INITIAL_VERSIONS, getApmRepo, isValidBump } from '@aragon/toolkit'
//
import { AragonApmRepoData } from './types'

interface CheckBumpReturn {
  initialRepo?: AragonApmRepoData
  prevVersion?: string
  version: string
  shouldDeployContract: boolean
}

export default async function checkBump(
  appId: string,
  bump: string,
  appName: string,
  environment: string
): Promise<CheckBumpReturn> {
  try {
    const initialRepo = await getApmRepo(appName, 'latest', environment)
    const prevVersion = initialRepo.version
    const version = resolveBumpOrVersion(bump, prevVersion)
    const isValid = await isValidBump(appId, prevVersion, version, environment)
    if (!isValid)
      throw new BuidlerPluginError(
        "Version bump is not valid, you have to respect APM's versioning policy.\nCheck the version upgrade rules in the documentation:\n  https://hack.aragon.org/docs/apm-ref.html#version-upgrade-rules"
      )

    return {
      initialRepo,
      prevVersion,
      version,
      shouldDeployContract: semver.major(prevVersion) !== semver.major(version)
    }
  } catch (e) {
    // Repo doesn't exist yet, deploy the first version
    const version = resolveBumpOrVersion(bump, '0.0.0')
    if (!APM_INITIAL_VERSIONS.includes(version)) {
      const validVersionsList = APM_INITIAL_VERSIONS.join(', ')
      throw new BuidlerPluginError(
        `Invalid initial version '${version}', valid values: ${validVersionsList}`
      )
    }
    return {
      version,
      shouldDeployContract: true // assume first version should deploy a contract
    }
  }
}

/**
 * Get bumped version
 * @param {string} bump "minor" | "0.1.4"
 * @param {string} prevVersion Version to bump from: "0.1.0"
 * @return {string} resulting sem version: "0.2.0"
 */
function resolveBumpOrVersion(bump: string, prevVersion: string): string {
  return semver.valid(bump) ? semver.valid(bump) : semver.inc(prevVersion, bump)
}
