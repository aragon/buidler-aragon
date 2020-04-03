import Web3 from 'web3'
import { TruffleEnvironmentArtifacts } from '@nomiclabs/buidler-truffle5/src/artifacts'
import { KernelInstance } from '~/typechain'
import { ANY_ADDRESS } from '~/src/params'
import { AragonAppJson } from '~/src/types'

export const DUMMY_BYTES =
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

/**
 * Scans arapp.json, setting all permissions to ANY_ADDRESS.
 */
export async function setAllPermissionsOpenly(
  dao: KernelInstance,
  app: any, // TODO: needs type
  arapp: AragonAppJson,
  web3: Web3,
  artifacts: TruffleEnvironmentArtifacts
): Promise<void> {
  const rootAccount: string = (await web3.eth.getAccounts())[0]

  // Retrieve ACL.
  const aclAddress = await dao.acl()
  const ACL = artifacts.require('ACL')
  const acl = await ACL.at(aclAddress)

  // Sweep all roles found in arapp.json.
  for (const role of arapp.roles) {
    const permission = await app[role.id]()

    // Set permission to ANY_ADDRESS (max uint256), which is interpreted by
    // the ACL as giving such permission to all addresses.
    await acl.createPermission(
      ANY_ADDRESS,
      app.address,
      permission,
      rootAccount,
      { from: rootAccount }
    )
  }

  // Additionally, set a placeholder permission, so that the app
  // shows in the client even if it doesn't specify permissions yet.
  acl.createPermission(ANY_ADDRESS, app.address, DUMMY_BYTES, rootAccount)
}
