import {
  RepoContract,
  RepoInstance,
  APMRegistryInstance,
  ENSInstance,
  PublicResolverContract,
  PublicResolverInstance
} from '~/typechain'
import Web3 from 'web3'
import { TruffleEnvironmentArtifacts } from '@nomiclabs/buidler-truffle5/src/artifacts'
import { logBack } from '../logger'
import { getLog } from './helpers'

const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

/**
 * Attempts to retrieve an APM repository for the app, and if it can't
 * find one, creates a new repository for the app.
 * @returns Promise<RepoInstance> An APM repository for the app.
 */
export async function createRepo(
  appName: string,
  appId: string,
  web3: Web3,
  artifacts: TruffleEnvironmentArtifacts,
  ens: ENSInstance,
  apmRegistry: APMRegistryInstance
): Promise<RepoInstance> {
  // Try resolving the Repo address from ENS with the PublicResolver, or create the Repo if ZERO_ADDR is retrieved.
  const PublicResolver: PublicResolverContract = artifacts.require(
    'PublicResolver'
  )
  const resolver: PublicResolverInstance = await PublicResolver.new(ens.address)
  let repoAddress: string = await resolver.addr(appId)

  if (repoAddress === ZERO_ADDR) {
    repoAddress = await _createRepo(appName, web3, apmRegistry)
  }

  // Wrap Repo address with abi.
  const Repo: RepoContract = artifacts.require('Repo')
  const repo: RepoInstance = await Repo.at(repoAddress)

  return repo
}

/**
 * Bump APM repository with a new version.
 */
export async function majorBumpRepo(
  repo: RepoInstance,
  implementation: Truffle.ContractInstance,
  appServePort: number
): Promise<void> {
  // Calculate next valid semver.
  const semver: [number, number, number] = [
    (await repo.getVersionsCount()).toNumber() + 1, // Updates to smart contracts require major bump.
    0,
    0
  ]
  logBack(`Repo version: ${semver.join('.')}`)

  // URI where this plugin is serving the app's front end.
  const contentURI = `0x${Buffer.from(
    `http://localhost:${appServePort}`
  ).toString('hex')}`

  // Create a new version in the app's repo, with the new implementation.
  await repo.newVersion(semver, implementation.address, contentURI)
}

/**
 * Creates a new APM repository.
 * @returns Promise<RepoInstance> An APM repository for the app.
 */
async function _createRepo(
  appName: string,
  web3: Web3,
  apmRegistry: APMRegistryInstance
): Promise<string> {
  const rootAccount: string = (await web3.eth.getAccounts())[0]

  // Create new repo.
  const txResponse: Truffle.TransactionResponse = await apmRegistry.newRepo(
    appName,
    rootAccount
  )

  // Retrieve repo address from creation tx logs.
  const repoAddress: string = getLog(txResponse, 'NewRepo', 'repo')

  return repoAddress
}
