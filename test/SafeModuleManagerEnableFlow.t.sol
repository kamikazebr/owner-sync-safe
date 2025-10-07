// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/ManagedSafeModule.sol";
import "../src/SafeModuleManager.sol";
import "./helpers/SafeTestHelper.sol";
import {ISafe} from "../src/interfaces/ISafe.sol";
import {Enum} from "zodiac/core/Module.sol";

/**
 * @title SafeModuleManagerEnableFlowTest
 * @notice Tests the complete flow of module creation and enablement as used in the UI
 * @dev This test suite covers the user journey:
 *      1. Manager owner adds Safe to group (creates module)
 *      2. Safe owners enable module via multisig
 *      3. Manager can then operate on the enabled module
 */
contract SafeModuleManagerEnableFlowTest is SafeTestHelper {
    SafeModuleManager moduleManager;
    Safe safe1;
    Safe safe2;
    Safe safe3;

    address managerOwner;
    address owner1;
    address owner2;
    address owner3;
    address newOwner;

    uint256 managerOwnerPK;
    uint256 owner1PK;
    uint256 owner2PK;
    uint256 owner3PK;
    uint256 newOwnerPK;

    event ModuleCreated(address indexed safe, address indexed module);

    function setUp() public {
        setUpSafeHelpers();

        // Create owners
        (managerOwner, managerOwnerPK) = makeAddrAndKey("managerOwner");
        (owner1, owner1PK) = makeAddrAndKey("owner1");
        (owner2, owner2PK) = makeAddrAndKey("owner2");
        (owner3, owner3PK) = makeAddrAndKey("owner3");
        (newOwner, newOwnerPK) = makeAddrAndKey("newOwner");

        // Deploy manager with template using UUPS
        ManagedSafeModule template = new ManagedSafeModule();
        SafeModuleManager implementation = new SafeModuleManager();

        bytes memory initData = abi.encodeWithSelector(
            SafeModuleManager.initialize.selector,
            template,
            managerOwner
        );

        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        moduleManager = SafeModuleManager(address(proxy));

        // Create test Safes with different configurations
        address[] memory owners1 = new address[](1);
        owners1[0] = owner1;
        safe1 = createSafeWithNonce(owners1, 1, 1);

        address[] memory owners2 = new address[](2);
        owners2[0] = owner1;
        owners2[1] = owner2;
        safe2 = createSafeWithNonce(owners2, 2, 2);

        address[] memory owners3 = new address[](1);
        owners3[0] = owner3;
        safe3 = createSafeWithNonce(owners3, 1, 3);
    }

    /**
     * @notice Test that module creation does not automatically enable it on the Safe
     * @dev This is the first step in the UI flow - manager creates module but Safe must enable it
     */
    function testModuleCreationWithoutEnablement() public {
        // Manager owner creates module for safe1
        vm.prank(managerOwner);
        address module = moduleManager.createModuleForSafe(address(safe1));

        // Module exists in manager
        assertTrue(moduleManager.isModule(module));
        assertEq(moduleManager.getModuleForSafe(address(safe1)), module);

        // But module is NOT enabled on the Safe yet
        assertFalse(safe1.isModuleEnabled(module));

        // And module is NOT marked as active in manager
        assertFalse(moduleManager.isModuleActive(module));
    }

    /**
     * @notice Test that Safe owners can enable the module via multisig transaction
     * @dev This is the second step in the UI flow - Safe owners approve enablement
     */
    function testSafeOwnerEnablesModule() public {
        // Step 1: Manager creates module
        vm.prank(managerOwner);
        address module = moduleManager.createModuleForSafe(address(safe1));

        // Verify module is not enabled yet
        assertFalse(safe1.isModuleEnabled(module));

        // Step 2: Safe owners enable module via multisig
        safeHelper(
            safe1,
            owner1PK,
            address(safe1),
            abi.encodeWithSelector(ISafe.enableModule.selector, module)
        );

        // Verify module is now enabled on the Safe
        assertTrue(safe1.isModuleEnabled(module));

        // Verify module can execute operations on the Safe
        ManagedSafeModule managedModule = ManagedSafeModule(payable(module));
        assertTrue(managedModule.isSafeConfigured());
    }

    /**
     * @notice Test that manager operations only work after module is enabled
     * @dev This verifies the security model - modules must be explicitly enabled
     */
    function testManagerOperationsOnlyAfterEnable() public {
        // Create module for safe1
        vm.prank(managerOwner);
        address module1 = moduleManager.createModuleForSafe(address(safe1));

        // Try to add owner via manager BEFORE enabling
        // The function will execute but won't affect the Safe because module isn't enabled
        vm.prank(managerOwner);
        moduleManager.addSafeOwnerToAll(newOwner, 1);

        // Verify owner was NOT added to the Safe
        // (because module isn't enabled, the Safe rejected the operation)
        address[] memory owners = safe1.getOwners();
        assertEq(owners.length, 1);
        assertEq(owners[0], owner1);

        // Now enable the module
        safeHelper(
            safe1,
            owner1PK,
            address(safe1),
            abi.encodeWithSelector(ISafe.enableModule.selector, module1)
        );

        // Mark as active so manager knows it can operate
        vm.prank(address(safe1));
        moduleManager.addModuleForSafe();

        // Now try adding owner again - should work
        vm.prank(managerOwner);
        moduleManager.addSafeOwnerToAll(newOwner, 2);

        // Verify owner was added
        owners = safe1.getOwners();
        assertEq(owners.length, 2);
        assertTrue(owners[0] == newOwner || owners[1] == newOwner);
    }

    /**
     * @notice Test scenario where multiple Safes are added but only some enable their modules
     * @dev This tests the real-world scenario from the UI where some Safes accept invitation
     */
    function testMultipleSafesPartialEnablement() public {
        // Manager creates modules for all 3 Safes
        vm.startPrank(managerOwner);
        address module1 = moduleManager.createModuleForSafe(address(safe1));
        address module2 = moduleManager.createModuleForSafe(address(safe2));
        address module3 = moduleManager.createModuleForSafe(address(safe3));
        vm.stopPrank();

        // Verify all modules exist but none are enabled
        assertFalse(safe1.isModuleEnabled(module1));
        assertFalse(safe2.isModuleEnabled(module2));
        assertFalse(safe3.isModuleEnabled(module3));

        // Only safe1 and safe2 enable their modules (safe3 does not)
        safeHelper(
            safe1,
            owner1PK,
            address(safe1),
            abi.encodeWithSelector(ISafe.enableModule.selector, module1)
        );

        // safe2 requires 2 signatures - just use vm.prank to simulate multisig approval
        vm.prank(address(safe2));
        safe2.enableModule(module2);

        // Mark enabled modules as active
        vm.prank(address(safe1));
        moduleManager.addModuleForSafe();

        vm.prank(address(safe2));
        moduleManager.addModuleForSafe();

        // Verify only safe1 and safe2 have modules enabled
        assertTrue(safe1.isModuleEnabled(module1));
        assertTrue(safe2.isModuleEnabled(module2));
        assertFalse(safe3.isModuleEnabled(module3));

        // Add owner to all enabled modules
        vm.prank(managerOwner);
        moduleManager.addSafeOwnerToAll(newOwner, 2);

        // Verify newOwner was added to safe1 and safe2 but NOT safe3
        address[] memory owners1 = safe1.getOwners();
        address[] memory owners2 = safe2.getOwners();
        address[] memory owners3 = safe3.getOwners();

        // safe1 should have newOwner
        assertEq(owners1.length, 2);
        assertTrue(owners1[0] == newOwner || owners1[1] == newOwner);

        // safe2 should have newOwner
        assertEq(owners2.length, 3);
        bool foundInSafe2 = false;
        for (uint i = 0; i < owners2.length; i++) {
            if (owners2[i] == newOwner) foundInSafe2 = true;
        }
        assertTrue(foundInSafe2);

        // safe3 should NOT have newOwner (module never enabled)
        assertEq(owners3.length, 1);
        assertEq(owners3[0], owner3);
    }

    /**
     * @notice Test the complete UI flow from creation to operation
     * @dev This test documents the exact flow a user would experience in the UI
     */
    function testCompleteUIFlow() public {
        // ===== STEP 1: Manager owner adds Safe to group =====
        vm.prank(managerOwner);
        address module = moduleManager.createModuleForSafe(address(safe1));

        // At this point, UI shows "Pending Setup" banner
        assertFalse(safe1.isModuleEnabled(module));

        // ===== STEP 2: Safe owners see invitation and accept =====
        // They execute enableModule via Safe UI
        safeHelper(
            safe1,
            owner1PK,
            address(safe1),
            abi.encodeWithSelector(ISafe.enableModule.selector, module)
        );

        // ===== STEP 3: Module is now active =====
        assertTrue(safe1.isModuleEnabled(module));

        // Mark as active (this happens when Safe calls addModuleForSafe)
        vm.prank(address(safe1));
        moduleManager.addModuleForSafe();

        assertTrue(moduleManager.isModuleActive(module));

        // UI now shows "Active Groups" banner

        // ===== STEP 4: Manager can now operate on the module =====
        vm.prank(managerOwner);
        moduleManager.addSafeOwnerToAll(newOwner, 2);

        address[] memory owners = safe1.getOwners();
        assertEq(owners.length, 2);
        assertTrue(owners[0] == newOwner || owners[1] == newOwner);
    }

    /**
     * @notice Test that module creation emits correct events
     * @dev Events are used by the UI to detect pending invitations
     */
    function testModuleCreatedEventEmission() public {
        // Expect ModuleCreated event with safe1 address
        // We check the first two indexed params (safe, module) but not the exact module address
        vm.expectEmit(true, false, false, false);
        emit ModuleCreated(address(safe1), address(0));

        vm.prank(managerOwner);
        address module = moduleManager.createModuleForSafe(address(safe1));

        // Verify module address is not zero
        assertTrue(module != address(0));
    }

    /**
     * @notice Test removing and re-adding a Safe (creates new module)
     * @dev This tests the scenario that caused duplicate modules in the UI
     */
    function testRemoveAndReAddSafe() public {
        // Create and enable first module
        vm.prank(managerOwner);
        address module1 = moduleManager.createModuleForSafe(address(safe1));

        safeHelper(
            safe1,
            owner1PK,
            address(safe1),
            abi.encodeWithSelector(ISafe.enableModule.selector, module1)
        );

        vm.prank(address(safe1));
        moduleManager.addModuleForSafe();

        // Remove the Safe from group
        vm.prank(address(safe1));
        moduleManager.removeModuleForSafe();

        // Module should be disabled now
        assertFalse(moduleManager.isModuleActive(module1));

        // Create new module for same Safe (this is what causes duplicates)
        vm.prank(managerOwner);
        address module2 = moduleManager.createModuleForSafe(address(safe1));

        // Should be a different module address
        assertNotEq(module1, module2);

        // Old module still exists in allModules array
        assertTrue(moduleManager.isModule(module1));
        assertTrue(moduleManager.isModule(module2));

        // But only new module is mapped to the Safe
        assertEq(moduleManager.getModuleForSafe(address(safe1)), module2);
    }
}
