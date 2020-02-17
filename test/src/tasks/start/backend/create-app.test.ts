import { assert } from 'chai'
import { assertRevert } from '~/test/test-helpers/assertRevert'
import deployBases from '~/src/tasks/start/backend/bases/deploy-bases'
import { createApp } from '~/src/tasks/start/backend/create-app'
import { createDao } from '~/src/tasks/start/backend/create-dao'
import { useEnvironment } from '~/test/test-helpers/useEnvironment'
import { isNonZeroAddress } from '~/test/test-helpers/isNonZeroAddress'
import { setAllPermissionsOpenly } from '~/src/tasks/start/backend/set-permissions'
import {
  startGanache,
  stopGanache
} from '~/src/tasks/start/backend/start-ganache'
import {
  readArapp,
  getAppEnsName,
  getAppId,
  getAppName
} from '~/src/utils/arappUtils'

describe.only('create-app.ts', function() {
  // Note: These particular tests use localhost instead of buidlerevm.
  // This is required for bases to have the expected addresses,
  // And because we want to restart the chain on certain tests.
  useEnvironment('counter', 'localhost')

  let ensAddress, apmAddress, daoFactoryAddress
  let appName, appId
  let dao

  before('start ganache', async function() {
    await startGanache(this.env)
  })

  before('deploy bases', async function() {
    ;({ ensAddress, apmAddress, daoFactoryAddress } = await deployBases(
      this.env
    ))
  })

  before('deploy a dao', async function() {
    dao = await createDao(this.env.web3, this.env.artifacts, daoFactoryAddress)
  })

  before('calculate appName and appId', async function() {
    appName = getAppName()
    appId = getAppId(getAppEnsName())
  })

  after('stop ganache', async function() {
    stopGanache()
  })

  describe('when an app is created', function() {
    let proxy, repo, implementation

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

    before('create app', async function() {
      ;({ proxy, repo, implementation } = await createApp(
        appName,
        appId,
        dao,
        [],
        ensAddress,
        apmAddress,
        this.env
      ))

      const arapp = readArapp()
      await setAllPermissionsOpenly(
        dao,
        proxy,
        arapp,
        this.env.web3,
        this.env.artifacts
      )
    })

    it('dao references the correct implementation for it', async function() {
      assert.equal(
        implementation.address,
        await dao.getApp(await dao.APP_BASES_NAMESPACE(), appId),
        'Incorrect implementation in proxy'
      )
    })

    it('produces a repo with a valid address', async function() {
      assert(isNonZeroAddress(repo.address), 'Invalid contract address.')
    })

    it('reverts when attempting to create the app again', async function() {
      await assertRevert(
        createApp(appName, appId, dao, [], ensAddress, apmAddress, this.env),
        'KERNEL_INVALID_APP_CHANGE'
      )
    })

    describe('when interacting with the repo', function() {
      it('returns a valid version count', async function() {
        const count = (await repo.getVersionsCount()).toString()
        assert.equal(count, 0, 'Invalid version count')
      })

      it('returns the expected latest version', async function() {
        await assertRevert(repo.getLatest(), 'REPO_INEXISTENT_VERSION')
      })
    })

    describe('when interacting with the proxy', function() {
      it('proxy references the dao that created it', async function() {
        assert.equal(
          dao.address,
          await proxy.kernel(),
          'Incorrect kernel in proxy'
        )
      })

      it('reports the correct hardcoded version', async function() {
        const version = (await proxy.getVersion()).toString()

        assert.equal(version, '0', 'Incorrect counter proxy version')
      })

      itBehavesLikeACounterContract()
    })
  })
})
