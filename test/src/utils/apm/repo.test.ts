import { assert } from 'chai'
import { ZERO_ADDRESS } from '~/src/params'
import { getRepoVersion, canPublishVersion, ApmVersion } from '~/src/utils/apm'
import { getMainnetProvider } from '~/test/test-helpers/providers'

describe('apm > repo', () => {
  const provider = getMainnetProvider()
  const appName = 'finance.aragonpm.eth'

  describe('Return an existing version of a repo', () => {
    it('first finance.aragonpm.eth version in mainnet', async () => {
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

  describe('Publish version permissions', () => {
    const allowedSender = '0xE04cAbcB24e11620Dd62bB99c396E76cEB578914'
    const notAllowedSender = ZERO_ADDRESS

    it('Allowed address should be able to publish', async () => {
      const canPerform = await canPublishVersion(
        appName,
        allowedSender,
        provider
      )
      assert.isTrue(canPerform, 'canPerform should be true')
    })

    it('Not allowed address should not be able to publish', async () => {
      const canPerform = await canPublishVersion(
        appName,
        notAllowedSender,
        provider
      )
      assert.isFalse(canPerform, 'canPerform should be false')
    })
  })
})
