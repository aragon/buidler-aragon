import { expect } from 'chai'
import loadTestContract from '~/test/test-helpers/loadTestContract'
import {
  generateApplicationArtifact,
  AragonApplicationArtifact
} from '~/src/utils/generateArtifacts'
import { AragonAppJson, AbiItem, Role, AragonEnvironments } from '~/src/types'

describe('generateArtifacts.ts', () => {
  describe('generateApplicationArtifact', () => {
    it('should parse a basic contract', () => {
      const roles: Role[] = [
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
      ]

      const environments: AragonEnvironments = {}

      const sourceCode = loadTestContract('BasicContract')

      const contractEntrypointPath = 'contracts/Entrypoint.sol'

      const arapp: AragonAppJson = {
        roles,
        environments,
        path: contractEntrypointPath
      }

      const abiModify: AbiItem = {
        constant: false,
        inputs: [
          { internalType: 'uint256', name: '_newValue', type: 'uint256' }
        ],
        name: 'modify',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function'
      }
      const abiRemove: AbiItem = {
        constant: false,
        inputs: [],
        name: 'remove',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function'
      }
      const abiRemoveOverload: AbiItem = {
        constant: false,
        inputs: [
          { internalType: 'uint256', name: 'firstInput', type: 'uint256' },
          { internalType: 'uint256', name: 'secondInput', type: 'uint256' },
          { internalType: 'uint256', name: 'thirdInput', type: 'uint256' }
        ],
        name: 'remove',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function'
      }
      const abi: AbiItem[] = [abiModify, abiRemove, abiRemoveOverload]

      const expectedAragonArtifact: AragonApplicationArtifact = {
        flattenedCode: './code.sol',
        environments,
        roles,
        functions: [
          {
            abi: abiModify,
            sig: 'modify(uint256)',
            roles: ['MODIFY_VALUE'],
            notice: 'Updates a value'
          },
          {
            abi: abiRemove,
            sig: 'remove()',
            roles: ['MODIFY_VALUE', 'REMOVE_VALUE'],
            notice: 'Remove a value'
          },
          {
            abi: abiRemoveOverload,
            sig: 'remove(uint256,uint256,uint256)',
            roles: ['MODIFY_VALUE', 'REMOVE_VALUE', 'VERY_LONG_PERMISSION'],
            notice: ''
          }
        ],
        abi,
        path: contractEntrypointPath
      }

      const aragonArtifact = generateApplicationArtifact(arapp, abi, sourceCode)
      expect(aragonArtifact).to.deep.equal(expectedAragonArtifact)
    })
  })
})
