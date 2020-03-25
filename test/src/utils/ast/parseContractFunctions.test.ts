import { assert } from 'chai'
import { parseContractFunctions } from '~/src/utils/ast'

describe('ast > parseContractFunctions', () => {
  it('Should extract signatures from a simple contract', () => {
    const targetContract = 'Simple'
    const sourceCode = `pragma solidity ^0.4.24;
contract ${targetContract} {
    /**
     * @notice Action with param \`_token\`
     * @dev Do an action
     * @param _token Address of deposited token
     * @param _amount Amount of tokens sent
     * @param _reference Reason for payment
     */
    function deposit(address _token, uint256 _amount, string _reference) external payable {
        _amount; _reference; address;
    }
}`
    const functions = parseContractFunctions(sourceCode, targetContract)
    assert.deepEqual(functions, [
      {
        name: 'deposit',
        notice: 'Action with param `_token`',
        roles: [],
        sig: 'deposit(address,uint256,string)'
      }
    ])
  })

  describe('onlyTargetContract option', () => {
    const targetContract = 'IgnoreInherited'
    const sourceCode = `pragma solidity ^0.4.24;

contract Dep {
    function depAction(address _token) external payable {
      _token;
    }
}

contract ${targetContract} is Dep {
    function deposit(address _token, uint256 _amount, string _reference) external payable {
        _amount; _reference; address;
    }
}`

    const depAction = {
      name: 'depAction',
      notice: '',
      roles: [],
      sig: 'depAction(address)'
    }
    const deposit = {
      name: 'deposit',
      notice: '',
      roles: [],
      sig: 'deposit(address,uint256,string)'
    }

    it('Should include functions of inherited contracts', () => {
      const functions = parseContractFunctions(sourceCode, targetContract, {
        onlyTargetContract: false
      })
      assert.deepEqual(functions, [deposit, depAction])
    })

    it('Should not include functions of inherited contracts', () => {
      const functions = parseContractFunctions(sourceCode, targetContract, {
        onlyTargetContract: true
      })
      assert.deepEqual(functions, [deposit])
    })
  })
})
