import { assert } from 'chai'
import { ethers } from 'ethers'
import { coerceFunctionSignature } from '~/src/utils/ast/utils'

describe('ast > utils', () => {
  describe('coerceFunctionSignature', () => {
    const testCases = [
      ['deposit(address,uint256,string)', 'deposit(address,uint256,string)'],
      ['deposit(address, uint256, string)', 'deposit(address,uint256,string)']
    ]
    for (const [from, to] of testCases)
      it(`Should coerce function signature ${from}`, () => {
        assert.equal(coerceFunctionSignature(from), to)
      })
  })

  describe('Compute signatures from data', () => {
    it('Should compute a signature given an ABI', () => {
      const abi = {
        constant: false,
        inputs: [
          { name: '_token', type: 'address' },
          { name: '_amount', type: 'uint256' },
          { name: '_reference', type: 'string' }
        ],
        name: 'deposit',
        outputs: [],
        payable: true,
        stateMutability: 'payable',
        type: 'function'
      }
      const signature = ethers.utils.formatSignature(abi)
      assert.equal(signature, 'deposit(address,uint256,string)')
    })
  })
})
