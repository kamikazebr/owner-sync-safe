// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/ManagedSafeModule.sol";
import "../src/SafeModuleManager.sol";
import "./helpers/SafeTestHelper.sol";
import "@gnosis.pm/safe-contracts/contracts/common/Enum.sol";

contract SafeModuleManagerNewFunctionsTest is Test, SafeTestHelper {
    
    SafeModuleManager public moduleManager;
    ManagedSafeModule public moduleTemplate;
    address public managerOwner;
    uint256 managerOwnerPK;
    uint256 owner1PK;
    
    address public owner1;
    
    Safe public safe1;
    
    function setUp() public {
        // Set up Safe helpers first
        setUpSafeHelpers();
        
        // Deploy module template
        moduleTemplate = new ManagedSafeModule();

        // Deploy factory using UUPS
        SafeModuleManager implementation = new SafeModuleManager();

        bytes memory initData = abi.encodeWithSelector(
            SafeModuleManager.initialize.selector,
            moduleTemplate,
            address(this)
        );

        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        moduleManager = SafeModuleManager(address(proxy));
        
        // Set up keys
        managerOwnerPK = 0xa11ce;
        owner1PK = 0xb0b;
        
        managerOwner = vm.addr(managerOwnerPK);
        owner1 = vm.addr(owner1PK);
        
        // Set factory owner
        moduleManager.transferOwnership(managerOwner);
        vm.prank(managerOwner);
        moduleManager.acceptOwnership();
        
        // Deploy and setup Safe
        address[] memory owners = new address[](1);
        owners[0] = owner1;
        safe1 = createSafe(owners, 1);
    }
    
    function testSetSafeToModule() public {
        // Create a module first
        address module = moduleManager.createModuleForSafe(address(safe1));
        
        // Create another Safe with unique nonce to avoid collision
        address[] memory owners2 = new address[](1);
        owners2[0] = owner1;
        Safe safe2 = createSafeWithNonce(owners2, 1, 2);
        
        // Set the module for safe2 using setSafeToModule
        vm.prank(managerOwner);
        moduleManager.setSafeToModule(address(safe2), module);
        
        // Verify the mapping was set
        assertEq(moduleManager.safeToModule(address(safe2)), module,"safeToModule");
        assertEq(moduleManager.getModuleForSafe(address(safe2)), module,"getModuleForSafe");
        assertTrue(moduleManager.hasModule(address(safe2)),"hasModule");
    }
    
    function testSetSafeToModuleOnlyOwner() public {
        // Create a module first
        address module = moduleManager.createModuleForSafe(address(safe1));
        
        // Try to call setSafeToModule from non-owner - should revert
        vm.prank(owner1);
        vm.expectRevert(OnlyManagerOwner.selector);
        moduleManager.setSafeToModule(address(safe1), module);
    }
    
    function testSetSafeToModuleInvalidModule() public {
        address fakeModule = address(0x1234);
        
        vm.prank(managerOwner);
        vm.expectRevert(InvalidModuleAddress.selector);
        moduleManager.setSafeToModule(address(safe1), fakeModule);
    }
    
    function testSetSafeToModuleZeroAddresses() public {
        address module = moduleManager.createModuleForSafe(address(safe1));
        
        // Test zero safe address
        vm.prank(managerOwner);
        vm.expectRevert(InvalidSafeAddress.selector);
        moduleManager.setSafeToModule(address(0), module);
        
        // Test zero module address
        vm.prank(managerOwner);
        vm.expectRevert(InvalidModuleAddress.selector);
        moduleManager.setSafeToModule(address(safe1), address(0));
    }
    
    
    
    
    
    function testSetSafeToModuleEvent() public {
        address module = moduleManager.createModuleForSafe(address(safe1));
        address[] memory owners2 = new address[](1);
        owners2[0] = owner1;
        Safe safe2 = createSafeWithNonce(owners2, 1, 3);
        
        vm.prank(managerOwner);
        vm.expectEmit(true, true, false, false);
        emit SafeToModuleSet(address(safe2), module);
        moduleManager.setSafeToModule(address(safe2), module);
    }
    
    
    // Events to match contract events
    event SafeToModuleSet(address indexed safe, address indexed module);
}