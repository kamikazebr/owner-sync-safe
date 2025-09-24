// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/ManagedSafeModule.sol";
import "../src/SafeModuleManager.sol";

contract DeployFactoryScript is Script {
    function run() external {
        address deployer = msg.sender;

        vm.startBroadcast();

        // 1. Deploy module template
        console.log("Deploying ManagedSafeModule template...");
        ManagedSafeModule template = new ManagedSafeModule();
        console.log("Template deployed at:", address(template));

        // 2. Deploy manager implementation
        console.log("Deploying SafeModuleManager implementation...");
        SafeModuleManager implementation = new SafeModuleManager();
        console.log("Implementation deployed at:", address(implementation));

        // 3. Deploy proxy with initialization
        console.log("Deploying proxy...");
        bytes memory initData = abi.encodeWithSelector(
            SafeModuleManager.initialize.selector,
            template,
            deployer
        );

        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            initData
        );

        SafeModuleManager factory = SafeModuleManager(address(proxy));
        console.log("Proxy deployed at:", address(factory));
        console.log("Manager owner:", factory.owner());
        console.log("Module template:", address(factory.moduleTemplate()));
        console.log("Version:", factory.getVersion());

        vm.stopBroadcast();

        console.log("\n=== DEPLOY SUMMARY ===");
        console.log("Implementation:", address(implementation));
        console.log("Proxy (Main Contract):", address(factory));
        console.log("Manager Owner:", factory.owner());
        console.log("Module Template:", address(factory.moduleTemplate()));
        console.log("Version:", factory.getVersion());
        console.log("=====================");
    }
} 