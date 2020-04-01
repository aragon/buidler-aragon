import { assert } from 'chai'
import { assertCanPublish } from '~/src/utils/apm'
import { getMainnetProvider } from '~/test/test-helpers/providers'
import { zeroAddress } from '~/src/params'
import { BuidlerPluginError } from '@nomiclabs/buidler/plugins'

describe('apm > assertCanPublish', () => {
  const provider = getMainnetProvider()
  const financeManager = '0xE04cAbcB24e11620Dd62bB99c396E76cEB578914'
  const testCases: {
    [appName: string]: {
      [sender: string]: boolean // expected isAllowed
    }
  } = {
    'finance.aragonpm.eth': {
      [financeManager]: true,
      [zeroAddress]: false
    },
    'newapp.aragonpm.eth': {
      [financeManager]: true,
      [zeroAddress]: false
    },
    'newapp.open.aragonpm.eth': {
      [financeManager]: true,
      [zeroAddress]: true
    }
  }

  describe(`Test can publish with mainnet apps`, () => {
    for (const [appName, senders] of Object.entries(testCases))
      for (const [sender, expectedIsAllowed] of Object.entries(senders))
        it(`${sender} should ${
          expectedIsAllowed ? 'be' : 'not be'
        } able to publish ${appName}`, async () => {
          const isAllowed = await assertCanPublish(
            appName,
            sender,
            provider
          ).then(
            () => true,
            // Wrap function to return a binary true / false for expected errors only
            e => {
              if (e instanceof BuidlerPluginError) return false
              else throw e
            }
          )

          assert.equal(isAllowed, expectedIsAllowed, 'Wrong isAllowed return')
        })
  })
})
