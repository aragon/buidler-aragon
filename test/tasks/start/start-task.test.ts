import { assert } from 'chai'
import { useEnvironment } from '~/test/test-helpers/useEnvironment'
import { TASK_START } from '~/src/tasks/task-names'
import { execaPipe } from '~/src/tasks/start/utils/execa'
import { AragonConfig } from '~/src/types'
import tcpPortUsed from 'tcp-port-used'
import * as fs from 'fs-extra'
import path from 'path'
import { isNonZeroAddress } from '~/test/test-helpers/isNonZeroAddress'

const DEBUG_START_TASK_RUNNER = true
const SHOW_START_TASK_LOGS = true

describe('start-task.ts', function() {
  let config

  describe('while in the token-wrapper project', async function() {
    useEnvironment('../projects/token-wrapper')

    before('retrieve config and hooks', function() {
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
      before('delete all logs created by hooks', async function() {
        await config.hooks._deleteLogs()
      })

      before('run start task for a while, then start tests', async function() {
        await runStartTask(80)
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

      it('calls the preDao hook with the bre', async function() {
        const json = await _readHookLog('preDao')

        assert(json, 'preDao hook log not found')
        assert(json.aragon, 'preDao hook does not contain an aragon property')
      })

      it('calls the postDao hook with the dao and the bre', async function() {
        const json = await _readHookLog('postDao')

        assert(json, 'postDao hook log not found')
        assert(
          json.aragon,
          'postDao hook log does not contain an aragon property'
        )
        assert(
          isNonZeroAddress(json.daoAddress),
          'postDao hook does not contain a valid dao address'
        )
      })

      it('calls the preInit hook with the bre and log contains additional data', async function() {
        const json = await _readHookLog('preInit')

        assert(json, 'preInit hook log not found')
        assert(json.aragon, 'preInit hook does not contain an aragon property')
        assert(
          isNonZeroAddress(json.tokenAddress),
          'preInit hook does not contain a token address'
        )
        assert(
          isNonZeroAddress(json.rootAccount),
          'preInit hook does not contain a root account'
        )
      })

      it('calls the postInit hook with the bre and log contains additional data', async function() {
        const json = await _readHookLog('postInit')

        assert(json, 'postInit hook log not found')
        assert(json.aragon, 'postInit hook does not contain an aragon property')
        assert(
          isNonZeroAddress(json.proxyAddress),
          'postInit hook does not contain a proxy address'
        )
      })

      it('calls the getInitParams hook with the bre', async function() {
        const json = await _readHookLog('getInitParams')

        assert(json, 'getInitParams hook log not found')
        assert(
          json.aragon,
          'getInitParams hook does not contain an aragon property'
        )
      })

      describe('when modifying the contract source', async function() {
        before('modify the contract source', async function() {
          await _modifyContractSource()
          await wait(15)
        })

        after('restore the contract source', async function() {
          await _restoreContractSource()
        })

        it('calls the postUpdate hook with the bre and log contains additional data', async function() {
          const json = await _readHookLog('postUpdate')

          assert(json, 'postUpdate hook log not found')
          assert(
            json.aragon,
            'postUpdate hook does not contain an aragon property'
          )
          assert(
            isNonZeroAddress(json.proxyAddress),
            'postUpdate hook does not contain a proxy address'
          )
        })
      })
    })
  })
})

// -----------------------------------------------------
// Utils for testing hooks.
// -----------------------------------------------------

/*
 * Since the actual start task is run in a different process,
 * mocking the hooks with Sinon doesn't work because any
 * these hooks are actually just a copy of the hooks executed at runtime.
 * The solution applied here is to have the hooks write to the file system
 * and these tests verify that content.
 */
async function _readHookLog(filename): Promise<any | void> {
  const filepath = path.join(
    __dirname,
    '../../projects/token-wrapper/logs',
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

let contractSource

async function _modifyContractSource(): Promise<void> {
  const filepath = path.join(
    __dirname,
    '../../projects/token-wrapper/contracts/TokenWrapper.sol'
  )

  return new Promise((resolve, reject) => {
    fs.readFile(filepath, (err, res) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.log(`Error reading contract source: ${err.message}`)
      }

      contractSource = res

      fs.writeFile(filepath, `${contractSource}\n`, err => {
        if (err) {
          // eslint-disable-next-line no-console
          console.log(`Error writing contract source: ${err.message}`)
        }

        resolve()
      })
    })
  })
}

async function _restoreContractSource(): Promise<void> {
  if (contractSource) {
    const filepath = path.join(
      __dirname,
      '../../projects/token-wrapper/contracts/TokenWrapper.sol'
    )

    return new Promise((resolve, reject) => {
      fs.writeFile(filepath, contractSource, err => {
        if (err) {
          // eslint-disable-next-line no-console
          console.log(`Error writing contract source: ${err.message}`)
        }

        resolve()
      })
    })
  } else {
    throw new Error('No contract source cached.')
  }
}

// -----------------------------------------------------
// Utils for calling the start task.
// -----------------------------------------------------

let startTaskProcess

/*
 * Define the start task process using execa.
 * NOTE #1: Not using this.env.run(TASK_START) because Buidler
 * doesn't provide a way to close unending tasks started that way.
 */
async function runStartTask(waitSeconds): Promise<void> {
  // Define process.
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
  await wait(waitSeconds)
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

async function wait(seconds): Promise<void> {
  return new Promise(resolve => {
    // Count ticks.
    let interval
    if (DEBUG_START_TASK_RUNNER) {
      let ticker = 0
      interval = setInterval(() => {
        ticker++

        // eslint-disable-next-line no-console
        console.log(`waiting: ${ticker}s`)
      }, 1000)
    }

    // Wait and resolve.
    setTimeout(() => {
      clearInterval(interval)
      resolve()
    }, seconds * 1000)
  })
}
