import { hash as namehash } from 'eth-ens-namehash'
import Web3 from 'web3'
import { TruffleEnvironmentArtifacts } from '@nomiclabs/buidler-truffle5/src/artifacts'
import { getLog } from '../../../utils/getLog'
import {
  DAOFactoryInstance,
  APMRegistryInstance,
  ENSInstance,
  APMRegistryContract,
  RepoContract,
  ENSSubdomainRegistrarContract,
  APMRegistryFactoryContract,
  RepoInstance,
  ENSSubdomainRegistrarInstance,
  APMRegistryFactoryInstance
} from '~/typechain'

const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

/**
 * Deploys a new DAOFactory with direct/pure interaction with aragonOS.
 * @returns DAOFactory's instance.
 */
export async function createApm(
  web3: Web3,
  artifacts: TruffleEnvironmentArtifacts,
  ens: ENSInstance,
  daoFactory: DAOFactoryInstance
): Promise<APMRegistryInstance> {
  const rootAccount: string = (await web3.eth.getAccounts())[0]

  // Retrieve contract artifacts.
  const APMRegistry: APMRegistryContract = artifacts.require('APMRegistry')
  const Repo: RepoContract = artifacts.require('Repo')
  const ENSSubdomainRegistrar: ENSSubdomainRegistrarContract = artifacts.require(
    'ENSSubdomainRegistrar'
  )
  const APMRegistryFactory: APMRegistryFactoryContract = artifacts.require(
    'APMRegistryFactory'
  )

  // Deploy apm base.
  const apmRegistryBase: APMRegistryInstance = await APMRegistry.new()
  const apmRepoBase: RepoInstance = await Repo.new()
  const ensSubdomainRegistrarBase: ENSSubdomainRegistrarInstance = await ENSSubdomainRegistrar.new()

  // Deploy APMFactory.
  const apmFactory: APMRegistryFactoryInstance = await APMRegistryFactory.new(
    daoFactory.address,
    apmRegistryBase.address,
    apmRepoBase.address,
    ensSubdomainRegistrarBase.address,
    ens.address,
    ZERO_ADDR
  )

  // Creating aragonpm.eth subdomain and assigning it to APMRegistryFactory.
  const tldHash = namehash('eth')
  const labelHash = web3.utils.keccak256('aragonpm')
  await ens.setSubnodeOwner(tldHash, labelHash, apmFactory.address)

  // Deploy APMRegistry.
  const txResponse = await apmFactory.newAPM(tldHash, labelHash, rootAccount)
  // Find the created APMRegistry instance address from the transaction logs.
  const apmAddress: string = getLog(txResponse, 'DeployAPM', 'apm')
  const apm: APMRegistryInstance = await APMRegistry.at(apmAddress)

  return apm
}
