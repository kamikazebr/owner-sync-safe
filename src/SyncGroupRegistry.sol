// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.6;

import {SafeModuleManager} from "./SafeModuleManager.sol";
import {ManagedSafeModule} from "./ManagedSafeModule.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";

/**
 * @title SyncGroupRegistry
 * @notice Registry for managing sync groups of Safes
 * @dev Each group has its own SafeModuleManager and operates independently
 */
contract SyncGroupRegistry is Initializable, UUPSUpgradeable, Ownable2StepUpgradeable {
    string public constant VERSION = "1.0.0";

    struct SyncGroup {
        address manager;        // SafeModuleManager for this group
        address template;       // ManagedSafeModule template
        address owner;          // Governance Safe that controls this group
        string name;            // Human-readable group name
        bool active;            // Group status
        uint256 createdAt;      // Creation timestamp
    }

    // Group storage
    mapping(uint256 => SyncGroup) public groups;
    mapping(address => uint256[]) public ownerGroups;  // Groups by governance Safe
    mapping(address => uint256) public managerToGroup;  // Reverse lookup
    uint256 public nextGroupId;

    // Implementation templates for cloning
    SafeModuleManager public managerImplementation;
    ManagedSafeModule public moduleImplementation;

    // Events
    event GroupCreated(uint256 indexed groupId, address indexed owner, address manager, string name);
    event GroupUpdated(uint256 indexed groupId, string name);
    event GroupDeactivated(uint256 indexed groupId);
    event SafeAddedToGroup(uint256 indexed groupId, address indexed safe, address indexed module);
    event SafeRemovedFromGroup(uint256 indexed groupId, address indexed safe);

    // Errors
    error InvalidGroupId();
    error InvalidGovernanceSafe();
    error InvalidName();
    error GroupNotActive();
    error NotGroupOwner();
    error ManagerAlreadyRegistered();

    // Modifiers
    modifier onlyGroupOwner(uint256 groupId) {
        if (msg.sender != groups[groupId].owner) revert NotGroupOwner();
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the registry
     * @param _managerImplementation SafeModuleManager implementation for cloning
     * @param _moduleImplementation ManagedSafeModule implementation for cloning
     * @param _owner Registry owner
     */
    function initialize(
        SafeModuleManager _managerImplementation,
        ManagedSafeModule _moduleImplementation,
        address _owner
    ) public initializer {
        __Ownable_init();
        __Ownable2Step_init();
        __UUPSUpgradeable_init();

        managerImplementation = _managerImplementation;
        moduleImplementation = _moduleImplementation;
        _transferOwnership(_owner);
    }

    /**
     * @dev Create a new sync group
     * @param name Group name
     * @param governanceSafe Safe that will own and control this group
     * @return groupId The ID of the created group
     */
    function createGroup(string memory name, address governanceSafe) external returns (uint256 groupId) {
        if (governanceSafe == address(0)) revert InvalidGovernanceSafe();
        if (bytes(name).length == 0) revert InvalidName();

        groupId = nextGroupId++;

        // Deploy new SafeModuleManager proxy
        ERC1967Proxy managerProxy = new ERC1967Proxy(
            address(managerImplementation),
            abi.encodeWithSelector(
                SafeModuleManager.initialize.selector,
                moduleImplementation,
                governanceSafe  // Governance Safe owns the manager
            )
        );
        address manager = address(managerProxy);

        // Store group info
        groups[groupId] = SyncGroup({
            manager: manager,
            template: address(moduleImplementation),
            owner: governanceSafe,
            name: name,
            active: true,
            createdAt: block.timestamp
        });

        ownerGroups[governanceSafe].push(groupId);
        managerToGroup[manager] = groupId;

        emit GroupCreated(groupId, governanceSafe, manager, name);
    }

    /**
     * @dev Update group name
     * @param groupId Group ID
     * @param newName New name
     */
    function updateGroupName(uint256 groupId, string memory newName) external onlyGroupOwner(groupId) {
        SyncGroup storage group = groups[groupId];
        if (!group.active) revert GroupNotActive();
        if (bytes(newName).length == 0) revert InvalidName();

        group.name = newName;
        emit GroupUpdated(groupId, newName);
    }

    /**
     * @dev Deactivate a group (doesn't delete, just marks inactive)
     * @param groupId Group ID
     */
    function deactivateGroup(uint256 groupId) external onlyGroupOwner(groupId) {
        SyncGroup storage group = groups[groupId];
        if (!group.active) revert GroupNotActive();

        group.active = false;
        emit GroupDeactivated(groupId);
    }

    /**
     * @dev Get group information
     * @param groupId Group ID
     * @return Group struct
     */
    function getGroup(uint256 groupId) external view returns (SyncGroup memory) {
        return groups[groupId];
    }

    /**
     * @dev Get all groups owned by a governance Safe
     * @param governanceSafe Governance Safe address
     * @return Array of group IDs
     */
    function getOwnerGroups(address governanceSafe) external view returns (uint256[] memory) {
        return ownerGroups[governanceSafe];
    }

    /**
     * @dev Get group ID from manager address
     * @param manager Manager address
     * @return Group ID
     */
    function getGroupByManager(address manager) external view returns (uint256) {
        return managerToGroup[manager];
    }

    /**
     * @dev Check if a group is active
     * @param groupId Group ID
     * @return True if active
     */
    function isGroupActive(uint256 groupId) external view returns (bool) {
        return groups[groupId].active;
    }

    /**
     * @dev Record when a Safe is added to a group (called by UI/external tracking)
     * @param groupId Group ID
     * @param safe Safe address
     * @param module Module address
     */
    function recordSafeAdded(uint256 groupId, address safe, address module) external {
        SyncGroup storage group = groups[groupId];
        if (!group.active) revert GroupNotActive();
        // Anyone can record this for tracking purposes
        emit SafeAddedToGroup(groupId, safe, module);
    }

    /**
     * @dev Record when a Safe is removed from a group
     * @param groupId Group ID
     * @param safe Safe address
     */
    function recordSafeRemoved(uint256 groupId, address safe) external {
        SyncGroup storage group = groups[groupId];
        if (!group.active) revert GroupNotActive();
        emit SafeRemovedFromGroup(groupId, safe);
    }

    /**
     * @dev Authorize upgrade (only owner)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @dev Update manager implementation template
     * @param newManagerImplementation New manager implementation
     */
    function updateManagerImplementation(SafeModuleManager newManagerImplementation) external onlyOwner {
        managerImplementation = newManagerImplementation;
    }

    /**
     * @dev Update module implementation template
     * @param newModuleImplementation New module implementation
     */
    function updateModuleImplementation(ManagedSafeModule newModuleImplementation) external onlyOwner {
        moduleImplementation = newModuleImplementation;
    }
}
