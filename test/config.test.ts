import { assert } from 'chai'
import { useEnvironment } from '~/test/test-helpers/useEnvironment'
import { AragonConfig, AragonConfigHooks } from '~/src/types'
import defaultAragonConfig from '~/src/config'
import tcpPortUsed from 'tcp-port-used'
import { TASK_START } from '~/src/tasks/task-names'
import { execaPipe } from '~/src/tasks/start/utils/execa'

describe.only('config.ts', () => {
  describe('config values', async function() {
    let config, startTaskProcess

    describe('when in the token-wrapper project', async function() {
      useEnvironment('token-wrapper')

      before('retrieve config', function() {
        config = this.env.config.aragon as AragonConfig
      })

      before('run start task and wait a bit', async function() {
        const WAIT_TIME = 20000

        return new Promise(resolve => {
          startTaskProcess = execaPipe(
            'npx',
            [
              'buidler',
              TASK_START,
              '--open-browser',
              'false',
              '--silent',
              'true'
            ],
            {}
          )

          console.log(`Starting start task and waiting...`)
          startTaskProcess.then(() => {})

          setTimeout(() => {
            console.log(`Starting tests...`)
            resolve()
          }, WAIT_TIME)
        })
      })

      after('stop start task', function() {
        startTaskProcess.kill('SIGTERM', { forceKillAfterTimeout: 2000 })
      })

      describe('appServePort', async function() {
        it.only('serves the app contents at the correct port', async function() {
          console.log(`checking port`, config.appServePort)
          const portUsed = await tcpPortUsed.check(config.appServePort)

          console.log(`use port`, portUsed)

          /* assert */
        })

        /* it.skip('sets the repo contentURI to the correct port', async function() { */

        /* }) */
      })
    })
  })

  describe('default config', async function() {
    let config

    describe('when in the counter project', async function() {
      useEnvironment('counter')

      before('retrieve config', function() {
        config = this.env.config.aragon as AragonConfig
      })

      it('resulting config contains default values', function() {
        assert.deepEqual(
          config,
          defaultAragonConfig,
          'Not using default config.'
        )
      })
    })
  })

  describe('hooks', async function() {
    let hooks

    describe('when in the counter project', async function() {
      useEnvironment('counter')

      before('retrieve hooks', function() {
        const config = this.env.config.aragon as AragonConfig
        hooks = config.hooks as AragonConfigHooks
      })

      it('doesnt have hooks defined', async function() {
        assert(hooks == undefined)
      })
    })

    describe('when in the token-wrapper project', async function() {
      useEnvironment('token-wrapper')

      before('retrieve hooks', function() {
        const config = this.env.config.aragon as AragonConfig
        hooks = config.hooks as AragonConfigHooks
      })

      it('has a getInitParams hook, which returns valid parameters', async function() {
        const params = await hooks.getInitParams(this.env)
        assert.deepEqual(
          [undefined, params[1], params[2]],
          [undefined, 'Wrapped token', 'wORG'],
          'Mismatching proxy init params'
        )
      })

      it('has a preInit hook', async function() {
        assert(hooks.preInit != undefined)
      })

      it('has a postInit hook', async function() {
        assert(hooks.postInit != undefined)
      })
    })
  })
})
