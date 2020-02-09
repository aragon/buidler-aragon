import { getMainContractName } from '../arapp'
import { TruffleEnvironmentArtifacts } from '@nomiclabs/buidler-truffle5/src/artifacts'
import * as Ui from '../../ui/ui'

/**
 * Deploys the app's current contract.
 * @returns Promise<Truffle.Contract<any>> The deployed TruffleContract instance
 * for the app's main contract.
 */
export async function deployImplementation(
  artifacts: TruffleEnvironmentArtifacts
): Promise<Truffle.ContractInstance> {
  const mainContractName: string = getMainContractName()

  // Deploy the main contract.
  const App: Truffle.Contract<any> = artifacts.require(mainContractName)
  const implementation: Truffle.ContractInstance = await App.new()

  Ui.setInfo({ implementationAddress: implementation.address })

  return implementation
}
