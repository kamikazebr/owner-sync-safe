// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "forge-std/Test.sol";
import "../src/ManagedSafeModule.sol";
import "./helpers/SafeTestHelper.sol";
import "./mock/MockSafeForFailure.sol";
import {ISafe} from "../src/interfaces/ISafe.sol";
import {InvalidSafeAddress, SafeNotConfigured, SafeAlreadyConfigured, InvalidOwnerAddress, SameOwnerAddress, ThresholdTooLow, ThresholdTooHigh, OnlyModuleOwner, OnlySafeOwners, AlreadySafeOwner, NotSafeOwner, OldOwnerNotFound, NewOwnerAlreadyExists, FailedToAddOwner} from "../src/errors/SafeModuleErrors.sol";

contract ManagedSafeModuleEdgeCasesTest is SafeTestHelper {
    Safe safe;
    ManagedSafeModule module;
    ManagedSafeModule unconfiguredModule;
    
    address owner0;
    address owner1;
    address owner2;
    address nonOwner;
    address moduleOwner;
    
    uint256 owner0PK;
    uint256 owner1PK;
    uint256 owner2PK;
    uint256 nonOwnerPK;

    function setUp() public {
        setUpSafeHelpers();

        // Create addresses
        (owner0, owner0PK) = makeAddrAndKey("owner0");
        (owner1, owner1PK) = makeAddrAndKey("owner1");
        (owner2, owner2PK) = makeAddrAndKey("owner2");
        (nonOwner, nonOwnerPK) = makeAddrAndKey("nonOwner");
        moduleOwner = address(this);
    
        // Create Safe
        address[] memory owners = new address[](1);
        owners[0] = owner0;
        safe = createSafeWithNonce(owners, 1, 1);
        
        // Create and configure module
        module = new ManagedSafeModule();
        module.setUp("");
        module.setAvatar(address(safe));
        module.setTarget(address(safe));
        module.configureForSafe();
        
        // Create unconfigured module for testing
        unconfiguredModule = new ManagedSafeModule();
        unconfiguredModule.setUp("");
        unconfiguredModule.setAvatar(address(safe));
        unconfiguredModule.setTarget(address(safe));
        // Don't configure this one
        
        // Enable module in Safe
        safeHelper(safe, owner0PK, address(safe), 
            abi.encodeWithSelector(ISafe.enableModule.selector, address(module)));
    }

    // ============ CONFIGURATION EDGE CASES ============
    
    function testConfigureForSafeWithZeroTarget() public {
        ManagedSafeModule testModule = new ManagedSafeModule();
        testModule.setUp("");
        // Don't set target - it will be address(0)
        
        vm.expectRevert(InvalidSafeAddress.selector);
        testModule.configureForSafe();
    }

    function testDoubleConfiguration() public {
        // Module is already configured in setUp
        vm.expectRevert(SafeAlreadyConfigured.selector);
        module.configureForSafe();
    }

    // ============ OWNER MANAGEMENT EDGE CASES ============
    
    function testAddOwnerAddress1() public {
        vm.expectRevert(InvalidOwnerAddress.selector);
        module.addSafeOwner(address(1), 1);
    }

    function testAddDuplicateOwner() public {
        // First add owner1
        module.addSafeOwner(owner1, 2);
        
        // Try to add same owner again
        vm.expectRevert(AlreadySafeOwner.selector);
        module.addSafeOwner(owner1, 2);
    }

    function testAddOwnerWhenNotConfigured() public {
        vm.expectRevert(SafeNotConfigured.selector);
        unconfiguredModule.addSafeOwner(owner1, 1);
    }

    function testAddOwnerOnlyModuleOwner() public {
        vm.prank(owner1);
        vm.expectRevert(OnlyModuleOwner.selector);
        module.addSafeOwner(owner2, 2);
    }

    // ============ REMOVE OWNER EDGE CASES ============
    
    function testRemoveOwnerNotConfigured() public {
        vm.expectRevert(SafeNotConfigured.selector);
        unconfiguredModule.removeSafeOwner(owner0, owner1, 1);
    }

    function testRemoveOwnerOnlyModuleOwner() public {
        vm.prank(owner1);
        vm.expectRevert(OnlyModuleOwner.selector);
        module.removeSafeOwner(owner0, owner1, 1);
    }

    function testRemoveZeroAddress() public {
        vm.expectRevert(InvalidOwnerAddress.selector);
        module.removeSafeOwner(owner0, address(0), 1);
    }

    function testRemoveNonExistentOwner() public {
        vm.expectRevert(NotSafeOwner.selector);
        module.removeSafeOwner(owner0, owner1, 1);
    }

    // ============ REPLACE OWNER EDGE CASES ============
    
    function testReplaceOwnerNotConfigured() public {
        vm.expectRevert(SafeNotConfigured.selector);
        unconfiguredModule.replaceSafeOwner(owner0, owner1, owner2);
    }

    function testReplaceOwnerOnlyModuleOwner() public {
        vm.prank(owner1);
        vm.expectRevert(OnlyModuleOwner.selector);
        module.replaceSafeOwner(owner0, owner1, owner2);
    }

    function testReplaceWithAddress1() public {
        // Add owner1 first
        module.addSafeOwner(owner1, 2);
        
        vm.expectRevert(InvalidOwnerAddress.selector);
        module.replaceSafeOwner(owner0, owner1, address(1));
    }

    function testReplaceSameAddress() public {
        // Add owner1 first
        module.addSafeOwner(owner1, 2);
        
        vm.expectRevert(SameOwnerAddress.selector);
        module.replaceSafeOwner(owner0, owner1, owner1);
    }

    function testReplaceNonExistentOldOwner() public {
        vm.expectRevert(OldOwnerNotFound.selector);
        module.replaceSafeOwner(owner0, owner1, owner2);
    }

    function testReplaceWithExistingOwner() public {
        // Add both owners
        module.addSafeOwner(owner1, 2);
        module.addSafeOwner(owner2, 3);
        
        vm.expectRevert(NewOwnerAlreadyExists.selector);
        module.replaceSafeOwner(owner0, owner1, owner2);
    }

    // ============ THRESHOLD EDGE CASES ============
    
    function testChangeThresholdNotConfigured() public {
        vm.expectRevert(SafeNotConfigured.selector);
        unconfiguredModule.changeSafeThreshold(1);
    }

    function testChangeThresholdOnlyModuleOwner() public {
        vm.prank(owner1);
        vm.expectRevert(OnlyModuleOwner.selector);
        module.changeSafeThreshold(1);
    }

    function testChangeThresholdToZero() public {
        vm.expectRevert(ThresholdTooLow.selector);
        module.changeSafeThreshold(0);
    }

    function testChangeThresholdTooHigh() public {
        // Module starts with 1 owner (threshold 1, safeOwners array is empty initially)
        vm.expectRevert(ThresholdTooHigh.selector);
        module.changeSafeThreshold(2);
    }

    // ============ TRANSACTION EXECUTION EDGE CASES ============
    
    function testExecTransactionNotConfigured() public {
        vm.expectRevert(SafeNotConfigured.selector);
        unconfiguredModule.execTransaction(address(0), 0, "", Enum.Operation.Call);
    }

    function testExecTransactionNonOwner() public {
        vm.prank(nonOwner);
        vm.expectRevert(OnlySafeOwners.selector);
        module.execTransaction(address(0), 0, "", Enum.Operation.Call);
    }

    // ============ VIEW FUNCTION EDGE CASES ============
    
    function testIsSafeOwnerNotConfigured() public {
        bool result = unconfiguredModule.isSafeOwner(owner1);
        assertFalse(result);
    }

    function testGetSafeOwnersNotConfigured() public {
        address[] memory owners = unconfiguredModule.getSafeOwners();
        assertEq(owners.length, 0);
    }

    function testGetSafeThresholdNotConfigured() public {
        uint256 threshold = unconfiguredModule.getSafeThreshold();
        assertEq(threshold, 0);
    }

    function testIsSafeConfiguredFalse() public {
        assertFalse(unconfiguredModule.isSafeConfigured());
    }

    function testIsSafeConfiguredTrue() public {
        assertTrue(module.isSafeConfigured());
    }

    // ============ CONFIGURATION WITH INTERNAL CALL TESTS ============
    
    function testConfigureForSafeInternal() public {
        // Create a new module to test internal configuration
        ManagedSafeModule newModule = new ManagedSafeModule();
        newModule.setUp("");
        newModule.setAvatar(address(safe));
        newModule.setTarget(address(safe));
        
        // Test that it's not configured initially
        assertFalse(newModule.isSafeConfigured());
        
        // Configure it
        newModule.configureForSafe();
        
        // Test that it's now configured
        assertTrue(newModule.isSafeConfigured());
    }

    // ============ INTERNAL HELPER FUNCTION TESTS ============
    
    function testRemoveFromSafeOwnersListMiddle() public {
        // Add multiple owners to test removal from middle of array
        module.addSafeOwner(owner1, 2); // triggers sync: owner0 + owner1
        module.addSafeOwner(owner2, 3); // adds: owner0 + owner1 + owner2
        module.addSafeOwner(nonOwner, 4); // adds: owner0 + owner1 + owner2 + nonOwner

        // Remove middle owner (owner2)
        module.removeSafeOwner(owner1, owner2, 3);

        // Check that owner2 was removed and array was reorganized
        assertFalse(module.isSafeOwner(owner2));
        assertTrue(module.isSafeOwner(owner1));
        assertTrue(module.isSafeOwner(nonOwner));
        assertTrue(module.isSafeOwner(owner0)); // synced owner still there
        assertEq(module.getSafeOwners().length, 3); // owner0 + owner1 + nonOwner
    }

    function testArrayManipulationBranchCoverage() public {
        // Add owners to test array manipulation in helper functions
        module.addSafeOwner(owner1, 2);
        address[] memory owners1 = module.getSafeOwners();
        assertEq(owners1.length, 2); // owner0 (synced) + owner1 (added)

        module.addSafeOwner(owner2, 3);
        address[] memory owners2 = module.getSafeOwners();
        assertEq(owners2.length, 3); // owner0 (synced) + owner1 + owner2

        module.addSafeOwner(nonOwner, 4);
        address[] memory owners3 = module.getSafeOwners();
        assertEq(owners3.length, 4); // owner0 (synced) + owner1 + owner2 + nonOwner

        // Test removal from different positions to cover array manipulation branches
        module.removeSafeOwner(owner2, nonOwner, 3); // Remove last, adjust threshold
        assertFalse(module.isSafeOwner(nonOwner));
        assertEq(module.getSafeOwners().length, 3); // owner0 + owner1 + owner2
    }

    // ============ COMPREHENSIVE WORKFLOW TESTS ============
    
    function testCompleteOwnerManagementWorkflow() public {
        // Start with 1 owner (owner0 from Safe creation)
        assertEq(module.getSafeThreshold(), 1);
        assertEq(module.getSafeOwners().length, 0); // Module not synced yet

        // Add owner1 - this triggers auto-sync, so we get owner0 + owner1
        module.addSafeOwner(owner1, 2);
        assertTrue(module.isSafeOwner(owner1));
        assertTrue(module.isSafeOwner(owner0)); // owner0 was synced
        assertEq(module.getSafeOwners().length, 2); // owner0 (synced) + owner1

        // Add owner2
        module.addSafeOwner(owner2, 2);
        assertTrue(module.isSafeOwner(owner2));
        assertEq(module.getSafeOwners().length, 3); // owner0 + owner1 + owner2
        
        // Change threshold
        module.changeSafeThreshold(2);
        assertEq(module.getSafeThreshold(), 2);
        
        // Replace owner1 with nonOwner
        module.replaceSafeOwner(owner2, owner1, nonOwner);
        assertFalse(module.isSafeOwner(owner1));
        assertTrue(module.isSafeOwner(nonOwner));
        
        // Remove owner2
        module.removeSafeOwner(nonOwner, owner2, 1);
        assertFalse(module.isSafeOwner(owner2));
        assertEq(module.getSafeOwners().length, 2); // owner0 + nonOwner remain
    }

    function testExecTransactionFromSafeOwner() public {
        // Add owner1 as a safe owner
        module.addSafeOwner(owner1, 2);
        
        // Execute transaction as safe owner
        vm.prank(owner1);
        module.execTransaction(address(0), 0, "", Enum.Operation.Call);
        // This should succeed without reverting
    }
}