import { assert } from 'chai'
import { useDefaultEnvironment } from '~/test/test-helpers/useEnvironment'
import { deployImplementation } from '~/src/tasks/start/utils/backend/app'
import { createProxy, updateProxy } from '~/src/tasks/start/utils/backend/proxy'
import { getAppEnsName } from '~/src/tasks/start/utils/arapp'
import { getAppId } from '~/src/tasks/start/utils/id'
import { setAllPermissionsOpenly } from '~/src/tasks/start/utils/backend/permissions'
import { readArapp } from '~/src/tasks/start/utils/arapp'
import {
  createDao,
  createDaoFactory
} from '~/src/tasks/start/utils/backend/dao'

describe.only('proxy.ts', function() {
  let dao, implementation, proxy

  describe('when in the counter project', async function() {
    useDefaultEnvironment()

    before('create a dao and an app implementation', async function() {
      ;({ dao, implementation } = await _createDaoAndAppImplementation(
        this.env.web3,
        this.env.artifacts
      ))
    })

    describe('when creating a counter proxy', async function() {
      before('create a counter proxy and set permissions', async function() {
        const appId = getAppId(getAppEnsName())

        proxy = await createProxy(
          implementation,
          appId,
          dao,
          this.env.web3,
          this.env.artifacts,
          []
        )

        const arapp = readArapp()
        await setAllPermissionsOpenly(
          dao,
          proxy,
          arapp,
          this.env.web3,
          this.env.artifacts
        )
      })

      it('allows any address to increment the counter', async function() {
        let value

        value = (await proxy.value()).toString()
        assert.equal(value, 0, 'Incorrect init value on proxy')

        await proxy.increment(1)

        value = (await proxy.value()).toString()
        assert.equal(value, 1, 'Incorrect init value on proxy')
      })

      describe.skip('when updating the counter proxy', async function() {})
    })
  })

  describe.skip('when in the token-wrapper project', async function() {})
})

async function _createDaoAndAppImplementation(
  web3,
  artifacts
): Promise<{ dao: any; implementation: any }> {
  const daoFactory = await createDaoFactory(artifacts)

  const dao = await createDao(web3, artifacts, daoFactory.address)

  const implementation = await deployImplementation(artifacts)

  return { dao, implementation }
}
