// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

contract MockSafeForFailure {
    bool public shouldFail = false;
    
    function setShouldFail(bool _shouldFail) external {
        shouldFail = _shouldFail;
    }
    
    function addOwnerWithThreshold(address, uint256) external pure returns (bool) {
        return false; // Always return false to trigger the failure path
    }
    
    function removeOwner(address, address, uint256) external view {
        if (shouldFail) {
            revert("Mock failure");
        }
    }
    
    function swapOwner(address, address, address) external view {
        if (shouldFail) {
            revert("Mock failure");
        }
    }
    
    function changeThreshold(uint256) external view {
        if (shouldFail) {
            revert("Mock failure");
        }
    }
    
    // Mock execTransactionFromModule for the Module interface
    function execTransactionFromModule(
        address to,
        uint256 value,
        bytes memory data,
        uint8 operation
    ) external view returns (bool success) {
        if (shouldFail) {
            return false;
        }
        // Avoid unused parameter warnings
        (to, value, data, operation);
        return true;
    }
}