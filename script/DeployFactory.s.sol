// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "forge-std/Script.sol";
import "../src/ControlOwnerModule.sol";
import "../src/OwnerModuleFactory.sol";

contract DeployFactoryScript is Script {
    function run() external {
        // uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast();

        // 1. Deploy do template do módulo
        console.log("Deploying ControlOwnerModule template...");
        ControlOwnerModule template = new ControlOwnerModule();
        console.log("Template deployed at:", address(template));

        // 2. Deploy da factory
        console.log("Deploying OwnerModuleFactory...");
        OwnerModuleFactory factory = new OwnerModuleFactory(template);
        console.log("Factory deployed at:", address(factory));
        console.log("Factory owner:", factory.factoryOwner());
        console.log("Module template:", address(factory.moduleTemplate()));

        vm.stopBroadcast();
        
        console.log("\n=== DEPLOY SUMMARY ===");
        console.log("Factory:", address(factory));
        console.log("Factory Owner:", factory.factoryOwner());
        console.log("Module Template:", address(factory.moduleTemplate()));
        console.log("=====================");
    }
} 