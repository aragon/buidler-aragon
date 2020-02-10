import { assert } from 'chai'
import { useEnvironment } from '~/test/test-helpers/useEnvironment'
import { TASK_START } from '~/src/tasks/task-names'
import { execaPipe } from '~/src/tasks/start/utils/execa'
import { AragonConfig, AragonConfigHooks } from '~/src/types'
import tcpPortUsed from 'tcp-port-used'
import * as fs from 'fs-extra'
import path from 'path'

const DEBUG_START_TASK_RUNNER = true
const SHOW_START_TASK_LOGS = true

describe('start-task.ts', function() {
  let config

  describe('while in the counter project', async function() {
    useEnvironment('../projects/counter')

    before('retrieve config', function() {
      config = this.env.config.aragon as AragonConfig
    })

    describe('when the start task is not running', async function() {
      it('shows target ports as free', async function() {
        assert.equal(
          await tcpPortUsed.check(config.appServePort),
          false,
          'appServePort is not free'
        )
        assert.equal(
          await tcpPortUsed.check(config.clientServePort),
          false,
          'clientServePort is not free'
        )
      })
    })

    describe('when the start task is running', async function() {
      before('run start task for a while, then start tests', async function() {
        await runStartTask(45)
      })

      after('kill the start task', function() {
        killStartTask()
      })

      it('uses the target ports', async function() {
        assert.equal(
          await tcpPortUsed.check(config.appServePort),
          true,
          'appServePort is not being used'
        )
        assert.equal(
          await tcpPortUsed.check(config.clientServePort),
          true,
          'clientServePort is not being used'
        )
      })
    })
  })

  describe.only('while in the token-wrapper project', async function() {
    useEnvironment('../projects/token-wrapper')

    before('retrieve config and hooks', function() {
      config = this.env.config.aragon as AragonConfig
    })

    before('delete all logs created by hooks', async function() {
      await config.hooks._deleteLogs()
    })

    /*   preDao?: (bre: BuidlerRuntimeEnvironment) => Promise<void> | void */
    /*   postDao?: ( */
    /*     dao: KernelInstance, */
    /*     bre: BuidlerRuntimeEnvironment */
    /*   ) => Promise<void> | void */
    /*   preInit?: (bre: BuidlerRuntimeEnvironment) => Promise<void> | void */
    /*   postInit?: ( */
    /*     proxy: Truffle.ContractInstance, */
    /*     bre: BuidlerRuntimeEnvironment */
    /*   ) => Promise<void> | void */
    /*   getInitParams?: (bre: BuidlerRuntimeEnvironment) => Promise<any[]> | any[] */
    /*   postUpdate?: ( */
    /*     proxy: Truffle.ContractInstance, */
    /*     bre: BuidlerRuntimeEnvironment */
    /*   ) => Promise<void> | void */

    describe('when the start task is running', async function() {
      before('run start task for a while, then start tests', async function() {
        await runStartTask(20)
      })

      after('kill the start task', function() {
        killStartTask()
      })

      it.skip('uses the target ports', async function() {
        assert.equal(
          await tcpPortUsed.check(config.appServePort),
          true,
          'appServePort is not being used'
        )
        assert.equal(
          await tcpPortUsed.check(config.clientServePort),
          true,
          'clientServePort is not being used'
        )
      })

      it('calls the preDao hook with the dao and the bre', async function() {
        const json = await _readHookLog('preDao')

        assert(json, 'preDao hook log not found')
        assert(json.aragon, 'preDao hook log contains invalid data')
      })
    })
  })
})

// -----------------------------------------------------
// Utils for reading logs created by hooks.
// -----------------------------------------------------

async function _readHookLog(filename): Promise<any | void> {
  const filepath = path.join(
    __dirname,
    '../..//projects/token-wrapper/logs',
    filename
  )

  return new Promise((resolve, reject) => {
    fs.readJSON(filepath, (err, res) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.log(`Error reading file: ${err.message}`)
        reject()
      }

      resolve(res)
    })
  })
}

// -----------------------------------------------------
// Utils for calling the start task.
// -----------------------------------------------------

let startTaskProcess

async function wait(time): Promise<void> {
  return new Promise(resolve => {
    if (DEBUG_START_TASK_RUNNER) {
      let ticker = 0
      setInterval(() => {
        ticker++

        // eslint-disable-next-line no-console
        process.stdout.write(`${ticker} `)
      }, 1000)
    }

    setTimeout(() => {
      resolve()
    }, time)
  })
}

async function runStartTask(waitSeconds): Promise<void> {
  // Define the start task process using execa.
  // NOTE #1: Not using this.env.run(TASK_START) because it currently
  // closes open ended tasks.
  // NOTE #2: Notice how no 'await' is used here, because we don't want
  // to trigger the process just yet.
  startTaskProcess = execaPipe(
    'npx',
    [
      'buidler',
      TASK_START,
      '--open-browser',
      'true',
      '--network',
      'localhost',
      '--silent',
      `${!SHOW_START_TASK_LOGS}`
    ],
    {}
  )

  // Trigger the process but don't wait for it!
  if (DEBUG_START_TASK_RUNNER) {
    // eslint-disable-next-line no-console
    console.log(`>>> Running start task...`)
  }
  // prettier-ignore
  {
    (async (): Promise<void> => {
      await startTaskProcess
    })()
  }

  // Wait a bit until the task is considered started.
  if (DEBUG_START_TASK_RUNNER) {
    // eslint-disable-next-line no-console
    console.log(
      `>>> Waiting for start task to run for ${waitSeconds} seconds...`
    )
  }
  await wait(waitSeconds * 1000)
  if (DEBUG_START_TASK_RUNNER) {
    // eslint-disable-next-line no-console
    console.log(`>>> Running tests on start task...`)
  }
}

function killStartTask(): void {
  // eslint-disable-next-line no-console
  console.log(`>>> Killing start task.`)
  startTaskProcess.kill('SIGTERM', { forceKillAfterTimeout: 2000 })
}
