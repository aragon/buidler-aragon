import { assert } from 'chai'
import { createDao, createDaoFactory } from '~/src/tasks/start/backend/dao'
import { readArapp, getAppId } from '~/src/utils/arappUtils'
import { deployImplementation } from '~/src/tasks/start/backend/app'
import { createProxy } from '~/src/tasks/start/backend/proxy'
import { AragonAppJson } from '~/src/types'
import { useDefaultEnvironment } from '~/test/test-helpers/useEnvironment'
import {
  setAllPermissionsOpenly,
  ANY_ADDRESS
} from '~/src/tasks/start/backend/permissions'
import {
  KernelInstance,
  ACLContract,
  ACLInstance,
  DAOFactoryInstance
} from '~/typechain'

describe('permissions.ts', function() {
  useDefaultEnvironment()

  let dao: KernelInstance
  let acl: ACLInstance
  let arapp: AragonAppJson
  let app: any

  before('set up dao with app', async function() {
    const daoFactory: DAOFactoryInstance = await createDaoFactory(
      this.env.artifacts
    )
    dao = await createDao(this.env.web3, this.env.artifacts, daoFactory.address)

    const ACL: ACLContract = this.env.artifacts.require('ACL')
    acl = await ACL.at(await dao.acl())

    const implementation = await deployImplementation(this.env.artifacts)
    const appId = getAppId('counter')
    app = await createProxy(
      implementation,
      appId,
      dao,
      this.env.web3,
      this.env.artifacts,
      []
    )

    arapp = readArapp()
  })

  describe('when setAllPermissionsOpenly is called', function() {
    before('call setAllPermissionsOpenly', async function() {
      await setAllPermissionsOpenly(
        dao,
        app,
        arapp,
        this.env.web3,
        this.env.artifacts
      )
    })

    it('properly sets the INCREMENT_ROLE permission', async function() {
      assert.equal(
        await acl.hasPermission(
          ANY_ADDRESS,
          app.address,
          await app.INCREMENT_ROLE()
        ),
        true,
        'Invalid permission.'
      )
    })

    it('properly sets the DECREMENT_ROLE permission', async function() {
      assert.equal(
        await acl.hasPermission(
          ANY_ADDRESS,
          app.address,
          await app.DECREMENT_ROLE()
        ),
        true,
        'Invalid permission.'
      )
    })
  })
})
