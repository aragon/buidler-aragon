import { assert } from 'chai'
import { deployDaoFactory } from '~/src/tasks/start/backend/bases/deploy-dao-factory'
import { isNonZeroAddress } from '~/test/test-helpers/isNonZeroAddress'
import { DAOFactoryInstance } from '~/typechain'
import { useDefaultEnvironment } from '~/test/test-helpers/useEnvironment'

describe('deploy-dao-factory.ts', function() {
  useDefaultEnvironment()

  describe('when a dao factory is created', async function() {
    let daoFactory: DAOFactoryInstance

    before('create a dao factory', async function() {
      daoFactory = await deployDaoFactory(this.env.artifacts)
    })

    it('deploys a dao factory with a valid address', function() {
      assert(isNonZeroAddress(daoFactory.address), 'Invalid contract address.')
    })

    it('links to a valid Kernel base', async function() {
      assert(isNonZeroAddress(await daoFactory.baseKernel()))
    })

    it('links to a valid ACL base', async function() {
      assert(isNonZeroAddress(await daoFactory.baseACL()))
    })

    it('links to a valid  EVMScriptRegistryFactory base', async function() {
      assert(isNonZeroAddress(await daoFactory.regFactory()))
    })
  })
})
