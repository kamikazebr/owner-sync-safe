// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.6;

import "./helpers/SafeTestHelper.sol";
import "./helpers/UpgradeHelper.sol";
import {SyncGroupRegistry} from "../src/SyncGroupRegistry.sol";
import {SafeModuleManager} from "../src/SafeModuleManager.sol";
import {ManagedSafeModule} from "../src/ManagedSafeModule.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ISafe} from "../src/interfaces/ISafe.sol";

/**
 * @title UpgradeIntegrationTest
 * @notice End-to-end tests for UUPS upgrade scenarios
 * Tests the complete lifecycle: create groups → add safes → enable modules → upgrade → verify
 */
contract UpgradeIntegrationTest is SafeTestHelper, UpgradeHelper {
    // Registry and implementations
    SyncGroupRegistry public registry;
    SafeModuleManager public managerImpl;
    ManagedSafeModule public moduleImpl;

    // Test actors
    address public registryOwner;
    address public group1Owner;
    address public group2Owner;
    address public user1;
    address public user2;

    // Test Safes
    Safe public safe1;
    Safe public safe2;
    Safe public safe3;
    Safe public safe4;

    // Group IDs
    uint256 public group1Id;
    uint256 public group2Id;

    // Managers
    address public group1Manager;
    address public group2Manager;

    // Modules
    address public safe1Module;
    address public safe2Module;
    address public safe3Module;
    address public safe4Module;

    function setUp() public {
        setUpSafeHelpers();

        // Create test accounts
        registryOwner = makeAddr("registryOwner");
        group1Owner = makeAddr("group1Owner");
        group2Owner = makeAddr("group2Owner");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        // Deploy implementations
        managerImpl = new SafeModuleManager();
        moduleImpl = new ManagedSafeModule();

        // Deploy Registry with UUPS proxy
        SyncGroupRegistry registryImplementation = new SyncGroupRegistry();
        ERC1967Proxy registryProxy = new ERC1967Proxy(
            address(registryImplementation),
            abi.encodeWithSelector(
                SyncGroupRegistry.initialize.selector,
                managerImpl,
                moduleImpl,
                registryOwner
            )
        );
        registry = SyncGroupRegistry(payable(address(registryProxy)));

        // === PHASE 1: SETUP COMPLETE SYSTEM ===
        setupGroupsAndSafes();
    }

    /**
     * @notice Setup initial state with groups and safes
     */
    function setupGroupsAndSafes() internal {
        // Create Group 1
        vm.prank(group1Owner);
        group1Id = registry.createGroup("Treasury Group", group1Owner);
        SyncGroupRegistry.SyncGroup memory group1 = registry.getGroup(group1Id);
        group1Manager = group1.manager;

        // Create Group 2
        vm.prank(group2Owner);
        group2Id = registry.createGroup("Dev Team Group", group2Owner);
        SyncGroupRegistry.SyncGroup memory group2 = registry.getGroup(group2Id);
        group2Manager = group2.manager;

        // Create Safes for Group 1
        address[] memory owners1 = new address[](2);
        owners1[0] = user1;
        owners1[1] = user2;
        safe1 = createSafeWithNonce(owners1, 1, 1);
        safe2 = createSafeWithNonce(owners1, 1, 2);

        // Create Safes for Group 2
        address[] memory owners2 = new address[](1);
        owners2[0] = user1;
        safe3 = createSafeWithNonce(owners2, 1, 3);
        safe4 = createSafeWithNonce(owners2, 1, 4);

        // Add Safes to Group 1
        SafeModuleManager manager1 = SafeModuleManager(group1Manager);
        vm.prank(address(safe1));
        safe1Module = manager1.addModuleForSafe();
        vm.prank(address(safe2));
        safe2Module = manager1.addModuleForSafe();

        // Add Safes to Group 2
        SafeModuleManager manager2 = SafeModuleManager(group2Manager);
        vm.prank(address(safe3));
        safe3Module = manager2.addModuleForSafe();
        vm.prank(address(safe4));
        safe4Module = manager2.addModuleForSafe();

        // Enable modules on Safes
        enableModuleOnSafe(safe1, safe1Module);
        enableModuleOnSafe(safe2, safe2Module);
        enableModuleOnSafe(safe3, safe3Module);
        enableModuleOnSafe(safe4, safe4Module);
    }

    /**
     * @notice Helper to enable a module on a Safe
     * In testing environment, we can bypass the Safe's multisig by using vm.prank
     */
    function enableModuleOnSafe(Safe safe, address module) internal {
        // Get one of the Safe's owners
        address[] memory owners = safe.getOwners();
        require(owners.length > 0, "Safe has no owners");

        // In tests, we can directly call enableModule by pranking as the Safe itself
        // This bypasses the need for valid signatures
        vm.prank(address(safe));
        safe.enableModule(module);

        // Verify module was enabled
        assertTrue(safe.isModuleEnabled(module), "Module should be enabled");
    }

    // ============================================
    // TEST: Full Upgrade Path
    // ============================================

    function testFullUpgradePath() public {
        // ===  VERIFY PRE-UPGRADE STATE ===
        assertEq(registry.nextGroupId(), 2, "Should have 2 groups");
        assertEq(SafeModuleManager(group1Manager).getModuleCount(), 2, "Group 1 should have 2 modules");
        assertEq(SafeModuleManager(group2Manager).getModuleCount(), 2, "Group 2 should have 2 modules");

        // Snapshot state before upgrade
        (uint256 manager1ModuleCount, address[] memory manager1Modules) =
            snapshotManagerState(SafeModuleManager(group1Manager));
        (uint256 manager2ModuleCount, address[] memory manager2Modules) =
            snapshotManagerState(SafeModuleManager(group2Manager));
        uint256 nextGroupId = snapshotRegistryState(registry);

        // === PHASE 2: UPGRADE ALL CONTRACTS ===

        // Upgrade Registry
        address newRegistryImpl = upgradeRegistry(address(registry), registryOwner);
        assertVersion(address(registry), "1.0.0");

        // Upgrade Manager proxies
        address newManager1Impl = upgradeManager(group1Manager, group1Owner);
        address newManager2Impl = upgradeManager(group2Manager, group2Owner);
        assertVersion(group1Manager, "2.0.0-uups");
        assertVersion(group2Manager, "2.0.0-uups");

        // Update module templates in both managers
        address newTemplate1 = updateModuleTemplate(SafeModuleManager(group1Manager), group1Owner);
        address newTemplate2 = updateModuleTemplate(SafeModuleManager(group2Manager), group2Owner);

        // Upgrade individual modules (Safes upgrade their own modules)
        upgradeModule(safe1Module, address(safe1));
        upgradeModule(safe2Module, address(safe2));
        upgradeModule(safe3Module, address(safe3));
        upgradeModule(safe4Module, address(safe4));

        assertVersion(safe1Module, "2.0.0-uups");
        assertVersion(safe2Module, "2.0.0-uups");
        assertVersion(safe3Module, "2.0.0-uups");
        assertVersion(safe4Module, "2.0.0-uups");

        // === PHASE 3: VERIFY POST-UPGRADE STATE ===

        // Verify registry state preserved
        assertRegistryStatePreserved(registry, nextGroupId);

        // Verify manager states preserved
        assertManagerStatePreserved(
            SafeModuleManager(group1Manager),
            manager1ModuleCount,
            manager1Modules
        );
        assertManagerStatePreserved(
            SafeModuleManager(group2Manager),
            manager2ModuleCount,
            manager2Modules
        );

        // Verify groups still exist and are active
        SyncGroupRegistry.SyncGroup memory group1 = registry.getGroup(group1Id);
        SyncGroupRegistry.SyncGroup memory group2 = registry.getGroup(group2Id);
        assertTrue(group1.active, "Group 1 should still be active");
        assertTrue(group2.active, "Group 2 should still be active");
        assertEq(group1.owner, group1Owner, "Group 1 owner should be preserved");
        assertEq(group2.owner, group2Owner, "Group 2 owner should be preserved");

        // Verify modules still enabled and functional
        assertTrue(safe1.isModuleEnabled(safe1Module), "Module 1 should still be enabled");
        assertTrue(safe2.isModuleEnabled(safe2Module), "Module 2 should still be enabled");
        assertTrue(safe3.isModuleEnabled(safe3Module), "Module 3 should still be enabled");
        assertTrue(safe4.isModuleEnabled(safe4Module), "Module 4 should still be enabled");

        // Verify module configurations preserved
        ManagedSafeModule module1 = ManagedSafeModule(payable(safe1Module));
        assertTrue(module1.isSafeConfigured(), "Module 1 should still be configured");
        assertEq(module1.avatar(), address(safe1), "Module 1 avatar should be preserved");
    }

    // ============================================
    // TEST: Group Functionality After Upgrade
    // ============================================

    function testGroupFunctionalityAfterUpgrade() public {
        // Upgrade system
        upgradeRegistry(address(registry), registryOwner);

        // Create new group after upgrade
        vm.prank(user1);
        uint256 newGroupId = registry.createGroup("Post-Upgrade Group", user1);
        assertEq(newGroupId, 2, "New group should have ID 2");

        // Update existing group name
        vm.prank(group1Owner);
        registry.updateGroupName(group1Id, "Updated Treasury Group");
        SyncGroupRegistry.SyncGroup memory group1 = registry.getGroup(group1Id);
        assertEq(group1.name, "Updated Treasury Group", "Group name should be updated");

        // Deactivate group
        vm.prank(group1Owner);
        registry.deactivateGroup(group1Id);
        group1 = registry.getGroup(group1Id);
        assertFalse(group1.active, "Group should be deactivated");

        // Verify owner groups still tracked correctly
        uint256[] memory group1OwnerGroups = registry.getOwnerGroups(group1Owner);
        assertEq(group1OwnerGroups.length, 1, "Group 1 owner should have 1 group");
        assertEq(group1OwnerGroups[0], group1Id, "Group ID should match");
    }

    // ============================================
    // TEST: Module Functionality After Upgrade
    // ============================================

    function testModuleFunctionalityAfterUpgrade() public {
        // Upgrade managers and modules
        upgradeManager(group1Manager, group1Owner);
        upgradeModule(safe1Module, address(safe1));
        upgradeModule(safe2Module, address(safe2));

        // Add new Safe to existing group after upgrade
        address[] memory owners = new address[](1);
        owners[0] = user1;
        Safe newSafe = createSafeWithNonce(owners, 1, 99);

        SafeModuleManager manager = SafeModuleManager(group1Manager);
        vm.prank(address(newSafe));
        address newModule = manager.addModuleForSafe();

        assertTrue(manager.hasModule(address(newSafe)), "New Safe should have module");
        assertEq(manager.getModuleForSafe(address(newSafe)), newModule, "Module address should match");

        // Verify module count increased
        assertEq(manager.getModuleCount(), 3, "Should now have 3 modules");
    }

    // ============================================
    // TEST: Storage Integrity After Upgrade
    // ============================================

    function testStorageIntegrityAfterUpgrade() public {
        // Get pre-upgrade data
        SafeModuleManager manager1 = SafeModuleManager(group1Manager);
        address[] memory modulesBefore = manager1.getAllModules();
        uint256 countBefore = manager1.getModuleCount();

        // Get group data before
        SyncGroupRegistry.SyncGroup memory group1Before = registry.getGroup(group1Id);
        SyncGroupRegistry.SyncGroup memory group2Before = registry.getGroup(group2Id);

        // Upgrade everything
        upgradeRegistry(address(registry), registryOwner);
        upgradeManager(group1Manager, group1Owner);
        upgradeManager(group2Manager, group2Owner);

        // Verify exact storage preservation
        address[] memory modulesAfter = manager1.getAllModules();
        uint256 countAfter = manager1.getModuleCount();

        assertEq(countAfter, countBefore, "Module count must be preserved");
        assertEq(modulesAfter.length, modulesBefore.length, "Modules array length must be preserved");

        for (uint256 i = 0; i < modulesBefore.length; i++) {
            assertEq(modulesAfter[i], modulesBefore[i], "Module addresses must be preserved in order");
        }

        // Verify group data preserved
        SyncGroupRegistry.SyncGroup memory group1After = registry.getGroup(group1Id);
        SyncGroupRegistry.SyncGroup memory group2After = registry.getGroup(group2Id);

        assertEq(group1After.owner, group1Before.owner, "Group 1 owner preserved");
        assertEq(group1After.name, group1Before.name, "Group 1 name preserved");
        assertEq(group1After.manager, group1Before.manager, "Group 1 manager preserved");
        assertEq(group1After.template, group1Before.template, "Group 1 template preserved");
        assertEq(group1After.createdAt, group1Before.createdAt, "Group 1 createdAt preserved");
        assertEq(group1After.active, group1Before.active, "Group 1 active status preserved");

        assertEq(group2After.owner, group2Before.owner, "Group 2 owner preserved");
        assertEq(group2After.name, group2Before.name, "Group 2 name preserved");
    }

    // ============================================
    // TEST: Multiple Consecutive Upgrades
    // ============================================

    function testMultipleConsecutiveUpgrades() public {
        // First upgrade
        address firstRegistryImpl = upgradeRegistry(address(registry), registryOwner);
        address firstManagerImpl = upgradeManager(group1Manager, group1Owner);

        // Verify state after first upgrade
        assertEq(registry.nextGroupId(), 2, "Group count after first upgrade");
        assertVersion(address(registry), "1.0.0");

        // Second upgrade
        address secondRegistryImpl = upgradeRegistry(address(registry), registryOwner);
        address secondManagerImpl = upgradeManager(group1Manager, group1Owner);

        // Verify implementations changed
        assertFalse(firstRegistryImpl == secondRegistryImpl, "Registry impl should change");
        assertFalse(firstManagerImpl == secondManagerImpl, "Manager impl should change");

        // Verify state still preserved
        assertEq(registry.nextGroupId(), 2, "Group count after second upgrade");
        SyncGroupRegistry.SyncGroup memory group1 = registry.getGroup(group1Id);
        assertTrue(group1.active, "Group should still be active");
    }

    // ============================================
    // TEST: Partial Upgrade (Mixed Versions)
    // ============================================

    function testPartialUpgradeScenario() public {
        // Upgrade only Group 1 manager, leave Group 2 on old version
        upgradeManager(group1Manager, group1Owner);
        assertVersion(group1Manager, "2.0.0-uups");

        // Upgrade only safe1 module, leave safe2 on old version
        upgradeModule(safe1Module, address(safe1));
        assertVersion(safe1Module, "2.0.0-uups");

        // Verify both versions work simultaneously
        SafeModuleManager manager1 = SafeModuleManager(group1Manager);
        SafeModuleManager manager2 = SafeModuleManager(group2Manager);

        assertEq(manager1.getModuleCount(), 2, "Upgraded manager should work");
        assertEq(manager2.getModuleCount(), 2, "Old manager should still work");

        // Create new Safe on upgraded manager
        address[] memory owners = new address[](1);
        owners[0] = user1;
        Safe newSafe = createSafeWithNonce(owners, 1, 100);

        vm.prank(address(newSafe));
        address newModule = manager1.addModuleForSafe();

        assertTrue(manager1.hasModule(address(newSafe)), "New module should work on upgraded manager");
        assertEq(manager1.getModuleCount(), 3, "Count should increase");
    }

    // ============================================
    // TEST: Upgrade With Active Operations
    // ============================================

    function testUpgradePreservesModuleConfiguration() public {
        // Configure module before upgrade
        ManagedSafeModule module1 = ManagedSafeModule(payable(safe1Module));
        uint256 thresholdBefore = module1.getSafeThreshold();
        bool configuredBefore = module1.isSafeConfigured();

        // Upgrade module
        upgradeModule(safe1Module, address(safe1));

        // Verify configuration preserved
        assertEq(module1.getSafeThreshold(), thresholdBefore, "Threshold should be preserved");
        assertEq(module1.isSafeConfigured(), configuredBefore, "Configured status should be preserved");
        assertEq(module1.avatar(), address(safe1), "Avatar should be preserved");
        assertEq(module1.target(), address(safe1), "Target should be preserved");
        assertEq(module1.manager(), group1Manager, "Manager should be preserved");
    }
}
