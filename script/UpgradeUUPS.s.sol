// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.6;

import "./BaseMultiChain.s.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../src/SafeModuleManager.sol";
import "../src/ManagedSafeModule.sol";
import "../src/SyncGroupRegistry.sol";

contract UpgradeUUPS is BaseMultiChain {

    // ===== REGISTRY UPGRADE FUNCTIONS =====

    /**
     * @notice Upgrade the SyncGroupRegistry proxy itself
     * @dev Scenario 1: Registry contract upgrade
     * @param network Network name ('gnosis', 'base', etc.)
     */
    function upgradeRegistry(string memory network) external {
        address proxyAddress = getRegistryAddress(network);
        console.log("Network:", network);
        console.log("Registry proxy address:", proxyAddress);

        vm.startBroadcast();

        // Deploy new Registry implementation
        SyncGroupRegistry newRegistryImpl = new SyncGroupRegistry();
        console.log("New SyncGroupRegistry Implementation deployed at:", address(newRegistryImpl));

        // Get the proxy instance
        SyncGroupRegistry registry = SyncGroupRegistry(payable(proxyAddress));

        // Verify ownership before upgrade
        address owner = registry.owner();
        console.log("Current registry owner:", owner);
        console.log("Current version:", registry.VERSION());

        // Perform upgrade
        UUPSUpgradeable(proxyAddress).upgradeTo(address(newRegistryImpl));
        console.log("Registry upgrade completed successfully!");

        // Verify upgrade
        console.log("New version:", registry.VERSION());

        vm.stopBroadcast();

        console.log("\n=== REGISTRY UPGRADE SUMMARY ===");
        console.log("Network:", network);
        console.log("Proxy Address:", proxyAddress);
        console.log("New Implementation:", address(newRegistryImpl));
        console.log("Owner:", owner);
    }

    /**
     * @notice Update the SafeModuleManager implementation template in Registry
     * @dev Scenario 2: Update Manager template for future groups
     * @param network Network name ('gnosis', 'base', etc.)
     */
    function updateRegistryManagerTemplate(string memory network) external {
        address proxyAddress = getRegistryAddress(network);
        console.log("Network:", network);
        console.log("Registry proxy address:", proxyAddress);

        vm.startBroadcast();

        // Deploy new manager implementation
        SafeModuleManager newManagerImpl = new SafeModuleManager();
        console.log("New SafeModuleManager Implementation deployed at:", address(newManagerImpl));

        // Update manager template in registry
        SyncGroupRegistry registry = SyncGroupRegistry(payable(proxyAddress));
        registry.updateManagerImplementation(newManagerImpl);

        console.log("Manager template updated successfully!");
        console.log("New manager template:", address(registry.managerImplementation()));

        vm.stopBroadcast();

        console.log("\n=== UPDATE MANAGER TEMPLATE SUMMARY ===");
        console.log("Network:", network);
        console.log("Registry Address:", proxyAddress);
        console.log("New Manager Template:", address(newManagerImpl));
        console.log("Note: Only affects future groups created after this update");
    }

    /**
     * @notice Update the ManagedSafeModule implementation template in Registry
     * @dev Scenario 4: Update Module template for future Safes
     * @param network Network name ('gnosis', 'base', etc.)
     */
    function updateRegistryModuleTemplate(string memory network) external {
        address proxyAddress = getRegistryAddress(network);
        console.log("Network:", network);
        console.log("Registry proxy address:", proxyAddress);

        vm.startBroadcast();

        // Deploy new module implementation
        ManagedSafeModule newModuleImpl = new ManagedSafeModule();
        console.log("New ManagedSafeModule Implementation deployed at:", address(newModuleImpl));

        // Update module template in registry
        SyncGroupRegistry registry = SyncGroupRegistry(payable(proxyAddress));
        registry.updateModuleImplementation(newModuleImpl);

        console.log("Module template updated successfully!");
        console.log("New module template:", address(registry.moduleImplementation()));

        vm.stopBroadcast();

        console.log("\n=== UPDATE MODULE TEMPLATE SUMMARY ===");
        console.log("Network:", network);
        console.log("Registry Address:", proxyAddress);
        console.log("New Module Template:", address(newModuleImpl));
        console.log("Note: Only affects future Safes joining groups after this update");
    }
}