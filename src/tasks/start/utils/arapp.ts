import * as fs from 'fs'
import * as path from 'path'
import { AragonAppJson } from '~/src/types'
import { BuidlerPluginError } from '@nomiclabs/buidler/plugins'

const arappPath = 'arapp.json'
const contractsPath = './contracts'

/**
 * Reads and parses an arapp.json file.
 * @return AragonAppJson
 */
export function readArapp(): AragonAppJson {
  return JSON.parse(fs.readFileSync(arappPath, 'utf-8'))
}

/**
 * Returns app ens name.
 * @return "voting.open.aragonpm.eth"
 */
export function getAppEnsName(): string {
  const arapp = readArapp()

  const defaultEnvironment = arapp.environments.default
  if (!defaultEnvironment) {
    throw new BuidlerPluginError('Default environemnt not found in arapp.json')
  }

  return defaultEnvironment.appName
}

/**
 * Validates ens names.
 * Requires ens names to be in the form <name>.aragonpm.eth.
 */
export function isValidEnsNameForDevelopment(ensName: string): boolean {
  let isValid = true

  const comps = ensName.split('.')
  const name = comps[0]
  const domain = comps[1]
  const ext = comps[2]

  // Enforces ens names in the form <name>.aragonpm.eth.
  isValid = comps.length !== 3 ? false : isValid
  isValid = name.toLowerCase() !== name ? false : isValid
  isValid = domain !== 'aragonpm' ? false : isValid
  isValid = ext !== 'eth' ? false : isValid

  return isValid
}

/**
 * Returns app name.
 * @return "voting"
 */
export function getAppName(): string {
  const ensName = getAppEnsName()

  return ensName.split('.')[0]
}

/**
 * Returns main contract path.
 * @return "./contracts/Counter.sol"
 */
export function getMainContractPath(): string {
  // Read the path from arapp.json.
  if (fs.existsSync(arappPath)) {
    const arapp = readArapp()

    return arapp.path
  }

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
