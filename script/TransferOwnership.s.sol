// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "forge-std/Script.sol";
import "../src/SafeModuleManager.sol";

contract TransferOwnershipScript is Script {
    
    // Address of the SafeModuleManager on Base
    address payable factoryAddress = payable(0xc42e4af82969e757602E657D92829E9e2F06f6B3);
        

    function transferOwnership(address newOwner) external {
        if (newOwner == address(0)) revert("New owner cannot be zero address");
        
        vm.startBroadcast();
        console.log("=== TRANSFERRING OWNERSHIP ===");
        console.log("Factory address:", factoryAddress);
        console.log("New owner:", newOwner);
        
        SafeModuleManager factory = SafeModuleManager(factoryAddress);
        
        address currentOwner = factory.owner();
        console.log("Current owner:", currentOwner);
        console.log("Caller:", msg.sender);
        
        if (currentOwner != msg.sender) {
            console.log("ERROR: Only current owner can transfer ownership");
            vm.stopBroadcast();
            return;
        }
        
        factory.transferOwnership(newOwner);
        
        console.log("Ownership transfer initiated successfully!");
        console.log("New owner must call acceptOwnership() to complete the transfer");
        
        vm.stopBroadcast();
    }

    function acceptOwnership() external {
        vm.startBroadcast();
        console.log("=== ACCEPTING OWNERSHIP ===");
        console.log("Factory address:", factoryAddress);
        console.log("Caller:", msg.sender);
        
        SafeModuleManager factory = SafeModuleManager(factoryAddress);
        
        address pendingOwner = factory.pendingOwner();
        console.log("Pending owner:", pendingOwner);
        
        if (pendingOwner != msg.sender) {
            console.log("ERROR: Only pending owner can accept ownership");
            vm.stopBroadcast();
            return;
        }
        
        factory.acceptOwnership();
        
        console.log("Ownership accepted successfully!");
        console.log("New owner:", factory.owner());
        
        vm.stopBroadcast();
    }

    function renounceOwnership() external {
        vm.startBroadcast();
        console.log("=== RENOUNCING OWNERSHIP ===");
        console.log("Factory address:", factoryAddress);
        console.log("Caller:", msg.sender);
        
        SafeModuleManager factory = SafeModuleManager(factoryAddress);
        
        address currentOwner = factory.owner();
        console.log("Current owner:", currentOwner);
        
        if (currentOwner != msg.sender) {
            console.log("ERROR: Only current owner can renounce ownership");
            vm.stopBroadcast();
            return;
        }
        
        console.log("WARNING: This will permanently renounce ownership!");
        console.log("The contract will have no owner after this operation.");
        
        factory.renounceOwnership();
        
        console.log("Ownership renounced successfully!");
        console.log("Contract is now ownerless");
        
        vm.stopBroadcast();
    }

    function getOwnershipInfo() external view {
        SafeModuleManager factory = SafeModuleManager(factoryAddress);
        
        console.log("=== OWNERSHIP INFO ===");
        console.log("Factory Address:", factoryAddress);
        console.log("Current Owner:", factory.owner());
        console.log("Pending Owner:", factory.pendingOwner());
        console.log("Factory Version:", factory.getVersion());
    }

    function setFactoryAddress(address newFactoryAddress) external {
        console.log("Updating factory address from:", factoryAddress);
        console.log("To:", newFactoryAddress);
        factoryAddress = payable(newFactoryAddress);
        console.log("Factory address updated successfully");
    }
}