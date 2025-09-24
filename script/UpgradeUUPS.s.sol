// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.6;

import "forge-std/Script.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../src/SafeModuleManager.sol";
import "../src/ManagedSafeModule.sol";

contract UpgradeUUPS is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address proxyAddress = vm.envAddress("PROXY_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy new implementation
        SafeModuleManager newImpl = new SafeModuleManager();
        console.log("New SafeModuleManager Implementation deployed at:", address(newImpl));

        // Get the proxy instance
        SafeModuleManager proxy = SafeModuleManager(proxyAddress);

        // Verify ownership before upgrade
        address owner = proxy.owner();
        console.log("Current proxy owner:", owner);
        console.log("Current version:", proxy.getVersion());

        // Perform upgrade
        UUPSUpgradeable(proxyAddress).upgradeTo(address(newImpl));
        console.log("Upgrade completed successfully!");

        // Verify upgrade
        console.log("New version:", proxy.getVersion());

        vm.stopBroadcast();

        console.log("\n=== UPGRADE SUMMARY ===");
        console.log("Proxy Address:", proxyAddress);
        console.log("New Implementation:", address(newImpl));
        console.log("Owner:", owner);
    }

    // Function to upgrade module template
    function upgradeModuleTemplate() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address proxyAddress = vm.envAddress("PROXY_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy new module implementation
        ManagedSafeModule newModuleImpl = new ManagedSafeModule();
        console.log("New ManagedSafeModule Implementation deployed at:", address(newModuleImpl));

        // Update module template in manager
        SafeModuleManager manager = SafeModuleManager(proxyAddress);
        manager.updateModuleTemplate(newModuleImpl);

        console.log("Module template updated successfully!");
        console.log("New module template:", address(manager.moduleTemplate()));

        vm.stopBroadcast();
    }
}