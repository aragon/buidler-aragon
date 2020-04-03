import Web3 from 'web3'
import { TruffleEnvironmentArtifacts } from '@nomiclabs/buidler-truffle5/src/artifacts'
import {
  KernelContract,
  KernelInstance,
  ACLContract,
  ACLInstance,
  DAOFactoryContract,
  DAOFactoryInstance
} from '~/typechain'
import { getLog } from '~/src/utils/getLog'

/**
 * Deploys a new DAO with direct/pure interaction with aragonOS.
 * @returns DAO's Kernel TruffleContract.
 */
export async function createDao(
  web3: Web3,
  artifacts: TruffleEnvironmentArtifacts,
  daoFactoryAddress: string
): Promise<KernelInstance> {
  const rootAccount: string = (await web3.eth.getAccounts())[0]

  // Create a DAO instance using the factory.
  const DAOFactory: DAOFactoryContract = artifacts.require('DAOFactory')
  const daoFactory: DAOFactoryInstance = await DAOFactory.at(daoFactoryAddress)
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
