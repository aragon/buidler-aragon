import { assert } from 'chai'
import { useDefaultEnvironment } from '~/test/test-helpers/useEnvironment'
import { deployImplementation } from '~/src/tasks/start/backend/app'
import { createProxy, updateProxy } from '~/src/tasks/start/backend/proxy'
import { getAppEnsName } from '~/src/tasks/start/utils/arapp'
import { getAppId } from '~/src/tasks/start/utils/id'
import { setAllPermissionsOpenly } from '~/src/tasks/start/backend/permissions'
import { readArapp } from '~/src/tasks/start/utils/arapp'
import { createDao, createDaoFactory } from '~/src/tasks/start/backend/dao'

describe('proxy.ts', function() {
  let dao, implementation, proxy, appId

  describe('when in the counter project', async function() {
    useDefaultEnvironment()

    const itBehavesLikeACounterContract = function(): void {
      it('allows any address to increment and decrement the counter', async function() {
        let value

        value = (await proxy.value()).toString()
        assert.equal(value, 0, 'Incorrect value on proxy')

        await proxy.increment(1)

        value = (await proxy.value()).toString()
        assert.equal(value, 1, 'Incorrect value on proxy')

        await proxy.decrement(1)

        value = (await proxy.value()).toString()
        assert.equal(value, 0, 'Incorrect value on proxy')
      })
    }

    before('create a dao and an app implementation', async function() {
      ;({ dao, implementation } = await _createDaoAndAppImplementation(
        this.env.web3,
        this.env.artifacts
      ))
    })

    describe('when creating a counter proxy', async function() {
      before('create a counter proxy and set permissions', async function() {
        appId = getAppId(getAppEnsName())

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

      it('references the dao that created it', async function() {
        assert.equal(
          dao.address,
          await proxy.kernel(),
          'Incorrect kernel in proxy'
        )
      })

      it('the dao references the correct implementation for it', async function() {
        assert.equal(
          implementation.address,
          await dao.getApp(await dao.APP_BASES_NAMESPACE(), appId),
          'Incorrect implementation in proxy'
        )
      })

      it('reports the correct hardcoded version', async function() {
        const version = (await proxy.getVersion()).toString()

        assert.equal(version, '0', 'Incorrect counter proxy version')
      })

      itBehavesLikeACounterContract()

      describe('when updating the counter proxy', async function() {
        let newImplementation

        before('deploy new implementation', async function() {
          const CounterV1 = this.env.artifacts.require('CounterV1')

          newImplementation = await CounterV1.new()
        })

        before('update the proxy', async function() {
          await updateProxy(newImplementation, appId, dao, this.env.web3)
        })

        it('the dao references the correct implementation for it', async function() {
          assert.equal(
            newImplementation.address,
            await dao.getApp(await dao.APP_BASES_NAMESPACE(), appId),
            'Incorrect implementation in proxy'
          )
        })

        it('reports the correct hardcoded version', async function() {
          const version = (await proxy.getVersion()).toString()

          assert.equal(version, '1', 'Incorrect counter proxy version')
        })

        itBehavesLikeACounterContract()
      })
    })
  })
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
