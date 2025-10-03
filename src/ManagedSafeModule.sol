// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.6;

import {Module, Enum} from "@zodiac/contracts/core/Module.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./errors/SafeModuleErrors.sol";
import {ISafe} from "./interfaces/ISafe.sol";

contract ManagedSafeModule is Module, UUPSUpgradeable {
    // Mapeamento para armazenar configurações por Safe
    string public constant VERSION = "2.0.0-uups";

    // Manager that created this module
    address public manager;
    
    // Auto-sync configuration
    bool public autoSyncEnabled = true;
    bool public requireFullSyncForOperations = false;
    uint256 public maxSyncOwners = 10;
    uint256 constant MAX_ALLOWED_SYNC = 50;
    
    SafeConfig public safeConfig;
    
    struct SafeConfig {
        bool isConfigured;
        uint256 threshold;
        address[] safeOwners;      // Lista de owners do Safe
        mapping(address => bool) isSafeOwner; // Verificação rápida se é owner
        mapping(address => address) prevOwner; // For linked list operations
        bool isPartiallySynced;    // Track if we hit the sync limit
    }

    // Eventos para rastrear mudanças
    event SafeConfigured(address indexed safe);
    event SafeOwnerAdded(address indexed safe, address indexed newOwner);
    event SafeOwnerRemoved(address indexed safe, address indexed removedOwner);
    event SafeOwnerReplaced(address indexed safe, address indexed oldOwner, address indexed newOwner);
    event SafeThresholdChanged(address indexed safe, uint256 newThreshold);
    
    // Sync events
    event OwnersSynced(uint256 count, bool isComplete);
    event SyncLimitReached(uint256 totalOwners, uint256 syncedOwners);
    event MaxSyncOwnersUpdated(uint256 oldLimit, uint256 newLimit);
    event AutoSyncStatusChanged(bool enabled);
    event RequireFullSyncChanged(bool enabled);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Implementação da função setUp do FactoryFriendly
     */
    function setUp(bytes memory) public override initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        // Set the manager to the contract that created this module
        manager = msg.sender;

        // Initialize auto-sync configuration with default values
        autoSyncEnabled = true;
        requireFullSyncForOperations = false;
        maxSyncOwners = 10;
    }

    /**
     * @dev Função interna para configurar o módulo (usada no setUp)
     * @param _safe Endereço do Safe
     */
    function _configureForSafeInternal(address _safe) internal {
        if (_safe == address(0)) revert InvalidSafeAddress();
        if (safeConfig.isConfigured) revert SafeAlreadyConfigured();

        // Salvar configuração - inicializar campos individualmente
        safeConfig.isConfigured = true;
        safeConfig.threshold = 1;
        safeConfig.safeOwners = new address[](0);

        emit SafeConfigured(_safe);
    }

    /**
     * @dev Configura o módulo para o Safe atual (avatar)
     */
    function configureForSafe() external {
        address _target = target;
        if (_target == address(0)) revert InvalidSafeAddress();
        if (safeConfig.isConfigured) revert SafeAlreadyConfigured();

        _configureForSafeInternal(_target);
    }

    /**
     * @dev Internal function to validate that the caller is the module owner
     */
    function _validateModuleOwner() internal view {
        if (msg.sender != owner() && msg.sender != manager) revert OnlyModuleOwner();
    }

    /**
     * @dev Add um owner ao Safe
     * @param newOwner Endereço do novo owner
     * @param threshold Novo threshold
     */
    function addSafeOwner(address newOwner, uint256 threshold) external {
        _validateModuleOwner();
        _syncAndCheckIfRequired();
        
        address safe = avatar;
        if (!safeConfig.isConfigured) revert SafeNotConfigured();
        if (newOwner == address(0) || newOwner == address(1)) revert InvalidOwnerAddress();
        if (safeConfig.isSafeOwner[newOwner]) revert AlreadySafeOwner();
        
        // Adicionar owner ao Safe
        (bool success, bytes memory data) = execAndReturnData(
            safe,
            0,
            abi.encodeWithSignature("addOwnerWithThreshold(address,uint256)", newOwner, threshold),
            Enum.Operation.Call
        );

        if (!success) revert FailedToAddOwner(data);

        // Atualizar lista local de owners
        safeConfig.safeOwners.push(newOwner);
        safeConfig.isSafeOwner[newOwner] = true;

        emit SafeOwnerAdded(safe, newOwner);
    }

    /**
     * @dev Remove um owner do Safe
     * @param prevOwner Endereço do owner anterior na lista
     * @param ownerToRemove Endereço do owner a ser removido
     * @param threshold Novo threshold
     */
    function removeSafeOwner(address prevOwner, address ownerToRemove, uint256 threshold) external {
        _validateModuleOwner();
        _syncAndCheckIfRequired();
        
        address safe = avatar;
        if (!safeConfig.isConfigured) revert SafeNotConfigured();
        if (ownerToRemove == address(0)) revert InvalidOwnerAddress();
        if (!safeConfig.isSafeOwner[ownerToRemove]) revert NotSafeOwner();
        
        // Remover owner do Safe
        exec(
            safe,
            0,
            abi.encodeWithSignature("removeOwner(address,address,uint256)", prevOwner, ownerToRemove, threshold),
            Enum.Operation.Call
        );

        // Remover da lista local
        removeFromSafeOwnersList(safe, ownerToRemove);
        safeConfig.isSafeOwner[ownerToRemove] = false;

        emit SafeOwnerRemoved(safe, ownerToRemove);
    }

    /**
     * @dev Replace um owner do Safe
     * @param prevOwner Endereço do owner anterior na lista
     * @param oldOwner Endereço do owner a ser substituído
     * @param newOwner Endereço do novo owner
     */
    function replaceSafeOwner(address prevOwner, address oldOwner, address newOwner) external {
        _validateModuleOwner();
        _syncAndCheckIfRequired();
        
        address safe = avatar;
        if (!safeConfig.isConfigured) revert SafeNotConfigured();
        if (newOwner == address(0) || newOwner == address(1)) revert InvalidOwnerAddress();
        if (oldOwner == newOwner) revert SameOwnerAddress();
        if (!safeConfig.isSafeOwner[oldOwner]) revert OldOwnerNotFound();
        if (safeConfig.isSafeOwner[newOwner]) revert NewOwnerAlreadyExists();
        
        // Substituir owner no Safe
        exec(
            safe,
            0,
            abi.encodeWithSignature("swapOwner(address,address,address)", prevOwner, oldOwner, newOwner),
            Enum.Operation.Call
        );

        // Atualizar lista local
        replaceInSafeOwnersList(safe, oldOwner, newOwner);
        safeConfig.isSafeOwner[oldOwner] = false;
        safeConfig.isSafeOwner[newOwner] = true;

        emit SafeOwnerReplaced(safe, oldOwner, newOwner);
    }

    /**
     * @dev Change threshold do Safe
     * @param threshold Novo threshold
     */
    function changeSafeThreshold(uint256 threshold) external {
        _validateModuleOwner();
        _syncAndCheckIfRequired();
        
        address safe = avatar;
        if (!safeConfig.isConfigured) revert SafeNotConfigured();
        if (threshold == 0) revert ThresholdTooLow();
        if (threshold > safeConfig.safeOwners.length) revert ThresholdTooHigh();
        
        exec(
            safe,
            0,
            abi.encodeWithSignature("changeThreshold(uint256)", threshold),
            Enum.Operation.Call
        );

        safeConfig.threshold = threshold;
        emit SafeThresholdChanged(safe, threshold);
    }

    /**
     * @dev Executa uma transação através do Safe
     * @param to Endereço de destino
     * @param value Valor em ETH
     * @param data Dados da transação
     * @param operation Tipo de operação
     */
    function execTransaction(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    ) external {
        if (!safeConfig.isConfigured) revert SafeNotConfigured();
        if (!safeConfig.isSafeOwner[msg.sender]) revert OnlySafeOwners();
        
        exec(to, value, data, operation);
    }

    // ============ SYNC FUNCTIONS ============

    /**
     * @dev Sync owners from Safe (only module owner can call)
     */
    function syncOwnersFromSafe() external returns (bool fullySynced) {
        _validateModuleOwner();
        return _syncOwnersFromSafe();
    }

    /**
     * @dev Internal function to sync owners from Safe
     */
    function _syncOwnersFromSafe() internal returns (bool fullySynced) {
        if (!safeConfig.isConfigured) return false;
        
        address[] memory owners = ISafe(avatar).getOwners();
        uint256 threshold = ISafe(avatar).getThreshold();
        uint256 ownersToSync = owners.length > maxSyncOwners ? maxSyncOwners : owners.length;
        
        // Clear existing data
        _clearOwnerData();
        
        // Sync owners up to limit
        for (uint256 i = 0; i < ownersToSync; i++) {
            safeConfig.safeOwners.push(owners[i]);
            safeConfig.isSafeOwner[owners[i]] = true;
            
            // Build linked list structure
            if (i == 0) {
                safeConfig.prevOwner[owners[i]] = address(0x1); // SENTINEL_OWNERS
            } else {
                safeConfig.prevOwner[owners[i]] = owners[i - 1];
            }
        }
        
        // Update threshold
        safeConfig.threshold = threshold;
        
        // Check if sync is complete
        if (owners.length > maxSyncOwners) {
            safeConfig.isPartiallySynced = true;
            emit SyncLimitReached(owners.length, maxSyncOwners);
            emit OwnersSynced(ownersToSync, false);
            return false;
        }
        
        safeConfig.isPartiallySynced = false;
        emit OwnersSynced(ownersToSync, true);
        return true;
    }

    /**
     * @dev Clear owner data for fresh sync
     */
    function _clearOwnerData() internal {
        address[] storage owners = safeConfig.safeOwners;
        for (uint256 i = 0; i < owners.length; i++) {
            safeConfig.isSafeOwner[owners[i]] = false;
            delete safeConfig.prevOwner[owners[i]];
        }
        delete safeConfig.safeOwners;
    }

    /**
     * @dev Internal function to sync and check if required
     */
    function _syncAndCheckIfRequired() internal {
        if (autoSyncEnabled) {
            _syncOwnersFromSafe();
        }
        
        if (requireFullSyncForOperations && safeConfig.isPartiallySynced) {
            revert OperationRequiresFullSync();
        }
    }

    /**
     * @dev Internal function to require full sync
     */
    function _requireFullSync() internal view {
        if (safeConfig.isPartiallySynced) {
            revert OperationRequiresFullSync();
        }
    }

    // ============ CONFIGURATION FUNCTIONS ============

    /**
     * @dev Set auto-sync enabled/disabled
     */
    function setAutoSync(bool enabled) external {
        _validateModuleOwner();
        autoSyncEnabled = enabled;
        emit AutoSyncStatusChanged(enabled);
    }

    /**
     * @dev Set require full sync for operations
     */
    function setRequireFullSync(bool enabled) external {
        _validateModuleOwner();
        requireFullSyncForOperations = enabled;
        emit RequireFullSyncChanged(enabled);
    }

    /**
     * @dev Set maximum number of owners to sync
     */
    function setMaxSyncOwners(uint256 newLimit) external {
        _validateModuleOwner();
        if (newLimit > MAX_ALLOWED_SYNC) revert SyncLimitTooHigh();
        if (newLimit == 0) revert SyncLimitTooLow();
        
        uint256 oldLimit = maxSyncOwners;
        maxSyncOwners = newLimit;
        
        // If we were partially synced and new limit might help, try sync again
        if (safeConfig.isPartiallySynced && autoSyncEnabled) {
            _syncOwnersFromSafe();
        }
        
        emit MaxSyncOwnersUpdated(oldLimit, newLimit);
    }



    // Funções auxiliares para gerenciar a lista de owners
    function removeFromSafeOwnersList(address, address ownerToRemove) internal {
        address[] storage owners = safeConfig.safeOwners;
        for (uint i = 0; i < owners.length; i++) {
            if (owners[i] == ownerToRemove) {
                owners[i] = owners[owners.length - 1];
                owners.pop();
                break;
            }
        }
    }

    function replaceInSafeOwnersList(address, address oldOwner, address newOwner) internal {
        address[] storage owners = safeConfig.safeOwners;
        for (uint i = 0; i < owners.length; i++) {
            if (owners[i] == oldOwner) {
                owners[i] = newOwner;
                break;
            }
        }
    }

    // ============ VIEW FUNCTIONS ============
    
    function isSafeOwner(address account) external view returns (bool) {
        if (!safeConfig.isConfigured) return false;
        return safeConfig.isSafeOwner[account];
    }

    function getSafeOwners() external view returns (address[] memory) {
        return safeConfig.safeOwners;
    }

    function getSafeThreshold() external view returns (uint256) {
        return safeConfig.threshold;
    }

    function getModuleOwner() external view returns (address) {
        return owner();
    }

    function isSafeConfigured() external view returns (bool) {
        return safeConfig.isConfigured;
    }

    /**
     * @dev Check if sync is complete
     */
    function isSyncComplete() external view returns (bool) {
        return !safeConfig.isPartiallySynced;
    }

    /**
     * @dev Get detailed sync status
     */
    function getSyncStatus() external view returns (
        uint256 syncedOwners,
        bool isComplete,
        uint256 currentLimit,
        bool autoSyncEnabled_,
        bool requireFullSync_
    ) {
        return (
            safeConfig.safeOwners.length,
            !safeConfig.isPartiallySynced,
            maxSyncOwners,
            autoSyncEnabled,
            requireFullSyncForOperations
        );
    }

    /**
     * @dev Get previous owner in linked list for a given owner
     */
    function getPrevOwner(address owner_) external view returns (address) {
        return safeConfig.prevOwner[owner_];
    }

    /**
     * @dev Get current version of the module
     * @return version Current version string
     */
    function getVersion() external pure returns (string memory version) {
        return VERSION;
    }

    /**
     * @dev Authorize contract upgrades - only module owner can upgrade
     */
    function _authorizeUpgrade(address /* newImplementation */) internal view override {
        _validateModuleOwner();
        // Additional upgrade validation can be added here if needed
    }

    /**
     * @dev Storage gap for future versions
     * This allows for new variables to be added in future upgrades without
     * affecting storage layout of existing variables
     */
    uint256[50] private __gap;
} 