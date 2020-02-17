import { TruffleEnvironmentArtifacts } from '@nomiclabs/buidler-truffle5/src/artifacts'
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

/**
 * Deploys a new DAOFactory with direct/pure interaction with aragonOS.
 * @returns DAOFactory's instance.
 */
export async function deployDaoFactory(
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
