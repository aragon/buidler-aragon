import { assert } from 'chai'
import deployBases from '~/src/tasks/start/backend/bases/deploy-bases'
import { createDao } from '~/src/tasks/start/backend/create-dao'
import { createApp } from '~/src/tasks/start/backend/create-app'
import { useEnvironment } from '~/test/test-helpers/useEnvironment'
import { ACLContract } from '~/typechain'
import {
  setAllPermissionsOpenly,
  ANY_ADDRESS
} from '~/src/tasks/start/backend/set-permissions'
import {
  startGanache,
  stopGanache
} from '~/src/tasks/start/backend/start-ganache'
import { readArapp, getAppEnsName, getAppName } from '~/src/utils/arappUtils'
import { getAppId } from '~/src/utils/appName'

describe('set-permissions.ts', function() {
  // Note: These particular tests use localhost instead of buidlerevm.
  // This is required for bases to have the expected addresses,
  // And because we want to restart the chain on certain tests.
  useEnvironment('counter', 'localhost')

  let ensAddress, apmAddress, daoFactoryAddress
  let appName, appId
  let dao, acl
  let proxy

  before('start ganache', async function() {
    await startGanache(this.env)
  })

  before('deploy bases', async function() {
    ;({ ensAddress, apmAddress, daoFactoryAddress } = await deployBases(
      this.env
    ))
  })

  before('deploy a dao and retrieve acl', async function() {
    dao = await createDao(this.env.web3, this.env.artifacts, daoFactoryAddress)

    const ACL: ACLContract = this.env.artifacts.require('ACL')
    acl = await ACL.at(await dao.acl())
  })

  before('calculate appName and appId', async function() {
    appName = getAppName()
    appId = getAppId(getAppEnsName())
  })

  before('create app', async function() {
    ;({ proxy } = await createApp(
      appName,
      appId,
      dao,
      ensAddress,
      apmAddress,
      this.env
    ))

    await proxy.initialize()
  })

  after('stop ganache', async function() {
    stopGanache()
  })

  describe('when setAllPermissionsOpenly is called', function() {
    before('call setAllPermissionsOpenly', async function() {
      const arapp = readArapp()
      await setAllPermissionsOpenly(
        dao,
        proxy,
        arapp,
        this.env.web3,
        this.env.artifacts
      )
    })

    it('properly sets the INCREMENT_ROLE permission', async function() {
      assert.equal(
        await acl.hasPermission(
          ANY_ADDRESS,
          proxy.address,
          await proxy.INCREMENT_ROLE()
        ),
        true,
        'Invalid permission.'
      )
    })

    it('properly sets the DECREMENT_ROLE permission', async function() {
      assert.equal(
        await acl.hasPermission(
          ANY_ADDRESS,
          proxy.address,
          await proxy.DECREMENT_ROLE()
        ),
        true,
        'Invalid permission.'
      )
    })
  })
})
