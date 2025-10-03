// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "forge-std/Test.sol";
import "../src/ManagedSafeModule.sol";
import "./helpers/SafeTestHelper.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ISafe} from "../src/interfaces/ISafe.sol";
import {SyncLimitTooHigh, SyncLimitTooLow, OperationRequiresFullSync} from "../src/errors/SafeModuleErrors.sol";

contract ManagedSafeModuleAutoSyncTest is SafeTestHelper {
    Safe safe;
    ManagedSafeModule module;

    address owner0;
    address owner1;
    address owner2;
    address owner3;
    address[] manyOwners;

    uint256 owner0PK;
    uint256 owner1PK;
    uint256 owner2PK;
    uint256 owner3PK;

    event OwnersSynced(uint256 count, bool isComplete);
    event SyncLimitReached(uint256 totalOwners, uint256 syncedOwners);
    event MaxSyncOwnersUpdated(uint256 oldLimit, uint256 newLimit);
    event AutoSyncStatusChanged(bool enabled);
    event RequireFullSyncChanged(bool enabled);

    function setUp() public {
        setUpSafeHelpers();

        // Create addresses
        (owner0, owner0PK) = makeAddrAndKey("owner0");
        (owner1, owner1PK) = makeAddrAndKey("owner1");
        (owner2, owner2PK) = makeAddrAndKey("owner2");
        (owner3, owner3PK) = makeAddrAndKey("owner3");

        // Create many test owners for sync limit tests
        for (uint i = 0; i < 15; i++) {
            manyOwners.push(makeAddr(string(abi.encodePacked("testOwner", vm.toString(i)))));
        }

        // Create Safe with single owner
        address[] memory owners = new address[](1);
        owners[0] = owner0;
        safe = createSafeWithNonce(owners, 1, 1);

        // Create and configure module with proxy
        ManagedSafeModule moduleImpl = new ManagedSafeModule();
        bytes memory initData = abi.encodeWithSelector(ManagedSafeModule.setUp.selector, "");
        ERC1967Proxy moduleProxy = new ERC1967Proxy(address(moduleImpl), initData);
        module = ManagedSafeModule(address(moduleProxy));
        module.setAvatar(address(safe));
        module.setTarget(address(safe));

        // Enable module in Safe
        safeHelper(safe, owner0PK, address(safe),
            abi.encodeWithSelector(ISafe.enableModule.selector, address(module)));
    }

    // ============ AUTO-SYNC CONFIGURATION TESTS ============

    function testDefaultAutoSyncSettings() public {
        // Auto-sync should be enabled by default
        assertEq(module.autoSyncEnabled(), true);
        assertEq(module.requireFullSyncForOperations(), false);
        assertEq(module.maxSyncOwners(), 10);
    }

    function testAutoSyncOnConfiguration() public {
        // Before configuration, no owners tracked
        assertEq(module.getSafeOwners().length, 0);

        // Configure module - should NOT auto-sync (per current implementation)
        module.configureForSafe();

        // Should still be empty since configuration doesn't trigger sync
        assertEq(module.getSafeOwners().length, 0);
        assertEq(module.getSafeThreshold(), 1);
    }

    function testAutoSyncOnFirstOperation() public {
        module.configureForSafe();

        // First operation should trigger auto-sync
        vm.expectEmit(true, true, false, false);
        emit OwnersSynced(1, true);

        module.addSafeOwner(owner1, 2);

        // Should have synced owner0 and added owner1
        assertEq(module.getSafeOwners().length, 2);
        assertTrue(module.isSafeOwner(owner0));
        assertTrue(module.isSafeOwner(owner1));
    }

    // ============ SYNC LIMIT TESTS ============

    function testSyncWithinLimit() public {
        module.configureForSafe();

        // Add 3 more owners to Safe (total 4, under default limit of 10)
        // Keep threshold at 1 to avoid multi-sig complexity in tests
        safeHelper(safe, owner0PK, address(safe),
            abi.encodeWithSelector(ISafe.addOwnerWithThreshold.selector, owner1, 1));
        safeHelper(safe, owner0PK, address(safe),
            abi.encodeWithSelector(ISafe.addOwnerWithThreshold.selector, owner2, 1));
        safeHelper(safe, owner0PK, address(safe),
            abi.encodeWithSelector(ISafe.addOwnerWithThreshold.selector, owner3, 1));

        // Manual sync should sync all owners
        vm.expectEmit(true, true, false, false);
        emit OwnersSynced(4, true);

        bool fullySynced = module.syncOwnersFromSafe();
        assertTrue(fullySynced);

        assertEq(module.getSafeOwners().length, 4);
        assertTrue(module.isSafeOwner(owner0));
        assertTrue(module.isSafeOwner(owner1));
        assertTrue(module.isSafeOwner(owner2));
        assertTrue(module.isSafeOwner(owner3));
        assertTrue(module.isSyncComplete());
    }

    function testSyncLimitReached() public {
        module.configureForSafe();

        // Set lower sync limit
        module.setMaxSyncOwners(3);

        // Add many owners to Safe (beyond sync limit)
        for (uint i = 0; i < 5; i++) {
            safeHelper(safe, owner0PK, address(safe),
                abi.encodeWithSelector(ISafe.addOwnerWithThreshold.selector, manyOwners[i], 1));
        }

        // Manual sync should hit limit
        vm.expectEmit(true, true, false, false);
        emit SyncLimitReached(6, 3); // 6 total (owner0 + 5 added), 3 synced

        vm.expectEmit(true, true, false, false);
        emit OwnersSynced(3, false);

        bool fullySynced = module.syncOwnersFromSafe();
        assertFalse(fullySynced);

        assertEq(module.getSafeOwners().length, 3);
        assertFalse(module.isSyncComplete());

        (uint256 synced, bool complete, uint256 limit, bool autoSync, bool strictMode) = module.getSyncStatus();
        assertEq(synced, 3);
        assertFalse(complete);
        assertEq(limit, 3);
        assertTrue(autoSync);
        assertFalse(strictMode);
    }

    // ============ SYNC CONFIGURATION TESTS ============

    function testSetMaxSyncOwners() public {
        module.configureForSafe();

        vm.expectEmit(true, true, false, false);
        emit MaxSyncOwnersUpdated(10, 25);

        module.setMaxSyncOwners(25);
        assertEq(module.maxSyncOwners(), 25);
    }

    function testSetMaxSyncOwnersLimits() public {
        module.configureForSafe();

        // Should revert if too low
        vm.expectRevert(SyncLimitTooLow.selector);
        module.setMaxSyncOwners(0);

        // Should revert if too high
        vm.expectRevert(SyncLimitTooHigh.selector);
        module.setMaxSyncOwners(51);

        // Should work at boundaries
        module.setMaxSyncOwners(1);
        assertEq(module.maxSyncOwners(), 1);

        module.setMaxSyncOwners(50);
        assertEq(module.maxSyncOwners(), 50);
    }

    function testSetAutoSync() public {
        module.configureForSafe();

        vm.expectEmit(true, true, false, false);
        emit AutoSyncStatusChanged(false);

        module.setAutoSync(false);
        assertFalse(module.autoSyncEnabled());

        vm.expectEmit(true, true, false, false);
        emit AutoSyncStatusChanged(true);

        module.setAutoSync(true);
        assertTrue(module.autoSyncEnabled());
    }

    function testSetRequireFullSync() public {
        module.configureForSafe();

        vm.expectEmit(true, true, false, false);
        emit RequireFullSyncChanged(true);

        module.setRequireFullSync(true);
        assertTrue(module.requireFullSyncForOperations());

        vm.expectEmit(true, true, false, false);
        emit RequireFullSyncChanged(false);

        module.setRequireFullSync(false);
        assertFalse(module.requireFullSyncForOperations());
    }

    // ============ STRICT MODE TESTS ============

    function testStrictModeBlocksPartialSync() public {
        module.configureForSafe();

        // Enable strict mode and set low sync limit
        module.setRequireFullSync(true);
        module.setMaxSyncOwners(2);

        // Add owners beyond sync limit
        safeHelper(safe, owner0PK, address(safe),
            abi.encodeWithSelector(ISafe.addOwnerWithThreshold.selector, owner1, 1));
        safeHelper(safe, owner0PK, address(safe),
            abi.encodeWithSelector(ISafe.addOwnerWithThreshold.selector, owner2, 1));
        safeHelper(safe, owner0PK, address(safe),
            abi.encodeWithSelector(ISafe.addOwnerWithThreshold.selector, owner3, 1));

        // Operation should fail due to incomplete sync
        vm.expectRevert(OperationRequiresFullSync.selector);
        module.addSafeOwner(manyOwners[0], 5);
    }

    function testStrictModeAllowsCompleteSync() public {
        module.configureForSafe();

        // Enable strict mode and set adequate sync limit
        module.setRequireFullSync(true);
        module.setMaxSyncOwners(10);

        // Add a few owners (within limit)
        safeHelper(safe, owner0PK, address(safe),
            abi.encodeWithSelector(ISafe.addOwnerWithThreshold.selector, owner1, 1));

        // Operation should succeed since sync is complete
        module.addSafeOwner(owner2, 3);
        assertTrue(module.isSafeOwner(owner2));
    }

    // ============ DISABLED AUTO-SYNC TESTS ============

    function testDisabledAutoSync() public {
        module.configureForSafe();
        module.setAutoSync(false);

        // Add owner to Safe directly
        safeHelper(safe, owner0PK, address(safe),
            abi.encodeWithSelector(ISafe.addOwnerWithThreshold.selector, owner1, 1));

        // Operation should not trigger sync
        module.addSafeOwner(owner2, 3);

        // Should not have synced owner1, only added owner2
        assertFalse(module.isSafeOwner(owner0)); // Not synced
        assertFalse(module.isSafeOwner(owner1)); // Not synced
        assertTrue(module.isSafeOwner(owner2)); // Explicitly added
    }

    // ============ MANUAL SYNC TESTS ============

    function testManualSyncOnlyOwner() public {
        module.configureForSafe();

        vm.prank(owner1);
        vm.expectRevert("OnlyModuleOwner()");
        module.syncOwnersFromSafe();
    }

    function testGetSyncStatus() public {
        module.configureForSafe();

        // Initial status
        (uint256 synced, bool complete, uint256 limit, bool autoSync, bool strictMode) = module.getSyncStatus();
        assertEq(synced, 0);
        assertTrue(complete); // Complete when no owners synced yet
        assertEq(limit, 10);
        assertTrue(autoSync);
        assertFalse(strictMode);

        // After adding owners and syncing
        module.addSafeOwner(owner1, 2);

        (synced, complete, limit, autoSync, strictMode) = module.getSyncStatus();
        assertEq(synced, 2); // owner0 + owner1
        assertTrue(complete);
        assertEq(limit, 10);
        assertTrue(autoSync);
        assertFalse(strictMode);
    }

    // ============ LINKED LIST FUNCTIONALITY TESTS ============

    function testPrevOwnerTracking() public {
        module.configureForSafe();

        // Add owners to trigger sync
        module.addSafeOwner(owner1, 2);
        module.addSafeOwner(owner2, 3);

        // Check that prev owner mappings are set
        // Based on the trace, Safe.getOwners() returns [owner1, owner0, owner2]
        // So owner1 should have SENTINEL_OWNERS as prev, and others should have valid prevs
        address[] memory syncedOwners = module.getSafeOwners();

        // Verify we have the expected owners
        assertEq(syncedOwners.length, 3);
        assertTrue(module.isSafeOwner(owner0));
        assertTrue(module.isSafeOwner(owner1));
        assertTrue(module.isSafeOwner(owner2));

        // The first owner in the list should have SENTINEL_OWNERS as prev
        address firstOwner = syncedOwners[0];
        address prevFirst = module.getPrevOwner(firstOwner);
        assertEq(prevFirst, address(0x1)); // SENTINEL_OWNERS
    }

    function testSyncClearsAndRebuilds() public {
        module.configureForSafe();

        // First sync
        module.addSafeOwner(owner1, 1);
        assertEq(module.getSafeOwners().length, 2);

        // Add owner directly to Safe
        safeHelper(safe, owner0PK, address(safe),
            abi.encodeWithSelector(ISafe.addOwnerWithThreshold.selector, owner2, 1));

        // Manual sync should rebuild completely
        module.syncOwnersFromSafe();
        assertEq(module.getSafeOwners().length, 3);
        assertTrue(module.isSafeOwner(owner2));
    }
}