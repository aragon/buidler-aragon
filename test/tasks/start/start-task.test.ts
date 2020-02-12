import { assert } from 'chai'
import { useEnvironment } from '~/test/test-helpers/useEnvironment'
import { TASK_START } from '~/src/tasks/task-names'
import { execaPipe } from '~/src/tasks/start/utils/execa'

describe.skip('start-task.ts', function() {
  const RUN_TIME = 10000
  let errorThrown

  const itRunsTheStartTask = function() {
    before('run the start task with a kill timeout', async function() {
      // Define the start task process using execa.
      // NOTE #1: Not using this.env.run(TASK_START) because it currently
      // closes open ended tasks.
      // NOTE #2: Notice how no 'await' is used because we don't want
      // to trigger the process just yet.
      const startTaskProcess = execaPipe(
        'npx',
        [
          'buidler',
          TASK_START,
          '--open-browser',
          'false',
          '--network',
          'localhost'
        ],
        {}
      )

      // This will kill the process after it starts.
      setTimeout(() => {
        startTaskProcess.kill('SIGTERM', { forceKillAfterTimeout: 2000 })
      }, RUN_TIME)

      // This triggers the process and captures errors.
      await startTaskProcess.catch(err => {
        errorThrown = err
      })
    })

    it('is closed with the expected SIGTERM error', async function() {
      assert.equal(
        errorThrown.signal,
        'SIGTERM',
        `Unexpected error thrown: ${errorThrown}`
      )
    })
  }

  describe('when running on the counter project', async function() {
    useEnvironment('../projects/counter')
    itRunsTheStartTask()
  })

  describe('when running on the token-wrapper project', async function() {
    useEnvironment('../projects/token-wrapper')
    itRunsTheStartTask()
  })

  it.skip('more tests needed', async function() {})
})
