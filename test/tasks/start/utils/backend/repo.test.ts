import { assert } from 'chai'
import { resolveRepo } from '~/src/tasks/start/utils/backend/repo'
import deployAragonBases from '~/src/tasks/start/utils/backend/bases'
import { useEnvironment } from '~/test/test-helpers/useEnvironment'
import { getAppName, getAppEnsName } from '~/src/tasks/start/utils/arapp'
import { getAppId } from '~/src/tasks/start/utils/id'
import {
  startGanache,
  stopGanache
} from '~/src/tasks/start/utils/backend/ganache'

describe.only('repo.ts', function() {
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
    describe('when calling resolveRepo()', async function() {
      before('call resolveRepo', async function() {
        await resolveRepo(
          appName,
          appId,
          this.env.web3,
          this.env.artifacts,
          ensAddress,
          apmAddress
        )
      })

      it('produces a repo with a valid address', async function() {
        // TODO
      })

      it('<test repo functions>', async function() {
        // TODO
      })

      describe('when bumping a repo', async function() {
        // TODO: Remove logs from util and emit them from main functions.

        before('bump repo', async function() {
          // TODO
        })

        it('updates the repo version', async function() {
          // TODO
        })
      })

      describe('when the target repo exists', async function() {
        describe('when calling resolveRepo() again', async function() {
          before('call resolveRepo', async function() {
            await resolveRepo(
              appName,
              appId,
              this.env.web3,
              this.env.artifacts,
              ensAddress,
              apmAddress
            )
          })

          it('does not generate transactions', async function() {
            // TODO
          })
        })
      })
    })
  })
})
