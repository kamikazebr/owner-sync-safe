// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "forge-std/Script.sol";
import "../src/OwnerModuleFactory.sol";

contract FactoryInteractionScript is Script {
    
    // Endereço do OwnerModuleFactory na Base
    address payable factoryAddress = payable(0xc42e4af82969e757602E657D92829E9e2F06f6B3);
        

    function addSafeOwnerToAll(address newOwner, uint256 threshold) external {
        
        vm.startBroadcast();
        console.log("Adding owner to all modules...");
        console.log("Factory address:", factoryAddress);
        console.log("New owner:", newOwner);
        console.log("Threshold:", threshold);
        
        // Instanciar a factory
        OwnerModuleFactory factory = OwnerModuleFactory(factoryAddress);
        
        // Chamar a função para adicionar owner em todos os módulos
        factory.addSafeOwnerToAll(newOwner, threshold);
        
        vm.stopBroadcast();

        console.log("Owner added to all modules successfully!");
    }

    function getModuleForSafe(address safe) external returns (address) {
        vm.startBroadcast();
        OwnerModuleFactory factory = OwnerModuleFactory(factoryAddress);
        address module = factory.getModuleForSafe(safe);
        vm.stopBroadcast();
        console.log("Module for safe:", module);
        return module;
    }

    function getFactoryInfo() external {
        vm.startBroadcast();
        OwnerModuleFactory factory = OwnerModuleFactory(factoryAddress);
        
        console.log("=== FACTORY INFO ===");
        console.log("Factory Address:", factoryAddress);
        console.log("Factory Version:", factory.getVersion());
        console.log("Factory Owner:", factory.factoryOwner());
        console.log("Module Template:", address(factory.moduleTemplate()));
        console.log("Total Modules:", factory.getModuleCount());
        
        // Get network status
        OwnerModuleFactory.NetworkInfo memory info = factory.getNetworkStatus();
        console.log("Network Status:");
        console.log("  Total Safes:", info.totalSafes);
        console.log("  Active Modules:", info.activeModules);
        console.log("  Chain ID:", info.chainId);
        console.log("  Last Update:", info.lastUpdate);
        
        vm.stopBroadcast();
    }
} 