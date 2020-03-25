import { ethers } from 'ethers'

const DEFAULT_APM_REGISTRY = 'aragonpm.eth'

/**
 * Returns true if a string looks like hex
 * @param maybeHex
 */
function seemsHex(maybeHex: string): boolean {
  return maybeHex.startsWith('0x')
}

/**
 * Returns the hashed appId given a partial or full app name
 * @param appNameOrId "finance" | "finance.aragonpm.eth"
 * @param registry If appName is a partial ENS domain, provide a custom registry
 */
export function getAppId(appNameOrId: string, registry?: string): string {
  if (seemsHex(appNameOrId)) {
    // Is already an appId
    return appNameOrId
  } else {
    const fullAppName = getFullAppName(appNameOrId, registry)
    return ethers.utils.namehash(fullAppName)
  }
}

/**
 * Returns the full ENS domain app name
 * @param appName "finance" | "finance.aragonpm.eth"
 * @param registry "open.aragonpm.eth"
 */
export function getFullAppName(
  appName: string,
  registry = DEFAULT_APM_REGISTRY
): string {
  // Already full ENS domain
  if (appName.includes('.')) return appName
  // Concat with registry
  return `${appName}.${registry}`
}
