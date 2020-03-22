import { assert } from 'chai'
import { getRepoVersion, ApmVersion } from '~/src/utils/apm'
import { getMainnetProvider } from '~/test/test-helpers/providers'

describe('apm > repo', () => {
  describe('Return an existing version of a repo', () => {
    const provider = getMainnetProvider()

    it('first finance.aragonpm.eth version in mainnet', async () => {
      const appName = 'finance.aragonpm.eth'
      const version = '1.0.0'

      // Since it's requesting a fixed version, it's safe
      // to compare specific data since it would never change
      const versionData = await getRepoVersion(appName, version, provider)
      const expectedVersionData: ApmVersion = {
        version,
        contractAddress: '0xe583D4d74A50F3394AD92597F86277289B159934',
        contentUri: 'ipfs:QmWWNkXdGDnTaxAxw6vtCM21SDJeWLyaoUzDb3skYXynmo'
      }
      assert.deepEqual(versionData, expectedVersionData, 'wrong versionData')
    })
  })
})
