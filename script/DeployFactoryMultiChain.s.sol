// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/ManagedSafeModule.sol";
import "../src/SafeModuleManager.sol";

contract DeployFactoryMultiChain is Script {
    function run(string memory network) external {
        console.log("Deploying UUPS Factory on network:", network);
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
        console.log("Factory version:", factory.getVersion());

        vm.stopBroadcast();

        console.log("\n=== DEPLOY SUMMARY FOR", network, "===");
        console.log("Network:", network);
        console.log("Implementation:", address(implementation));
        console.log("Proxy (Main Contract):", address(factory));
        console.log("Manager Owner:", factory.owner());
        console.log("Module Template:", address(factory.moduleTemplate()));
        console.log("=====================================");

        console.log("UUPS Deployment completed successfully!");
    }

    function runWithOwnerTransfer(string memory network, address newOwner) external {
        if (newOwner == address(0)) revert("New owner cannot be zero address");

        console.log("Deploying UUPS Factory on network:", network);
        console.log("New owner will be:", newOwner);
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

        // 3. Deploy proxy with initialization (deployer as initial owner)
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
        console.log("Factory version:", factory.getVersion());

        // 4. Transfer ownership
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
        console.log("Implementation:", address(implementation));
        console.log("Proxy (Main Contract):", address(factory));
        console.log("Current Owner:", factory.owner());
        console.log("Pending Owner:", factory.pendingOwner());
        console.log("Module Template:", address(factory.moduleTemplate()));
        console.log("=====================================");

        console.log("UUPS Deployment and ownership transfer completed successfully!");
        console.log("IMPORTANT: New owner must call acceptOwnership() to complete the transfer");
    }
} 