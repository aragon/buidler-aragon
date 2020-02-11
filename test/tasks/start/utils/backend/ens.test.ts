import { assert } from 'chai'
import { useDefaultEnvironment } from '~/test/test-helpers/useEnvironment'
import { ENSInstance } from '~/typechain'
import { createEns } from '~/src/tasks/start/utils/backend/ens'
import { isNonZeroAddress } from '~/test/test-helpers/isNonZeroAddress'

describe('ens.ts', function() {
  useDefaultEnvironment()

  describe('when an ens instance is deployed', async function() {
    let ens: ENSInstance

    before('deploy ens instance', async function() {
      ens = await createEns(this.env.web3, this.env.artifacts)
    })

    it('deploys an ens instance with a valid address', function() {
      assert(isNonZeroAddress(ens.address), 'Invalid contract address.')
    })

    it('sets the deploying address as the owner of the first record', async function() {
      const rootAccount = (await this.env.web3.eth.getAccounts())[0]

      const owner = await ens.owner('0x0')
      assert.equal(owner, rootAccount, 'Invalid owner for the ens first node')
    })
  })
})
