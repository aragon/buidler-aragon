import { assert } from 'chai'
import http from 'http'
import { testnetPort } from '~/src/params'
import tcpPortUsed from 'tcp-port-used'
import {
  useDefaultEnvironment,
  useEnvironment
} from '~/test/test-helpers/useEnvironment'
import {
  startGanache,
  stopGanache
} from '~/src/tasks/start/backend/start-ganache'

describe('start-ganache.ts', async function() {
  describe('when using the buidlerevm network', async function() {
    useDefaultEnvironment()

    it('throws when attempting to start ganache', async function() {
      await startGanache(this.env).catch(err => {
        assert.equal(
          err.message,
          'Cannot use buidlerevm network for this task until a JSON RPC is exposed'
        )
      })
    })
  })

  describe('when using a network that is not buidlerevm nor localhost', async function() {
    useEnvironment('counter', 'someothernetwork')

    it('throws when attempting to start ganache', async function() {
      await startGanache(this.env).catch(err => {
        assert.equal(
          err.message,
          'This plugin currently requires that the localhost network is used.'
        )
      })
    })
  })

  describe('when the target port is in use', async function() {
    useEnvironment('counter', 'localhost')

    let server

    before('start a dummy server in the target port', async function() {
      server = http.createServer()

      await new Promise(resolve => {
        server.listen(
          {
            host: 'localhost',
            port: testnetPort
          },
          () => resolve()
        )
      })
    })

    after('stop dummy server', async function() {
      await new Promise(resolve => {
        server.close(() => resolve())
      })
    })

    it('does nothing and returns zero when attempting to start ganache', async function() {
      const { networkId } = await startGanache(this.env)
      assert.equal(networkId, 0, 'Ganache started when it wasnt supposed to')
    })
  })

  describe('when the target port is not in use', async function() {
    describe('when ganache is started', async function() {
      useEnvironment('counter', 'localhost')

      let networkId: number

      before('start ganache', async function() {
        const res = await startGanache(this.env)
        networkId = res.networkId
      })

      it('returns a non-zero network id', async function() {
        assert.isAbove(networkId, 0, 'Ganache returned an invalid network id')
      })

      it('uses the target port', async function() {
        const portInUse = await tcpPortUsed.check(testnetPort)
        assert(portInUse, 'Target port is not in use')
      })

      describe('when ganache is stopped', async function() {
        before('stop ganache', function() {
          stopGanache()
        })

        it('releases the target port', async function() {
          const portInUse = await tcpPortUsed.check(testnetPort)
          assert(!portInUse, 'Target port is still in use')
        })
      })
    })
  })
})
