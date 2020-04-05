import { namehash } from '~/src/utils/namehash'

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
    return namehash(fullAppName)
  }
}

/**
 * Returns the parts of an appName split by shortName and registry
 * @param appName "finance.aragonpm.eth"
 */
export function getAppNameParts(
  appName: string
): { shortName: string; registryName: string } {
  const nameParts = getFullAppName(appName).split('.')
  return {
    shortName: nameParts[0],
    registryName: nameParts.slice(1).join('.')
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
  if (!appName) throw Error(`appName is not defined`)
  // Already full ENS domain
  if (appName.includes('.')) return appName
  // Concat with registry
  return `${appName}.${registry}`
}
