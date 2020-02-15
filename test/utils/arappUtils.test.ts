import { assert } from 'chai'
import { useDefaultEnvironment } from '~/test/test-helpers/useEnvironment'
import {
  getMainContractName,
  getMainContractPath,
  getAppName,
  getAppEnsName,
  readArapp
} from '~/src/utils/arappUtils'

describe('arapp.ts', function() {
  useDefaultEnvironment()

  it('should read an arapp.json file', async function() {
    const arapp = await readArapp()
    assert(arapp != null)
  })

  it('should retrieve app name', async function() {
    assert.equal(await getAppName(), 'counter')
  })

  it('should retrieve app ens-name', async function() {
    assert.equal(await getAppEnsName(), 'counter.aragonpm.eth')
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
