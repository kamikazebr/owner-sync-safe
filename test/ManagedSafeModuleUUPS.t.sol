// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.6;

import "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../src/ManagedSafeModule.sol";
import "../src/SafeModuleManager.sol";
import "./helpers/SafeTestHelper.sol";

contract ManagedSafeModuleUUPSTest is SafeTestHelper {
    SafeModuleManager moduleManager;
    ManagedSafeModule moduleTemplate;
    Safe safe1;

    address managerOwner;
    address owner1;
    address moduleOwner;

    uint256 managerOwnerPK;
    uint256 owner1PK;

    function setUp() public {
        setUpSafeHelpers();

        (managerOwner, managerOwnerPK) = makeAddrAndKey("managerOwner");
        (owner1, owner1PK) = makeAddrAndKey("owner1");

        // Deploy and initialize manager with UUPS
        moduleTemplate = new ManagedSafeModule();
        SafeModuleManager managerImpl = new SafeModuleManager();

        bytes memory initData = abi.encodeWithSelector(
            SafeModuleManager.initialize.selector,
            moduleTemplate,
            managerOwner
        );

        ERC1967Proxy managerProxy = new ERC1967Proxy(address(managerImpl), initData);
        moduleManager = SafeModuleManager(address(managerProxy));

        // Create Safe
        address[] memory owners = new address[](1);
        owners[0] = owner1;
        safe1 = createSafeWithNonce(owners, 1, 1);

        // Create module for safe
        vm.prank(address(safe1));
        moduleManager.addModuleForSafe();

        address moduleAddress = moduleManager.getModuleForSafe(address(safe1));
        ManagedSafeModule module = ManagedSafeModule(payable(moduleAddress));
        moduleOwner = module.owner(); // Get the actual module owner
    }

    function testModuleUpgradeAuthorization() public {
        address moduleAddress = moduleManager.getModuleForSafe(address(safe1));
        ManagedSafeModule module = ManagedSafeModule(payable(moduleAddress));

        // Deploy new module implementation
        ManagedSafeModule newImpl = new ManagedSafeModule();

        // Should fail when called by non-module-owner
        vm.prank(owner1);
        vm.expectRevert();
        UUPSUpgradeable(moduleAddress).upgradeTo(address(newImpl));

        // Should succeed when called by module owner (manager)
        vm.prank(moduleOwner);
        UUPSUpgradeable(moduleAddress).upgradeTo(address(newImpl));

        // Check version is correct
        assertEq(module.getVersion(), "2.0.0-uups");
    }

    function testModuleStoragePreservation() public {
        address moduleAddress = moduleManager.getModuleForSafe(address(safe1));
        ManagedSafeModule module = ManagedSafeModule(payable(moduleAddress));

        // Configure the module
        assertTrue(module.isSafeConfigured());

        // Store some state
        uint256 originalThreshold = module.getSafeThreshold();

        // Upgrade
        ManagedSafeModule newImpl = new ManagedSafeModule();
        vm.prank(moduleOwner);
        UUPSUpgradeable(moduleAddress).upgradeTo(address(newImpl));

        // Check that storage was preserved
        assertTrue(module.isSafeConfigured());
        assertEq(module.getSafeThreshold(), originalThreshold);
        assertEq(module.getVersion(), "2.0.0-uups");
    }

    function testModuleFunctionalityAfterUpgrade() public {
        address moduleAddress = moduleManager.getModuleForSafe(address(safe1));
        ManagedSafeModule module = ManagedSafeModule(payable(moduleAddress));

        // Upgrade
        ManagedSafeModule newImpl = new ManagedSafeModule();
        vm.prank(moduleOwner);
        UUPSUpgradeable(moduleAddress).upgradeTo(address(newImpl));

        // Test that module functionality still works
        assertTrue(module.isSafeConfigured());
        assertEq(module.avatar(), address(safe1));
        assertEq(module.target(), address(safe1));
    }

    function testCannotReinitializeModule() public {
        address moduleAddress = moduleManager.getModuleForSafe(address(safe1));
        ManagedSafeModule module = ManagedSafeModule(payable(moduleAddress));

        // Try to reinitialize - should fail
        vm.expectRevert();
        module.setUp("");
    }

    function testModuleUpgradeAndCall() public {
        address moduleAddress = moduleManager.getModuleForSafe(address(safe1));
        ManagedSafeModule module = ManagedSafeModule(payable(moduleAddress));

        // Deploy new implementation
        ManagedSafeModule newImpl = new ManagedSafeModule();

        // Prepare call data for configuration change
        bytes memory callData = abi.encodeWithSelector(
            ManagedSafeModule.setAutoSync.selector,
            false
        );

        // Upgrade and call
        vm.prank(moduleOwner);
        UUPSUpgradeable(moduleAddress).upgradeToAndCall(
            address(newImpl),
            callData
        );

        // Check that the call was executed
        (,,,bool autoSync,) = module.getSyncStatus();
        assertFalse(autoSync);
    }

    function testMultipleModuleUpgrades() public {
        // Create multiple modules
        address[] memory owners2 = new address[](1);
        owners2[0] = owner1;
        Safe safe2 = createSafeWithNonce(owners2, 1, 2);

        vm.prank(address(safe2));
        moduleManager.addModuleForSafe();

        address module1 = moduleManager.getModuleForSafe(address(safe1));
        address module2 = moduleManager.getModuleForSafe(address(safe2));

        // Deploy new implementation
        ManagedSafeModule newImpl = new ManagedSafeModule();

        // Upgrade both modules
        vm.prank(moduleOwner);
        UUPSUpgradeable(module1).upgradeTo(address(newImpl));

        vm.prank(moduleOwner);
        UUPSUpgradeable(module2).upgradeTo(address(newImpl));

        // Both should have new version
        assertEq(ManagedSafeModule(payable(module1)).getVersion(), "2.0.0-uups");
        assertEq(ManagedSafeModule(payable(module2)).getVersion(), "2.0.0-uups");
    }

    function testModuleProxyImplementationAddress() public {
        address moduleAddress = moduleManager.getModuleForSafe(address(safe1));

        // Get implementation address from proxy
        bytes32 implementationSlot = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
        address implAddress = address(uint160(uint256(vm.load(moduleAddress, implementationSlot))));

        assertEq(implAddress, address(moduleTemplate));
    }
}