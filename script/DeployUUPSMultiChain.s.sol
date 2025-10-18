// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.6;

import "./BaseMultiChain.s.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../src/SafeModuleManager.sol";
import "../src/ManagedSafeModule.sol";
import "../src/SyncGroupRegistry.sol";

contract DeployUUPSMultiChain is BaseMultiChain {
    function run(string memory chain) external {
        // Get deployer address from networks.json
        address deployer = getSenderAddress(chain);

        console.log("Network:", chain);
        console.log("Deployer address:", deployer);

        vm.startBroadcast(deployer);

        // Deploy module implementation first
        ManagedSafeModule moduleImpl = new ManagedSafeModule();
        console.log("ManagedSafeModule Implementation deployed at:", address(moduleImpl));

        // Deploy manager implementation
        SafeModuleManager managerImpl = new SafeModuleManager();
        console.log("SafeModuleManager Implementation deployed at:", address(managerImpl));

        // Prepare manager initialization data
        bytes memory managerInitData = abi.encodeWithSelector(
            SafeModuleManager.initialize.selector,
            moduleImpl,
            deployer
        );

        // Deploy manager proxy
        ERC1967Proxy managerProxy = new ERC1967Proxy(
            address(managerImpl),
            managerInitData
        );
        console.log("SafeModuleManager Proxy deployed at:", address(managerProxy));

        // Verify the proxy is working
        SafeModuleManager manager = SafeModuleManager(address(managerProxy));
        console.log("Manager owner:", manager.owner());
        console.log("Manager version:", manager.getVersion());
        console.log("Module template:", address(manager.moduleTemplate()));

        vm.stopBroadcast();

        // Output deployment summary
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Chain:", chain);
        console.log("ManagedSafeModule Implementation:", address(moduleImpl));
        console.log("SafeModuleManager Implementation:", address(managerImpl));
        console.log("SafeModuleManager Proxy (Main Contract):", address(managerProxy));
        console.log("Deployer/Owner:", deployer);
    }

    // Deploy SyncGroupRegistry
    function deployRegistry(string memory chain) external {
        // Get deployer address from networks.json
        address deployer = getSenderAddress(chain);

        console.log("Deploying SyncGroupRegistry on:", chain);
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployer);

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
        console.log("Chain:", chain);
        console.log("SafeModuleManager Implementation:", address(managerImpl));
        console.log("ManagedSafeModule Implementation:", address(moduleImpl));
        console.log("SyncGroupRegistry Implementation:", address(registryImpl));
        console.log("SyncGroupRegistry Proxy (MAIN):", address(registryProxy));
        console.log("Registry Owner:", SyncGroupRegistry(payable(address(registryProxy))).owner());
        console.log("========================================");
    }
}