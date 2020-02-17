import { assert } from 'chai'
import { isNonZeroAddress } from '~/test/test-helpers/isNonZeroAddress'
import { deployImplementation } from '~/src/tasks/start/backend/deploy-implementation'
import { useDefaultEnvironment } from '~/test/test-helpers/useEnvironment'

describe('deploy-implementation.ts', function() {
  useDefaultEnvironment()

  describe('when deploying an implementation of an app', function() {
    let implementation: Truffle.ContractInstance

    before('deploy an implementation of an app', async function() {
      implementation = await deployImplementation(this.env.artifacts)
    })

    it('deploys a contract with a valid address', async function() {
      assert.equal(
        isNonZeroAddress(implementation.address),
        true,
        'Invalid contract address.'
      )
    })
  })
})
