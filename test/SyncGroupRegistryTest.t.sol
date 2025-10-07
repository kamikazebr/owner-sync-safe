// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.6;

import "./helpers/SafeTestHelper.sol";
import {SyncGroupRegistry} from "../src/SyncGroupRegistry.sol";
import {SafeModuleManager} from "../src/SafeModuleManager.sol";
import {ManagedSafeModule} from "../src/ManagedSafeModule.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract SyncGroupRegistryTest is SafeTestHelper {
    SyncGroupRegistry public registry;
    SafeModuleManager public managerImpl;
    ManagedSafeModule public moduleImpl;

    address public registryOwner;
    address public governanceSafe;
    address public user1;
    address public user2;

    address[] public owners;
    uint256 public threshold;

    event GroupCreated(uint256 indexed groupId, address indexed owner, address manager, string name);
    event GroupUpdated(uint256 indexed groupId, string name);
    event GroupDeactivated(uint256 indexed groupId);

    function setUp() public {
        setUpSafeHelpers();

        // Setup test owners and threshold
        owners = new address[](3);
        owners[0] = makeAddr("owner1");
        owners[1] = makeAddr("owner2");
        owners[2] = makeAddr("owner3");
        threshold = 2;

        registryOwner = makeAddr("registryOwner");
        governanceSafe = makeAddr("governanceSafe");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        // Deploy implementations
        managerImpl = new SafeModuleManager();
        moduleImpl = new ManagedSafeModule();

        // Deploy Registry
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
    }

    function testInitialization() public view {
        assertEq(registry.owner(), registryOwner);
        assertEq(address(registry.managerImplementation()), address(managerImpl));
        assertEq(address(registry.moduleImplementation()), address(moduleImpl));
        assertEq(registry.nextGroupId(), 0);
    }

    function testCreateGroup() public {
        string memory groupName = "Treasury Safes";

        // Don't check manager address in event as it's dynamically generated
        uint256 groupId = registry.createGroup(groupName, governanceSafe);

        assertEq(groupId, 0);
        assertEq(registry.nextGroupId(), 1);

        SyncGroupRegistry.SyncGroup memory group = registry.getGroup(groupId);
        assertEq(group.owner, governanceSafe);
        assertEq(group.name, groupName);
        assertTrue(group.active);
        assertEq(group.template, address(moduleImpl));
        assertTrue(group.manager != address(0));
        assertEq(group.createdAt, block.timestamp);

        // Check owner groups
        uint256[] memory ownerGroups = registry.getOwnerGroups(governanceSafe);
        assertEq(ownerGroups.length, 1);
        assertEq(ownerGroups[0], groupId);

        // Check manager to group mapping
        assertEq(registry.managerToGroup(group.manager), groupId);
    }

    function testCreateMultipleGroups() public {
        uint256 group1 = registry.createGroup("Group 1", governanceSafe);
        uint256 group2 = registry.createGroup("Group 2", user1);
        uint256 group3 = registry.createGroup("Group 3", governanceSafe);

        assertEq(group1, 0);
        assertEq(group2, 1);
        assertEq(group3, 2);

        // Check governanceSafe has 2 groups
        uint256[] memory govGroups = registry.getOwnerGroups(governanceSafe);
        assertEq(govGroups.length, 2);
        assertEq(govGroups[0], 0);
        assertEq(govGroups[1], 2);

        // Check user1 has 1 group
        uint256[] memory user1Groups = registry.getOwnerGroups(user1);
        assertEq(user1Groups.length, 1);
        assertEq(user1Groups[0], 1);
    }

    function testCannotCreateGroupWithZeroAddress() public {
        vm.expectRevert(SyncGroupRegistry.InvalidGovernanceSafe.selector);
        registry.createGroup("Test", address(0));
    }

    function testCannotCreateGroupWithEmptyName() public {
        vm.expectRevert(SyncGroupRegistry.InvalidName.selector);
        registry.createGroup("", governanceSafe);
    }

    function testUpdateGroupName() public {
        uint256 groupId = registry.createGroup("Original Name", governanceSafe);

        vm.startPrank(governanceSafe);
        vm.expectEmit(true, false, false, true);
        emit GroupUpdated(groupId, "New Name");

        registry.updateGroupName(groupId, "New Name");
        vm.stopPrank();

        SyncGroupRegistry.SyncGroup memory group = registry.getGroup(groupId);
        assertEq(group.name, "New Name");
    }

    function testCannotUpdateGroupNameIfNotOwner() public {
        uint256 groupId = registry.createGroup("Test", governanceSafe);

        vm.startPrank(user1);
        vm.expectRevert(SyncGroupRegistry.NotGroupOwner.selector);
        registry.updateGroupName(groupId, "New Name");
        vm.stopPrank();
    }

    function testCannotUpdateWithEmptyName() public {
        uint256 groupId = registry.createGroup("Test", governanceSafe);

        vm.startPrank(governanceSafe);
        vm.expectRevert(SyncGroupRegistry.InvalidName.selector);
        registry.updateGroupName(groupId, "");
        vm.stopPrank();
    }

    function testDeactivateGroup() public {
        uint256 groupId = registry.createGroup("Test", governanceSafe);

        vm.startPrank(governanceSafe);
        vm.expectEmit(true, false, false, false);
        emit GroupDeactivated(groupId);

        registry.deactivateGroup(groupId);
        vm.stopPrank();

        SyncGroupRegistry.SyncGroup memory group = registry.getGroup(groupId);
        assertFalse(group.active);
        assertFalse(registry.isGroupActive(groupId));
    }

    function testCannotDeactivateIfNotOwner() public {
        uint256 groupId = registry.createGroup("Test", governanceSafe);

        vm.startPrank(user1);
        vm.expectRevert(SyncGroupRegistry.NotGroupOwner.selector);
        registry.deactivateGroup(groupId);
        vm.stopPrank();
    }

    function testCannotDeactivateInactiveGroup() public {
        uint256 groupId = registry.createGroup("Test", governanceSafe);

        vm.startPrank(governanceSafe);
        registry.deactivateGroup(groupId);

        vm.expectRevert(SyncGroupRegistry.GroupNotActive.selector);
        registry.deactivateGroup(groupId);
        vm.stopPrank();
    }

    function testCreatedManagerHasCorrectOwner() public {
        uint256 groupId = registry.createGroup("Test", governanceSafe);
        SyncGroupRegistry.SyncGroup memory group = registry.getGroup(groupId);

        SafeModuleManager manager = SafeModuleManager(payable(group.manager));
        assertEq(manager.owner(), governanceSafe);
    }

    function testManagerCanCreateModules() public {
        // Create group
        uint256 groupId = registry.createGroup("Test", governanceSafe);
        SyncGroupRegistry.SyncGroup memory group = registry.getGroup(groupId);

        // Create a Safe
        Safe safe = createSafe(owners, threshold);

        // Manager can create module for safe
        SafeModuleManager manager = SafeModuleManager(payable(group.manager));
        address moduleAddress = manager.createModuleForSafe(address(safe));

        assertTrue(moduleAddress != address(0));
        assertEq(manager.safeToModule(address(safe)), moduleAddress);
    }

    function testFullGroupWorkflow() public {
        // 1. Create group
        uint256 groupId = registry.createGroup("Treasury Group", governanceSafe);
        SyncGroupRegistry.SyncGroup memory group = registry.getGroup(groupId);

        // 2. Create multiple Safes (simplified without actual Safe deployment)
        address safe1 = makeAddr("safe1");
        address safe2 = makeAddr("safe2");
        address safe3 = makeAddr("safe3");

        // 3. Create modules for each Safe
        SafeModuleManager manager = SafeModuleManager(payable(group.manager));
        address module1 = manager.createModuleForSafe(safe1);
        address module2 = manager.createModuleForSafe(safe2);
        address module3 = manager.createModuleForSafe(safe3);

        // 4. Verify all modules created
        assertTrue(module1 != address(0));
        assertTrue(module2 != address(0));
        assertTrue(module3 != address(0));
        assertTrue(module1 != module2);
        assertTrue(module2 != module3);

        // 5. Verify manager tracking
        assertEq(manager.safeToModule(safe1), module1);
        assertEq(manager.safeToModule(safe2), module2);
        assertEq(manager.safeToModule(safe3), module3);
    }

    function testGetGroupByManager() public {
        uint256 groupId = registry.createGroup("Test", governanceSafe);
        SyncGroupRegistry.SyncGroup memory group = registry.getGroup(groupId);

        uint256 foundGroupId = registry.getGroupByManager(group.manager);
        assertEq(foundGroupId, groupId);
    }

    function testUpdateManagerImplementation() public {
        SafeModuleManager newManagerImpl = new SafeModuleManager();

        vm.startPrank(registryOwner);
        registry.updateManagerImplementation(newManagerImpl);
        vm.stopPrank();

        assertEq(address(registry.managerImplementation()), address(newManagerImpl));
    }

    function testUpdateModuleImplementation() public {
        ManagedSafeModule newModuleImpl = new ManagedSafeModule();

        vm.startPrank(registryOwner);
        registry.updateModuleImplementation(newModuleImpl);
        vm.stopPrank();

        assertEq(address(registry.moduleImplementation()), address(newModuleImpl));
    }

    function testCannotUpdateImplementationsIfNotOwner() public {
        SafeModuleManager newManagerImpl = new SafeModuleManager();

        vm.startPrank(user1);
        vm.expectRevert();
        registry.updateManagerImplementation(newManagerImpl);
        vm.stopPrank();
    }
}
