pragma solidity ^0.5.0;

/*
    NOTE: This contract is not intended to compile and is not necessarily correct.
*/

contract BasicContract {
    uint256 value;

    bytes32 public constant MODIFY_VALUE = keccak256('MODIFY_VALUE');
    bytes32 public constant REMOVE_VALUE = keccak256('REMOVE_VALUE');
    bytes32 public constant VERY_LONG_PERMISSION = keccak256(
        'VERY_LONG_PERMISSION'
    );

    /**
     * @notice Updates a value
     * @dev Basic function with one auth
     * @param _newValue New value
     */
    function modify(uint256 _newValue) public auth(MODIFY_VALUE) {
        value = _newValue;
    }

    /**
     * @notice Remove a value
     * @dev Test reading multiple auths
     */
    function remove() public auth(MODIFY_VALUE) auth(REMOVE_VALUE) {
        value = 0;
    }

    /**
     * @dev Test reading multiple auths in multiple lines
     * @dev Testing overloaded functions
     */
    function remove(uint256 firstInput, uint256 secondInput, uint256 thirdInput)
        public
        auth(MODIFY_VALUE)
        auth(REMOVE_VALUE)
        auth(VERY_LONG_PERMISSION)
        returns (bool)
    {
        value = firstInput + secondInput + thirdInput;
        return true;
    }

    /**
     * @dev Test non-modifying state functions to be ignored
     */
    function read() internal returns (uint256) {
        return value;
    }
}
