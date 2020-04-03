import Web3 from 'web3'
import { TruffleEnvironmentArtifacts } from '@nomiclabs/buidler-truffle5/src/artifacts'
import { zeroAddress } from '~/src/params'
import { getLog } from '~/src/utils/getLog'
import { namehash } from '~/src/utils/namehash'
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

/**
 * Deploys a new DAOFactory with direct/pure interaction with aragonOS.
 * @returns DAOFactory's instance.
 */
export async function deployApm(
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
    zeroAddress
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
