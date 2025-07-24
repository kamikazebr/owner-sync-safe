// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0;

import "@gnosis.pm/safe-contracts/contracts/base/OwnerManager.sol";

interface ISafe {
    function enableModule(address _module) external;
}

contract MockSafe is ISafe, OwnerManager {
    address public module;
    
    event log_address (address);
    event log(string);

    error ModuleNotAuthorized(address unacceptedAddress);
    
    receive() external payable {}

    function enableModule(address _module) external {
        emit log_address(_module);
        module = _module;
    }

    function autodestroy() authorized public{
        emit log("Booom!");
    }

    function exec(
        address payable to,
        uint256 value,
        bytes calldata data
    ) external {
        bool success;
        bytes memory response;
        (success, response) = to.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(response, 0x20), mload(response))
            }
       }
    }

    function execTransactionFromModule(
        address payable to,
        uint256 value,
        bytes calldata data,
        uint8 operation
    ) external returns (bool success) {
        if (msg.sender != module) revert ModuleNotAuthorized(msg.sender);
        if (operation == 1) (success, ) = to.delegatecall(data);
        else (success, ) = to.call{value: value}(data);
    }

   
}