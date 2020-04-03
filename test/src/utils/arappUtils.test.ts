import { assert } from 'chai'
import {
  getMainContractName,
  getMainContractPath,
  readArapp
} from '~/src/utils/arappUtils'
import { useDefaultEnvironment } from '~/test/test-helpers/useEnvironment'

describe('arapp.ts', function() {
  useDefaultEnvironment()

  it('should read an arapp.json file', async function() {
    const arapp = await readArapp()
    assert(arapp != null)
  })

  it('should retrieve the correct main contract path', function() {
    assert.equal(
      getMainContractPath(),
      'contracts/Counter.sol',
      'Incorrect main contract path.'
    )
  })

  it('should retrieve the correct main contract name', function() {
    assert.equal(getMainContractName(), 'Counter')
  })
})
