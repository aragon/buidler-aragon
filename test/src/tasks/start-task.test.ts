import { assert } from 'chai'
import { useEnvironment } from '~/test/test-helpers/useEnvironment'
import { TASK_START } from '~/src/tasks/task-names'
import { AragonConfig } from '~/src/types'
import tcpPortUsed from 'tcp-port-used'
import * as fs from 'fs-extra'
import path from 'path'
import EventEmitter from 'events'
import { isNonZeroAddress } from '~/test/test-helpers/isNonZeroAddress'
import sinon from 'sinon'
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'
import killPort from 'kill-port'
import { mapValues } from 'lodash'

const contractPathToModify = path.join(
  __dirname,
  '../../projects/token-wrapper/contracts/TokenWrapper.sol'
)

describe('Run start-task - token-wrapper', function() {
  let config: AragonConfig
  let closeApp: () => void | undefined
  const sandbox = sinon.createSandbox()
  const hooksEmitter = new EventEmitter()

  async function getHookCall(
    hookName:
      | 'preDao'
      | 'postDao'
      | 'preInit'
      | 'postInit'
      | 'getInitParams'
      | 'postUpdate'
  ): Promise<{
    params: any
    bre: BuidlerRuntimeEnvironment
    returnValue: any
  }> {
    if (!config.hooks) throw Error('Hooks in not defined')
    const hook: sinon.SinonSpy = config.hooks[hookName] as any
    if (!hook) throw Error(`Hook ${hookName} is not defined`)
    if (!hook.calledOnce) throw Error(`Hook ${hookName} was not called`)

    const { args, returnValue } = hook.getCall(0)
    const [params, bre] = args
    return { params, bre, returnValue: returnValue && (await returnValue) }
  }

  useEnvironment('token-wrapper', 'localhost')

  before('Retrieve config and hooks', async function() {
    config = this.env.config.aragon as AragonConfig
    // Intercept hook calls an call an event emitter
    config.hooks = mapValues(
      config.hooks,
      (hook: any, hookName) => (...args: any[]): any => {
        hooksEmitter.emit(hookName, args)
        return hook(...args)
      }
    )

    // Spy all hooks to assert calls
    if (config.hooks) sandbox.spy(config.hooks as any)
  })

  before('Kill processes on test ports', async function() {
    await killPort(config.appServePort)
    await killPort(config.clientServePort)
  })

  before('Run start task until ready', async function() {
    const { close } = await this.env.run(TASK_START, {
      noBrowser: true,
      noBlocking: true
    })
    closeApp = close
  })

  after('kill the start task', function() {
    if (closeApp) closeApp()
  })

  it('uses the target ports', async function() {
    assert(
      await tcpPortUsed.check(config.appServePort),
      'appServePort is not being used'
    )
    assert(
      await tcpPortUsed.check(config.clientServePort),
      'clientServePort is not being used'
    )
  })

  describe('Assert hooks calls', () => {
    it('preDao - with bre', async function() {
      const { bre } = await getHookCall('preDao')
      assert(bre.config.aragon, 'no aragon config')
    })

    it('postDao - with dao, bre', async function() {
      const { params, bre } = await getHookCall('postDao')
      assert(bre.config.aragon, 'no aragon config')
      assert(isNonZeroAddress(params.dao.address), 'no dao address')
    })

    it('preInit - with bre, returns deployed token contract', async function() {
      const { bre, returnValue } = await getHookCall('preInit')
      assert(bre.config.aragon, 'no aragon config')
      assert(isNonZeroAddress(returnValue.tokenAddress), 'no token address')
      assert(isNonZeroAddress(returnValue.rootAccount), 'no root account')
    })

    it('getInitParams - returns init params', async function() {
      const { bre, returnValue } = await getHookCall('getInitParams')
      assert(bre.config.aragon, 'no aragon config')
      const [tokenAddress, name, symbol] = returnValue
      assert(isNonZeroAddress(tokenAddress), 'no token address')
      assert.equal(name, 'Wrapped token', 'wrong token name')
      assert.equal(symbol, 'wORG', 'wrong token symbol')
    })

    it('postInit - with bre, proxy', async function() {
      const { params, bre } = await getHookCall('postInit')
      assert(bre.config.aragon, 'no aragon config')
      assert(isNonZeroAddress(params.proxy.address), 'no proxy address')
    })
  })

  describe('when modifying the contract source', async function() {
    let contractSource

    /**
     * Modify the contract source to trigger an update
     * Once the update is complete, the postUpdate hook is called
     * which we use to assert that the update event happened
     */
    before('modify the contract source', async function() {
      contractSource = fs.readFileSync(contractPathToModify, 'utf8')
      fs.writeFileSync(contractPathToModify, `${contractSource}\n`)
      // Wait for the postUpdate to be called once
      await new Promise(resolve => hooksEmitter.on('postUpdate', resolve))
    })

    after('restore the contract source', function() {
      if (!contractSource) throw new Error('No contract source cached.')
      fs.writeFileSync(contractPathToModify, contractSource)
    })

    it('calls the postUpdate hook with the bre and log contains additional data', async function() {
      const { params } = await getHookCall('postUpdate')
      assert(isNonZeroAddress(params.proxy.address), 'no proxy address')
    })
  })
})
