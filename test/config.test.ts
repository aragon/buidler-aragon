import { assert } from 'chai'
import { useEnvironment } from '~/test/test-helpers/useEnvironment'
import { AragonConfig, AragonConfigHooks } from '~/src/types'

describe('config.ts', () => {
  // TODO: Make sure to test values not specified in buidler.config.ts falling back to their defauls
  // specified in config.ts.

  it.skip('more tests needed')

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
