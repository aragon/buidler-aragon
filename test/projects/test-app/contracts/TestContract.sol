pragma solidity ^0.4.24;

import "@aragon/abis/os/contracts/apps/AragonApp.sol";


contract TestContract is AragonApp {
    uint public count;

    function initialize(uint initialCount) public onlyInit {
        count = initialCount;
        initialized();
    }
}
