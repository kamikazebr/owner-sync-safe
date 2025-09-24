// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "forge-std/Script.sol";
import "../src/ManagedSafeModule.sol";
import "../src/SafeModuleManager.sol";

contract DeployFactoryMultiChain is Script {
    function run(string memory network) external {
        console.log("Deploying Factory on network:", network);
        
        vm.startBroadcast();

        // 1. Deploy do template do módulo
        console.log("Deploying ManagedSafeModule template...");
        ManagedSafeModule template = new ManagedSafeModule();
        console.log("Template deployed at:", address(template));

        // 2. Deploy da factory
        console.log("Deploying SafeModuleManager...");
        SafeModuleManager factory = new SafeModuleManager(template);
        console.log("Factory deployed at:", address(factory));
        console.log("Manager owner:", factory.owner());
        console.log("Module template:", address(factory.moduleTemplate()));
        console.log("Factory version:", factory.getVersion());

        vm.stopBroadcast();
        
        console.log("\n=== DEPLOY SUMMARY FOR", network, "===");
        console.log("Network:", network);
        console.log("Factory:", address(factory));
        console.log("Manager Owner:", factory.owner());
        console.log("Module Template:", address(factory.moduleTemplate()));
        console.log("=====================================");
        
        // Deployment summary (addresses logged above)
        console.log("Deployment completed successfully!");

        // Escrever em arquivo para referência
        // vm.writeFile(string(abi.encodePacked("deployments/", network, ".txt")), deploymentData);
    }

    function runWithOwnerTransfer(string memory network, address newOwner) external {
        if (newOwner == address(0)) revert("New owner cannot be zero address");
        
        console.log("Deploying Factory on network:", network);
        console.log("New owner will be:", newOwner);
        
        vm.startBroadcast();

        // 1. Deploy do template do módulo
        console.log("Deploying ManagedSafeModule template...");
        ManagedSafeModule template = new ManagedSafeModule();
        console.log("Template deployed at:", address(template));

        // 2. Deploy da factory
        console.log("Deploying SafeModuleManager...");
        SafeModuleManager factory = new SafeModuleManager(template);
        console.log("Factory deployed at:", address(factory));
        console.log("Manager owner:", factory.owner());
        console.log("Module template:", address(factory.moduleTemplate()));
        console.log("Factory version:", factory.getVersion());

        // 3. Transfer ownership
        console.log("\n=== TRANSFERRING OWNERSHIP ===");
        console.log("Current owner:", factory.owner());
        console.log("New owner:", newOwner);
        
        factory.transferOwnership(newOwner);
        console.log("Ownership transfer initiated!");
        console.log("Pending owner:", factory.pendingOwner());
        console.log("New owner must call acceptOwnership() to complete the transfer");

        vm.stopBroadcast();
        
        console.log("\n=== DEPLOY SUMMARY FOR", network, "===");
        console.log("Network:", network);
        console.log("Factory:", address(factory));
        console.log("Current Owner:", factory.owner());
        console.log("Pending Owner:", factory.pendingOwner());
        console.log("Module Template:", address(factory.moduleTemplate()));
        console.log("=====================================");
        
        console.log("Deployment and ownership transfer completed successfully!");
        console.log("IMPORTANT: New owner must call acceptOwnership() to complete the transfer");
    }
} 