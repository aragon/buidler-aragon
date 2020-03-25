import { expect } from 'chai'
import loadTestContract from '~/test/test-helpers/loadTestContract'
import {
  extractContractInfo,
  ExtractedContractInfo
} from '~/src/utils/solidityExtractor'

describe('solidityExtractor.ts', () => {
  describe('extractContractInfo', () => {
    it('should parse an empty contract', () => {
      const expectedContractInfo: ExtractedContractInfo = {
        roles: [],
        functions: []
      }

      const sourceCode = loadTestContract('EmptyContract')

      const contractInfo = extractContractInfo(sourceCode)
      expect(contractInfo).to.deep.equal(expectedContractInfo)
    })

    it('should parse an basic contract', () => {
      const expectedContractInfo: ExtractedContractInfo = {
        roles: [
          {
            id: 'MODIFY_VALUE',
            bytes:
              '0x2594090359e7d58db7c5ce33deb3f31c1ccc8ec638404a5f3de74e519d1ee8ec',
            name: '',
            params: []
          },
          {
            id: 'REMOVE_VALUE',
            bytes:
              '0x2706ec64db4fba654f10459abdcdd2830329426ecee7261f395c10cd74a8536c',
            name: '',
            params: []
          },
          {
            id: 'VERY_LONG_PERMISSION',
            bytes:
              '0x3f75daf080e04c6c2535571bcc4bfaa96593a82bdcc06ed0e21eb1c589b4ba68',
            name: '',
            params: []
          }
        ],
        functions: [
          {
            sig: 'modify(uint256)',
            roles: ['MODIFY_VALUE'],
            notice: 'Updates a value'
          },
          {
            sig: 'remove()',
            roles: ['MODIFY_VALUE', 'REMOVE_VALUE'],
            notice: 'Remove a value'
          },
          {
            sig: 'remove(uint256,uint256,uint256)',
            roles: ['MODIFY_VALUE', 'REMOVE_VALUE', 'VERY_LONG_PERMISSION'],
            notice: ''
          }
        ]
      }

      const sourceCode = loadTestContract('BasicContract')

      const contractInfo = extractContractInfo(sourceCode)
      expect(contractInfo).to.deep.equal(expectedContractInfo)
    })
  })
})
