import { assert } from 'chai'
import { APMRegistryInstance } from '~/typechain'
import { createEns } from '~/src/tasks/start/utils/backend/ens'
import { createDaoFactory } from '~/src/tasks/start/utils/backend/dao'
import { createApm } from '~/src/tasks/start/utils/backend/apm'
import { isNonZeroAddress } from '~/test/test-helpers/isNonZeroAddress'
import { useDefaultEnvironment } from '~/test/test-helpers/useEnvironment'

describe('apm.ts', function() {
  useDefaultEnvironment()

  describe('when an apm is created', async function() {
    let apm: APMRegistryInstance

    before('create an apm instance', async function() {
      const ens = await createEns(this.env.web3, this.env.artifacts)

      const daoFactory = await createDaoFactory(this.env.artifacts)

      apm = await createApm(this.env.web3, this.env.artifacts, ens, daoFactory)
    })

    it('deploys an apm instance with a valid address', function() {
      assert(isNonZeroAddress(apm.address), 'Invalid contract address.')
    })

    it('links to a valid ENS instance', async function() {
      assert(isNonZeroAddress(await apm.ens()))
    })

    it('links to a valid ENSSubdomainRegistrar instance', async function() {
      assert(isNonZeroAddress(await apm.registrar()))
    })
  })
})
