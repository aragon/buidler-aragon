import { assert } from 'chai'
import { createDao } from '~/src/tasks/start/backend/create-dao'
import { deployDaoFactory } from '~/src/tasks/start/backend/bases/deploy-dao-factory'
import { isNonZeroAddress } from '~/test/test-helpers/isNonZeroAddress'
import { KernelInstance, DAOFactoryInstance } from '~/typechain'
import { useDefaultEnvironment } from '~/test/test-helpers/useEnvironment'

describe('dao.ts', function() {
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

    describe('when a dao is created', function() {
      let dao: KernelInstance

      before('create a dao', async function() {
        dao = await createDao(
          this.env.web3,
          this.env.artifacts,
          daoFactory.address
        )
      })

      it('deploys a dao with a valid address', function() {
        assert(isNonZeroAddress(dao.address), 'Invalid contract address.')
      })

      it('has a valid ACL', async function() {
        assert(isNonZeroAddress(await dao.acl()), 'Invalid acl address.')
      })

      it('has been initialized', async function() {
        assert.equal(await dao.hasInitialized(), true, 'DAO not initialized.')
      })
    })
  })
})
