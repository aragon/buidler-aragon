import { ENSContract, ENSFactoryContract, ENSInstance } from '~/typechain'
import { TruffleEnvironmentArtifacts } from '@nomiclabs/buidler-truffle5/src/artifacts'
import Web3 from 'web3'
import { getLog } from '~/src/utils/getLog'

/**
 * Deploys a new ENS instance using a ENSFactory.
 * @returns ENS's instance.
 */
export async function deployEns(
  web3: Web3,
  artifacts: TruffleEnvironmentArtifacts
): Promise<ENSInstance> {
  const rootAccount: string = (await web3.eth.getAccounts())[0]

  // Retrieve contract artifacts.
  const ENS: ENSContract = artifacts.require('ENS')
  const ENSFactory: ENSFactoryContract = artifacts.require('ENSFactory')

  // Deploy a ENSFactory.
  const factory = await ENSFactory.new()
  const txResponse = await factory.newENS(rootAccount)
  // Find the created ENS instance address from the transaction logs.
  const ensAddress: string = getLog(txResponse, 'DeployENS', 'ens')
  const ens: ENSInstance = await ENS.at(ensAddress)

  return ens
}
