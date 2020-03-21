import { assert } from 'chai'
import { publishVersion, PublishVersionTxData } from '~/src/utils/apm'
import { getMainnetProvider } from '~/test/test-helpers/providers'

describe('apm > publishVersion', () => {
  describe('Return valid tx data to publish a new version', () => {
    const provider = getMainnetProvider()

    // Mainnet resolved addresses
    const ensResolvedName = {
      'finance.aragonpm.eth': '0x2DAb32A4bEFC9cd6221796ecE92e98137c13647A',
      'aragonpm.eth': '0x346854c542d437565339E60dE8CB3EfE1cAB30dC',
      'open.aragonpm.eth': '0x12755944244F4f3dDFFaD19F7167C7Db4f6F8359'
    }
    // Sample data
    const contractAddress = '0x9285cf8b9ffc4eadd054441f0a8e408dead63ce'
    const contentUri =
      '0x33697066733a516d624e473864566769333633706f704b7943726f6a4d4e6a337752637a786a456f537632374a38747646677751'
    const managerAddress = '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'

    it('finance.aragonpm.eth in mainnet', async () => {
      const appName = 'finance.aragonpm.eth'
      const versionInfo = { version: '0.2.0', contractAddress, contentUri }

      const txData = await publishVersion(appName, versionInfo, provider)
      const expectedTxData: PublishVersionTxData = {
        to: ensResolvedName['finance.aragonpm.eth'],
        methodName: 'newVersion',
        params: [[0, 2, 0], versionInfo.contractAddress, versionInfo.contentUri]
      }
      assert.deepEqual(txData, expectedTxData, 'wrong txData')
    })

    it('new-app.open.aragonpm.eth in mainnet', async () => {
      const appNameShort = 'new-app'
      const appName = `${appNameShort}.open.aragonpm.eth`
      const versionInfo = { version: '0.1.0', contractAddress, contentUri }

      const txData = await publishVersion(appName, versionInfo, provider, {
        managerAddress
      })
      const expectedTxData: PublishVersionTxData = {
        to: ensResolvedName['open.aragonpm.eth'],
        methodName: 'newRepoWithVersion',
        params: [
          appNameShort,
          managerAddress,
          [0, 1, 0],
          versionInfo.contractAddress,
          versionInfo.contentUri
        ]
      }
      assert.deepEqual(txData, expectedTxData, 'wrong txData')
    })
  })
})
