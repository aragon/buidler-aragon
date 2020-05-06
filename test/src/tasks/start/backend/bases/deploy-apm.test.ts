import { assert } from 'chai'
import { APMRegistryInstance } from '~/typechain'
import { externalArtifactPaths } from '~/src/params'
import { copyExternalArtifacts } from '~/src/utils/copyExternalArtifacts'
import { deployEns } from '~/src/tasks/start/backend/bases/deploy-ens'
import { deployDaoFactory } from '~/src/tasks/start/backend/bases/deploy-dao-factory'
import { deployApm } from '~/src/tasks/start/backend/bases/deploy-apm'
import { isNonZeroAddress } from '~/test/test-helpers/isNonZeroAddress'
import { useDefaultEnvironment } from '~/test/test-helpers/useEnvironment'

describe('deploy-apm.ts', function() {
  useDefaultEnvironment()

  describe('when an apm is created', async function() {
    let apm: APMRegistryInstance

    before('create an apm instance', async function() {
      // ==================== Temporal hack >>>
      // Copy external artifacts to the local artifacts folder
      // This is a temporary hack until multiple artifacts paths are allowed
      for (const externalArtifactPath of externalArtifactPaths)
        copyExternalArtifacts(externalArtifactPath)
      // ==================== Temporal hack <<<

      const ens = await deployEns(this.env, this.env.artifacts)

      const daoFactory = await deployDaoFactory(this.env.artifacts)

      apm = await deployApm(this.env, this.env.artifacts, ens, daoFactory)
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
