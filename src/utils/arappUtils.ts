import * as fs from 'fs'
import * as path from 'path'
import { BuidlerPluginError } from '@nomiclabs/buidler/plugins'
import { AragonAppJson } from '~/src/types'
import { pathExists, readJson, readJsonIfExists } from './fsUtils'

const arappPath = 'arapp.json'
const contractsPath = './contracts'

/**
 * Reads and parses an arapp.json file.
 * @return AragonAppJson
 */
export function readArapp(): AragonAppJson {
  if (!pathExists(arappPath))
    throw new BuidlerPluginError(
      `No ${arappPath} found in current working directory\n ${process.cwd()}`
    )
  return readJson(arappPath)
}

/**
 * Reads and parses an arapp.json file only if exists
 * otherwise returns undefined
 */
export function readArappIfExists(): AragonAppJson | undefined {
  return readJsonIfExists(arappPath)
}

/**
 * Returns main contract path.
 * @return "./contracts/Counter.sol"
 */
export function getMainContractPath(): string {
  // Read the path from arapp.json.
  const arapp = readArappIfExists()
  if (arapp) return arapp.path

  // Try to guess contract path.
  if (fs.existsSync(contractsPath)) {
    const contracts: string[] = fs.readdirSync(contractsPath)

    const candidates: string[] = contracts.filter(
      name => name.endsWith('.sol') || name !== 'Imports.sol'
    )

    if (candidates.length === 1) {
      return path.join(contractsPath, candidates[0])
    }
  }

  throw Error(`Unable to find main contract path.`)
}

/**
 * Returns main contract name.
 * @return "Counter"
 */
export function getMainContractName(): string {
  const mainContractPath: string = getMainContractPath()
  return path.parse(mainContractPath).name
}

/**
 * Parse the appName from arapp.json in a flexible manner
 * @param arapp
 * @param network
 */
export function parseAppName(arapp: AragonAppJson, network?: string): string {
  if (!arapp.appName && !arapp.environments)
    throw new BuidlerPluginError(
      `No appName configured. 
Add an 'appName' property in your arapp.json with your app's ENS name`
    )

  // Aggreate app names from environments
  const appNameByNetwork: { [network: string]: string } = {}
  for (const [_network, env] of Object.entries(arapp.environments)) {
    if (env.appName) appNameByNetwork[_network] = env.appName
  }

  // If there an appName for that network return it
  if (network && appNameByNetwork[network]) return appNameByNetwork[network]

  // If there's a default appName return it
  if (arapp.appName) {
    return arapp.appName
  } else {
    // Otherwise, try to guess the appName

    // Pre-compute booleans to make logic below readable
    const appNamesArr = Object.values(appNameByNetwork)
    const thereAreNames = appNamesArr.length > 0
    const allNamesAreEqual = appNamesArr.every(name => name === appNamesArr[0])

    if (thereAreNames && allNamesAreEqual) return appNamesArr[0]

    // If no guess was possible ask the user to provide it
    const networkId = network || 'development' // Don't print "undefined" for development
    throw new BuidlerPluginError(
      `No appName configured for network ${networkId}. 
Add an 'appName' property in the environment of ${networkId} with your app's 
ENS name in your arapp.json. If your app's name is the name accross networks,
Add an 'appName' property in your arapp.json with your app's ENS name`
    )
  }
}
