import { assert } from 'chai'
import deployBases from '~/src/tasks/start/backend/bases/deploy-bases'
import { createApp } from '~/src/tasks/start/backend/create-app'
import { createDao } from '~/src/tasks/start/backend/create-dao'
import { setAllPermissionsOpenly } from '~/src/tasks/start/backend/set-permissions'
import { updateApp } from '~/src/tasks/start/backend/update-app'
import { useEnvironment } from '~/test/test-helpers/useEnvironment'
import { TASK_COMPILE } from '~/src/tasks/task-names'
import { itBehavesLikeACounterContract } from './counter-behavior'
import {
  startGanache,
  stopGanache
} from '~/src/tasks/start/backend/start-ganache'
import { readArapp, parseAppName } from '~/src/utils/arappUtils'
import { getAppId } from '~/src/utils/appName'
import { AragonAppJson } from '~/src/types'

describe('update-app.ts', function() {
  // Note: These particular tests use localhost instead of buidlerevm.
  // This is required for bases to have the expected addresses,
  // And because we want to restart the chain on certain tests.
  useEnvironment('counter', 'localhost')

  let arapp: AragonAppJson, appName: string
  let ensAddress, daoFactoryAddress
  let dao

  before('Read arapp in test folder after useEnviornment chdir', () => {
    arapp = readArapp()
    appName = parseAppName(arapp)
  })

  before('start ganache', async function() {
    await startGanache(this.env)
  })

  before('deploy bases', async function() {
    ;({ ensAddress, daoFactoryAddress } = await deployBases(this.env))
  })

  before('deploy a dao', async function() {
    dao = await createDao(this.env.web3, this.env.artifacts, daoFactoryAddress)
  })

  after('stop ganache', async function() {
    stopGanache()
  })

  describe('when an app is created', function() {
    let proxy, repo, implementation

    before('create app', async function() {
      ;({ proxy, repo, implementation } = await createApp(
        { appName, dao, ensAddress },
        this.env
      ))

      await proxy.initialize()

      const arapp = readArapp()
      await setAllPermissionsOpenly(
        dao,
        proxy,
        arapp,
        this.env.web3,
        this.env.artifacts
      )

      // Necessary for using behaviors.
      this.proxy = proxy
    })

    describe('when updating the app', function() {
      let implementationAddress, version, uri

      const port = 666

      before('update app', async function() {
        // Compile to avoid getting a tx nonce error.
        // Appears to be a caching issue with truffle/ganache.
        await this.env.run(TASK_COMPILE)
        ;({ implementationAddress, version, uri } = await updateApp(
          { appName, dao, repo, appServePort: port },
          this.env
        ))
      })

      it('uses a different implementation', function() {
        assert.notEqual(implementation.addresses, implementationAddress)
      })

      it('the dao references the correct implementation for it', async function() {
        const appId = getAppId(appName)
        assert.equal(
          implementationAddress,
          await dao.getApp(await dao.APP_BASES_NAMESPACE(), appId),
          'Incorrect implementation in proxy'
        )
      })

      describe('when interacting with the proxy', function() {
        it('proxy references the dao that created it', async function() {
          assert.equal(
            dao.address,
            await proxy.kernel(),
            'Incorrect kernel in proxy'
          )
        })

        itBehavesLikeACounterContract()
      })

      describe('when interacting with the repo', function() {
        it('returns a valid version count', async function() {
          const count = (await repo.getVersionsCount()).toString()
          assert.equal(count, 1, 'Invalid version count')
        })

        it('reports the correct content uri', async function() {
          assert.equal(uri, `http://localhost:${port}`)
        })

        it('reports the correct repo version', async function() {
          assert.equal(version[0], 1, 'Incorrect major version')
        })

        it('updates the repo version', async function() {
          const latest = (await repo.getLatest())[0]
          const major = latest[0].toNumber()
          assert.equal(major, 1, 'Incorrect major version')
        })
      })
    })
  })
})
