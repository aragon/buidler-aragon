import { assert } from 'chai'
import { useEnvironment } from '~/test/test-helpers/useEnvironment'
import { AragonConfig, AragonConfigHooks } from '~/src/types'
import defaultAragonConfig from '~/src/config'

describe('config.ts', () => {
  describe('default config', async function() {
    let config

    const defaultConfig = defaultAragonConfig

    describe('when in the counter project', async function() {
      useEnvironment('counter')

      before('retrieve config', function() {
        config = this.env.config.aragon as AragonConfig
      })

      it('resulting config contains default values', function() {
        assert.deepEqual(config, defaultConfig, 'config is different')
      })
    })

    describe('when in the token-wrapper project', async function() {
      useEnvironment('token-wrapper')

      before('retrieve config', function() {
        config = this.env.config.aragon as AragonConfig
      })

      it('resulting config does not contain some default values', function() {
        assert.notEqual(
          config.appServePort,
          defaultConfig.appServePort,
          'appServePort is equal'
        )
        assert.notEqual(
          config.clientServePort,
          defaultConfig.clientServePort,
          'clientServePort is equal'
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

      it('has a getInitParams hook', async function() {
        assert(hooks.getInitParams != undefined)
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
