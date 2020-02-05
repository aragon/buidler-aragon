import {
  KernelContract,
  KernelInstance,
  ACLContract,
  ACLInstance,
  DAOFactoryContract,
  DAOFactoryInstance,
  EVMScriptRegistryFactoryContract,
  EVMScriptRegistryFactoryInstance
} from '~/typechain'
import { TruffleEnvironmentArtifacts } from '@nomiclabs/buidler-truffle5/src/artifacts'
import Web3 from 'web3'
import { getLog } from './logs'

/**
 * Deploys a new DAO with direct/pure interaction with aragonOS.
 * @returns DAO's Kernel TruffleContract.
 */
export async function createDao(
  web3: Web3,
  artifacts: TruffleEnvironmentArtifacts,
  daoFactory: DAOFactoryInstance
): Promise<KernelInstance> {
  const rootAccount: string = (await web3.eth.getAccounts())[0]

  // Create a DAO instance using the factory.
  const txResponse: Truffle.TransactionResponse = await daoFactory.newDAO(
    rootAccount
  )

  // Find the created DAO instance address from the transaction logs.
  const daoAddress: string = getLog(txResponse, 'DeployDAO', 'dao')

  // Use the DAO address to construct a full KernelInstance object.
  const Kernel: KernelContract = artifacts.require('Kernel')
  const dao: KernelInstance = await Kernel.at(daoAddress)

  // Give rootAccount the ability to manage apps.
  const aclAddress: string = await dao.acl()
  const ACL: ACLContract = artifacts.require('ACL')
  const acl: ACLInstance = await ACL.at(aclAddress)
  await acl.createPermission(
    rootAccount,
    dao.address,
    await dao.APP_MANAGER_ROLE(),
    rootAccount,
    { from: rootAccount }
  )

  return dao
}

/**
 * Deploys a new DAOFactory with direct/pure interaction with aragonOS.
 * @returns DAOFactory's instance.
 */
export async function createDaoFactory(
  artifacts: TruffleEnvironmentArtifacts
): Promise<DAOFactoryInstance> {
  // Retrieve contract artifacts.
  const Kernel: KernelContract = artifacts.require('Kernel')
  const ACL: ACLContract = artifacts.require('ACL')
  const EVMScriptRegistryFactory: EVMScriptRegistryFactoryContract = artifacts.require(
    'EVMScriptRegistryFactory'
  )
  const DAOFactory: DAOFactoryContract = artifacts.require('DAOFactory')

  // Deploy a DAOFactory.
  const kernelBase: KernelInstance = await Kernel.new(
    true /*petrifyImmediately*/
  )
  const aclBase: ACLInstance = await ACL.new()
  const registryFactory: EVMScriptRegistryFactoryInstance = await EVMScriptRegistryFactory.new()
  const daoFactory: DAOFactoryInstance = await DAOFactory.new(
    kernelBase.address,
    aclBase.address,
    registryFactory.address
  )

  return daoFactory
}
