import { assert } from 'chai'
import { validateEnsName } from '~/src/utils/validateEnsName'

describe('validateEnsName.ts', function() {
  it('should validate ens names for development', async function() {
    assert.equal(validateEnsName('voting.aragonpm.eth'), true)
    assert.equal(validateEnsName('voting.open.aragonpm.eth'), false)
    assert.equal(validateEnsName('Voting.aragonpm.eth'), false)
    assert.equal(validateEnsName('voting.aragon.eth'), false)
    assert.equal(validateEnsName('voting.aragonpm.btc'), false)
  })
})
