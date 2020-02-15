import { assert } from 'chai'
import deployAragonBases from '~/src/tasks/start/backend/bases'
import { useEnvironment } from '~/test/test-helpers/useEnvironment'
import { getAppName, getAppEnsName } from '~/src/tasks/start/utils/arapp'
import { getAppId } from '~/src/tasks/start/utils/id'
import { isNonZeroAddress } from '~/test/test-helpers/isNonZeroAddress'
import { assertRevert } from '~/test/test-helpers/assertRevert'
import { startGanache, stopGanache } from '~/src/tasks/start/backend/ganache'
import { resolveRepo, majorBumpRepo } from '~/src/tasks/start/backend/repo'

describe('repo.ts', function() {
  // Note: These particular tests use localhost instead of buidlerevm.
  // This is required for bases to have the expected addresses,
  // And because we want to restart the chain on certain tests.
  useEnvironment('counter', 'localhost')

  let ensAddress, apmAddress
  let appName, appId

  before('start ganache', async function() {
    await startGanache(this.env)
  })

  before('deploy bases', async function() {
    ;({ ensAddress, apmAddress } = await deployAragonBases(this.env))
  })

  before('calculate appName and appId', async function() {
    appName = getAppName()
    appId = getAppId(getAppEnsName())
  })

  after('stop ganache', async function() {
    stopGanache()
  })

  describe('when the target repo does not exist', async function() {
    let repo

    describe('when calling resolveRepo()', async function() {
      before('call resolveRepo', async function() {
        repo = await resolveRepo(
          appName,
          appId,
          this.env.web3,
          this.env.artifacts,
          ensAddress,
          apmAddress
        )
      })

      it('produces a repo with a valid address', async function() {
        assert(isNonZeroAddress(repo.address), 'Invalid contract address.')
      })

      it('returns a valid version count', async function() {
        const count = (await repo.getVersionsCount()).toString()
        assert.equal(count, 0, 'Invalid version count')
      })

      it('returns the expected latest version', async function() {
        await assertRevert(repo.getLatest(), 'REPO_INEXISTENT_VERSION')
      })

      it('reverts when attempting to resolve the repo again', async function() {
        await assertRevert(
          resolveRepo(
            appName,
            appId,
            this.env.web3,
            this.env.artifacts,
            ensAddress,
            apmAddress
          ),
          'ENSSUB_NAME_EXISTS'
        )
      })

      describe('when bumping a repo', async function() {
        let version, uri

        const port = 666

        before('bump repo', async function() {
          ;({ version, uri } = await majorBumpRepo(repo, repo.address, port))
        })

        it('reports the correct repo version', async function() {
          assert.equal(version[0], 1, 'Incorrect major version')
        })

        it('reports the correct content uri', async function() {
          assert.equal(uri, `http://localhost:${port}`)
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
