// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.6;

import "forge-std/Script.sol";
import {SyncGroupRegistry} from "../src/SyncGroupRegistry.sol";
import {SafeModuleManager} from "../src/SafeModuleManager.sol";
import {ManagedSafeModule} from "../src/ManagedSafeModule.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployRegistry is Script {
    function run() external {
        address deployer = msg.sender;

        console.log("Deploying SyncGroupRegistry...");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast();

        // 1. Deploy implementations (templates)
        console.log("\n1. Deploying SafeModuleManager implementation...");
        SafeModuleManager managerImpl = new SafeModuleManager();
        console.log("SafeModuleManager Implementation:", address(managerImpl));

        console.log("\n2. Deploying ManagedSafeModule implementation...");
        ManagedSafeModule moduleImpl = new ManagedSafeModule();
        console.log("ManagedSafeModule Implementation:", address(moduleImpl));

        // 2. Deploy Registry implementation
        console.log("\n3. Deploying SyncGroupRegistry implementation...");
        SyncGroupRegistry registryImpl = new SyncGroupRegistry();
        console.log("SyncGroupRegistry Implementation:", address(registryImpl));

        // 3. Deploy Registry proxy
        console.log("\n4. Deploying SyncGroupRegistry proxy...");
        ERC1967Proxy registryProxy = new ERC1967Proxy(
            address(registryImpl),
            abi.encodeWithSelector(
                SyncGroupRegistry.initialize.selector,
                managerImpl,
                moduleImpl,
                deployer  // Registry owner
            )
        );
        console.log("SyncGroupRegistry Proxy:", address(registryProxy));

        vm.stopBroadcast();

        // Output deployment summary
        console.log("\n========================================");
        console.log("DEPLOYMENT SUMMARY");
        console.log("========================================");
        console.log("SafeModuleManager Implementation:", address(managerImpl));
        console.log("ManagedSafeModule Implementation:", address(moduleImpl));
        console.log("SyncGroupRegistry Implementation:", address(registryImpl));
        console.log("SyncGroupRegistry Proxy (MAIN):", address(registryProxy));
        console.log("========================================");
        console.log("\nRegistry Version:", SyncGroupRegistry(payable(address(registryProxy))).VERSION());
        console.log("Registry Owner:", SyncGroupRegistry(payable(address(registryProxy))).owner());
        console.log("\nTo create a sync group, call:");
        console.log("SyncGroupRegistry(", address(registryProxy), ").createGroup(name, governanceSafe)");
    }
}
