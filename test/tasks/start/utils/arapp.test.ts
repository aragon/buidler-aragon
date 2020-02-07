import { assert } from 'chai'
import {
  getMainContractName,
  getMainContractPath,
  getAppName,
  getAppEnsName,
  readArapp,
  isValidEnsNameForDevelopment
} from '~/src/tasks/start/utils/arapp'
import { useDefaultEnvironment } from '~/test/test-helpers/useEnvironment'

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

  it('should validate ens names for development', async function() {
    assert.equal(isValidEnsNameForDevelopment('voting.aragonpm.eth'), true)
    assert.equal(
      isValidEnsNameForDevelopment('voting.open.aragonpm.eth'),
      false
    )
    assert.equal(isValidEnsNameForDevelopment('Voting.aragonpm.eth'), false)
    assert.equal(isValidEnsNameForDevelopment('voting.aragon.eth'), false)
    assert.equal(isValidEnsNameForDevelopment('voting.aragonpm.btc'), false)
  })
})
