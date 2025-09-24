// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "forge-std/Script.sol";
import "../src/ManagedSafeModule.sol";
import "../src/SafeModuleManager.sol";

contract DeployFactoryScript is Script {
    function run() external {
        // uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
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

        vm.stopBroadcast();
        
        console.log("\n=== DEPLOY SUMMARY ===");
        console.log("Factory:", address(factory));
        console.log("Manager Owner:", factory.owner());
        console.log("Module Template:", address(factory.moduleTemplate()));
        console.log("=====================");
    }
} 