import { assert } from 'chai'
import { useDefaultEnvironment } from '~/test/test-helpers/useEnvironment'
import { publishVersion, PublishVersionTxData } from '~/src/utils/apm'
import { ethers } from 'ethers'

describe('apm > publishVersion', () => {
  it('Should publish return valid data for a new version of finance.aragonpm.eth in mainnet', async () => {
    const appName = 'finance.aragonpm.eth'
    const versionInfo = {
      version: '0.2.0',
      contractAddress: '0x9285cf8b9ffc4eadd054441f0a8e408dead63ce',
      contentUri:
        '0x33697066733a516d624e473864566769333633706f704b7943726f6a4d4e6a337752637a786a456f537632374a38747646677751'
    }
    const provider = new ethers.providers.InfuraProvider()

    const txData = await publishVersion(appName, versionInfo, provider)
    const expectedTxData: PublishVersionTxData = {
      to: '0x2DAb32A4bEFC9cd6221796ecE92e98137c13647A',
      methodName: 'newVersion',
      params: [[0, 2, 0], versionInfo.contractAddress, versionInfo.contentUri]
    }
    assert.deepEqual(txData, expectedTxData, 'wrong txData')
  })
})
