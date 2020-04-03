import * as fs from 'fs'
import * as path from 'path'
import { BuidlerPluginError } from '@nomiclabs/buidler/plugins'
import { AragonAppJson, AragonEnvironment } from '~/src/types'
import { readJson, readJsonIfExists } from './fsUtils'

const arappPath = 'arapp.json'
const contractsPath = './contracts'

/**
 * Reads and parses an arapp.json file.
 * @return AragonAppJson
 */
export function readArapp(): AragonAppJson {
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
 * Returns app ens name.
 * @param network "mainnet"
 * @return "voting.open.aragonpm.eth"
 */
export function getAppEnsName(network = 'default'): string {
  const arapp = readArapp()

  const environment: AragonEnvironment | undefined =
    arapp.environments[network] || arapp.environments['default']
  if (!environment) {
    throw new BuidlerPluginError(`Default environemnt not found in arapp.json.`)
  }

  const appEnsName = (environment || {}).appName
  if (!appEnsName)
    throw new BuidlerPluginError(
      `No appName found. You need to setup one for the environment ${environment} in the arapp.json file.`
    )

  return appEnsName
}

/**
 * Returns app name.
 * @param network "mainnet"
 * @return "voting"
 */
export function getAppName(network = 'default'): string {
  const ensName = getAppEnsName(network)

  return (ensName || '').split('.')[0]
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
