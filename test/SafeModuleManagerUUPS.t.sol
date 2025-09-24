// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.6;

import "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../src/ManagedSafeModule.sol";
import "../src/SafeModuleManager.sol";
import "./helpers/SafeTestHelper.sol";
import {ISafe} from "../src/interfaces/ISafe.sol";

contract SafeModuleManagerUUPS is SafeTestHelper {
    SafeModuleManager moduleManager;
    SafeModuleManager implementation;
    ManagedSafeModule moduleTemplate;
    ERC1967Proxy proxy;
    Safe safe1;

    address managerOwner;
    address owner1;

    uint256 managerOwnerPK;
    uint256 owner1PK;

    function setUp() public {
        setUpSafeHelpers();

        // Criar owners usando makeAddrAndKey para poder assinar depois
        (managerOwner, managerOwnerPK) = makeAddrAndKey("managerOwner");
        (owner1, owner1PK) = makeAddrAndKey("owner1");

        // Deploy module template
        moduleTemplate = new ManagedSafeModule();

        // Deploy manager implementation
        implementation = new SafeModuleManager();

        // Prepare initialization data
        bytes memory initData = abi.encodeWithSelector(
            SafeModuleManager.initialize.selector,
            moduleTemplate,
            managerOwner
        );

        // Deploy proxy
        proxy = new ERC1967Proxy(address(implementation), initData);
        moduleManager = SafeModuleManager(address(proxy));

        // Create a Safe
        address[] memory owners = new address[](1);
        owners[0] = owner1;
        safe1 = createSafeWithNonce(owners, 1, 1);
    }

    function testInitialization() public {
        assertEq(moduleManager.owner(), managerOwner);
        assertEq(address(moduleManager.moduleTemplate()), address(moduleTemplate));
        assertEq(moduleManager.getVersion(), "2.0.0-uups");
    }

    function testUpgradeAuthorization() public {
        // Deploy new implementation
        SafeModuleManager newImpl = new SafeModuleManager();

        // Should fail when called by non-owner
        vm.prank(owner1);
        vm.expectRevert();
        UUPSUpgradeable(address(moduleManager)).upgradeTo(address(newImpl));

        // Should succeed when called by owner
        vm.prank(managerOwner);
        UUPSUpgradeable(address(moduleManager)).upgradeTo(address(newImpl));

        // Version should remain the same (same implementation)
        assertEq(moduleManager.getVersion(), "2.0.0-uups");
    }

    function testUpgradeAndCall() public {
        // Deploy new implementation with additional functionality
        SafeModuleManager newImpl = new SafeModuleManager();

        // Deploy new module template
        ManagedSafeModule newModuleTemplate = new ManagedSafeModule();

        // Prepare call data for updating module template
        bytes memory callData = abi.encodeWithSelector(
            SafeModuleManager.updateModuleTemplate.selector,
            newModuleTemplate
        );

        // Upgrade and call
        vm.prank(managerOwner);
        UUPSUpgradeable(address(moduleManager)).upgradeToAndCall(
            address(newImpl),
            callData
        );

        // Check that module template was updated
        assertEq(address(moduleManager.moduleTemplate()), address(newModuleTemplate));
    }

    function testUpdateModuleTemplate() public {
        ManagedSafeModule newTemplate = new ManagedSafeModule();

        // Should fail when called by non-owner
        vm.prank(owner1);
        vm.expectRevert();
        moduleManager.updateModuleTemplate(newTemplate);

        // Should succeed when called by owner
        vm.prank(managerOwner);
        moduleManager.updateModuleTemplate(newTemplate);

        assertEq(address(moduleManager.moduleTemplate()), address(newTemplate));
    }

    function testCreateModuleAfterUpgrade() public {
        // Create module with original template
        vm.prank(address(safe1));
        address module1 = moduleManager.addModuleForSafe();

        // Upgrade with new template
        ManagedSafeModule newTemplate = new ManagedSafeModule();
        vm.prank(managerOwner);
        moduleManager.updateModuleTemplate(newTemplate);

        // Create Safe for testing
        address[] memory owners = new address[](1);
        owners[0] = owner1;
        Safe safe2 = createSafeWithNonce(owners, 1, 2);

        // Create module with new template
        vm.prank(address(safe2));
        address module2 = moduleManager.addModuleForSafe();

        // Both modules should exist but use different templates
        assertTrue(moduleManager.isModule(module1));
        assertTrue(moduleManager.isModule(module2));
        assertNotEq(module1, module2);
    }

    function testStorageLayoutPreservation() public {
        // Create some modules first
        vm.prank(address(safe1));
        address module = moduleManager.addModuleForSafe();

        uint256 moduleCountBefore = moduleManager.getModuleCount();
        address[] memory modulesBefore = moduleManager.getAllModules();

        // Upgrade
        SafeModuleManager newImpl = new SafeModuleManager();
        vm.prank(managerOwner);
        UUPSUpgradeable(address(moduleManager)).upgradeTo(address(newImpl));

        // Check that storage was preserved
        assertEq(moduleManager.getModuleCount(), moduleCountBefore);
        assertEq(moduleManager.getAllModules().length, modulesBefore.length);
        assertEq(moduleManager.getModuleForSafe(address(safe1)), module);
        assertTrue(moduleManager.hasModule(address(safe1)));
    }

    function testCannotReinitialize() public {
        // Try to reinitialize - should fail
        vm.expectRevert();
        moduleManager.initialize(moduleTemplate, managerOwner);
    }

    function testProxyImplementationAddress() public {
        // Get implementation address from proxy
        bytes32 implementationSlot = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
        address implAddress = address(uint160(uint256(vm.load(address(proxy), implementationSlot))));

        assertEq(implAddress, address(implementation));
    }

    function testModuleVersionAfterUpgrade() public {
        // Check initial version
        assertEq(moduleManager.getVersion(), "2.0.0-uups");

        // Deploy and upgrade to same implementation (version should remain same)
        SafeModuleManager newImpl = new SafeModuleManager();
        vm.prank(managerOwner);
        UUPSUpgradeable(address(moduleManager)).upgradeTo(address(newImpl));

        assertEq(moduleManager.getVersion(), "2.0.0-uups");
    }
}