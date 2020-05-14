import { assert } from 'chai'
import { useDefaultEnvironment } from '~/test/test-helpers/useEnvironment'
import { useEnvironment } from '~/test/test-helpers/useEnvironment'

import { getRootAccount } from '~/src/utils/accounts'

describe('getRootAccount', () => {
  describe('when in the counter project', async function() {
    useDefaultEnvironment()
    it('should get the account[0] on buidlerevm network', async function() {
      const root = await getRootAccount(this.env)
      assert.equal(root, '0xc783df8a850f42e7F7e57013759C285caa701eB6')
    })
  })

  describe('when in the test-app project', async function() {
    useEnvironment('test-app')

    it('should use the from addres on buidlerevm network', async function() {
      const root = await getRootAccount(this.env)
      assert.equal(root, '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7')
    })
  })
})
