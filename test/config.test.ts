import { assert } from 'chai'
import { useEnvironment } from '~/test/test-helpers/useEnvironment'

describe('config.ts', () => {
  // TODO: Make sure to test values not specified in buidler.config.ts falling back to their defauls
  // specified in config.ts.

  it.skip('more tests needed')

  describe('proxy init params', async function() {
    let config

    describe('when not specifying proxy init params', async function() {
      useEnvironment('counter')

      before('retrieve config', function() {
        config = this.env.config.aragon
      })

      it('doesnt have a proxyInitializationParams', async function() {
        assert(config.proxyInitializationParams == undefined)
      })

      it('doesnt have a proxyInitializationParamsFn', async function() {
        assert(config.proxyInitializationParamsFn == undefined)
      })
    })

    describe('when specifying proxy init params', async function() {
      useEnvironment('token-wrapper')

      before('retrieve config', function() {
        config = this.env.config.aragon
      })

      it('has proxyInitializationParams', async function() {
        assert.deepEqual(
          config.proxyInitializationParams,
          ['0xDEADBEAF', 'Wrapped token', 'wORG'],
          'Mismatching proxy init params'
        )
      })

      it('has proxyInitializationParamsFn', async function() {
        const params = await config.proxyInitializationParamsFn(this.env)
        const address = params[0].replace(/^0x[a-fA-F0-9]{40}$/g, '0xDEADBEAF')
        assert.deepEqual(
          [address, params[1], params[2]],
          [address, 'Wrapped token', 'wORG'],
          'Mismatching proxy init params'
        )
      })
    })
  })
})
