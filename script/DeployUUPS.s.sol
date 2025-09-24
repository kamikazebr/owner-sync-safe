// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.6;

import "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../src/SafeModuleManager.sol";
import "../src/ManagedSafeModule.sol";

contract DeployUUPS is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

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
        console.log("ManagedSafeModule Implementation:", address(moduleImpl));
        console.log("SafeModuleManager Implementation:", address(managerImpl));
        console.log("SafeModuleManager Proxy (Main Contract):", address(managerProxy));
        console.log("Deployer/Owner:", deployer);
    }
}