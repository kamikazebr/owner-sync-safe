// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;


import {ManagedSafeModule} from "./ManagedSafeModule.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ISafe} from "./interfaces/ISafe.sol";
import {Enum} from "zodiac/core/Module.sol";
import {InvalidSafeAddress, ModuleAlreadyExists, OnlyManagerOwner, InvalidOwnerAddress, InvalidNewOwnerAddress, SameOwnerAddress, ThresholdTooLow, NoModuleForSafe, InvalidModuleAddress, NoModuleFound, AlreadyHasModuleForSafe} from "./errors/SafeModuleErrors.sol";

contract SafeModuleManager is Ownable2Step {
    
    // Version for migration tracking
    string public constant VERSION = "1.1.0";
    
    // Module template (implementation)
    ManagedSafeModule public immutable moduleTemplate;
    
    // Mapping from Safe to its module
    mapping(address => address) public safeToModule;
    
    // List of all created modules
    address[] public allModules;
    
    // Mapping to check if an address is a valid module
    mapping(address => bool) public isModule;
    
    // Chain ID tracking for cross-chain support
    mapping(address => uint256) public safeToChainId;
    mapping(address => bool) public isModuleActive;
    
    // Network status tracking
    struct NetworkInfo {
        uint256 totalSafes;
        uint256 activeModules;
        uint256 chainId;
        uint256 lastUpdate;
    }
    
    
    // Internal function to validate manager owner access (more gas efficient than modifier)
    function _validateManagerOwner() internal view {
        if (msg.sender != owner()) revert OnlyManagerOwner();
    }
    
    // Events
    event ModuleCreated(address indexed safe, address indexed module);
    event SafeRemovedFromNetwork(address indexed safe);
    event CrossModuleCall(address indexed caller, address[] modules, string functionName);
    event BatchOperationExecuted(address indexed caller, uint256 operationCount, uint256 successCount);
    event SafeValidated(address indexed safe, uint256 chainId, bool isValid);
    event NetworkStatusUpdated(uint256 totalSafes, uint256 activeModules, uint256 chainId);
    event ModuleHealthChecked(address indexed module, bool isActive);
    event SafeOperationError(address indexed safe, string operation, bytes errorData);
    event CrossModuleOperationSuccess(address indexed module, string operation);
    event CrossModuleOperationFailed(address indexed module, string operation, bytes errorData);
    event SafeToModuleSet(address indexed safe, address indexed module);
    event ModuleDisabledOnSafe(address indexed safe, address indexed module);

    constructor(ManagedSafeModule _moduleTemplate) {
        moduleTemplate = _moduleTemplate;
    }
    
    /**
     * @dev Execute operation on a single module with proper error handling
     * @param module Address of the module to call
     * @param callData Encoded function call data
     * @param operationName Name of the operation for event logging
     * @return success True if the operation succeeded
     */
    function _executeOnModule(
        address module,
        bytes memory callData,
        string memory operationName
    ) internal returns (bool success) {
        (bool callSuccess, bytes memory returnData) = module.call(callData);
        success = callSuccess;
        
        if (success) {
            emit CrossModuleOperationSuccess(module, operationName);
        } else {
            emit CrossModuleOperationFailed(module, operationName, returnData);
        }
    }
    
    /**
     * @dev Execute operation on all modules with batch tracking
     * @param callData Encoded function call data
     * @param operationName Name of the operation for event logging
     * @return successCount Number of successful operations
     */
    function _executeOnAllModules(
        bytes memory callData,
        string memory operationName
    ) internal returns (uint256 successCount) {
        for (uint i = 0; i < allModules.length; i++) {
            if (_executeOnModule(allModules[i], callData, operationName)) {
                successCount++;
            }
        }
        emit BatchOperationExecuted(msg.sender, allModules.length, successCount);
    }
    
    
    /**
     * @dev Internal function to create a new module for a specific Safe using proxy
     * @param safe Safe address
     * @return module Address of the created module
     */
    function _createModuleForSafe(address safe) internal returns (address module) {
        if (safe == address(0)) revert InvalidSafeAddress();
        if (safeToModule[safe] != address(0)) revert ModuleAlreadyExists();
        // Initialization parameters for the module
        bytes memory initParams = "";
        // Create proxy pointing to template
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(moduleTemplate),
            abi.encodeWithSelector(
                ManagedSafeModule.setUp.selector,
                initParams
            )
        );
        module = address(proxy);
        ManagedSafeModule moduleInstance = ManagedSafeModule(payable(module));
        moduleInstance.setAvatar(safe);
        moduleInstance.setTarget(safe);
        moduleInstance.configureForSafe();
        
        // Transfer ownership of the module to the factory
        moduleInstance.transferOwnership(address(this));
        safeToModule[safe] = module;
        allModules.push(module);
        isModule[module] = true;
        emit ModuleCreated(safe, module);
    }

    /**
     * @dev Create a new module for a specific Safe using proxy
     * @param _safe Safe address
     */
    function createModuleForSafe(address _safe) external returns (address module) {
        module = _createModuleForSafe(_safe);
    }

    /**
     * @dev Create or enable the module for the calling Safe
     * Can only be called by the Safe itself
     */
    function addModuleForSafe() external returns (address module) {
        address _safe = msg.sender;
        module = safeToModule[_safe];
        if (module == address(0)) {
            module = _createModuleForSafe(_safe);
        }
        
        // Mark module as active
        isModuleActive[module] = true;
        
        // Safe must enable the module itself - factory doesn't act as module
        // The Safe should call ISafe(safe).enableModule(module) directly
    }

    /**
     * @dev Set Safe-to-Module mapping manually
     * Can only be called by the manager owner
     * @param safe Safe address
     * @param module Module address to associate with the Safe
     */
    function setSafeToModule(address safe, address module) external {
        _validateManagerOwner();
        if (safe == address(0)) revert InvalidSafeAddress();
        if (module == address(0)) revert InvalidModuleAddress();
        if (!isModule[module]) revert InvalidModuleAddress();
        
        safeToModule[safe] = module;
        isModuleActive[module] = true;
        emit SafeToModuleSet(safe, module);
    }



    /**
     * @dev Validates if an address is a valid Safe contract
     * @param safe Address to validate
     * @return isValid True if valid Safe contract
     */
    function isValidSafe(address safe) public returns (bool isValid) {
        if (safe == address(0)) return false;
        
        // Check if contract has required Safe functions
        try ISafe(safe).getOwners() returns (address[] memory) {
            try ISafe(safe).nonce() returns (uint256) {
                try ISafe(safe).enableModule(address(0)) {
                    // This will revert but we catch it
                } catch {
                    // Expected to revert, means it's a Safe
                    isValid = true;
                }
            } catch {
                isValid = false;
            }
        } catch {
            isValid = false;
        }
        
        emit SafeValidated(safe, block.chainid, isValid);
    }

    /**
     * @dev Remove (disable) the module from the specified Safe
     * Can only be called by the Safe itself
     */
    function removeModuleForSafe() external {
     
        address _safe = msg.sender;
        address module = safeToModule[_safe];
        if (module == address(0)) revert NoModuleForSafe();
        
        // Mark module as inactive
        isModuleActive[module] = false;

        // Clear the mapping for consistency with hasModule()
        safeToModule[_safe] = address(0);
        emit SafeToModuleSet(_safe, address(0));
        
        // Safe must disable the module itself
        _disableModuleOnSafe(_safe, module);

        emit ModuleDisabledOnSafe(_safe, module);
    }
        
    /**
     * @dev Add owner to all modules
     * @param newOwner Address of the new owner
     * @param threshold New threshold
     */
    function addSafeOwnerToAll(address newOwner, uint256 threshold) external {
        _validateManagerOwner();
        if (newOwner == address(0)) revert InvalidOwnerAddress();
        
        bytes memory callData = abi.encodeWithSelector(
            ManagedSafeModule.addSafeOwner.selector,
            newOwner,
            threshold
        );
        
        _executeOnAllModules(callData, "addSafeOwner");
        emit CrossModuleCall(msg.sender, allModules, "addSafeOwner");
    }
    
    /**
     * @dev Remove owner from all modules
     * @param prevOwner Address of the previous owner in the list
     * @param ownerToRemove Address of the owner to be removed
     * @param threshold New threshold
     */
    function removeSafeOwnerFromAll(address prevOwner, address ownerToRemove, uint256 threshold) external {
        _validateManagerOwner();
        if (ownerToRemove == address(0)) revert InvalidOwnerAddress();
        
        bytes memory callData = abi.encodeWithSelector(
            ManagedSafeModule.removeSafeOwner.selector,
            prevOwner,
            ownerToRemove,
            threshold
        );
        
        _executeOnAllModules(callData, "removeSafeOwner");
        emit CrossModuleCall(msg.sender, allModules, "removeSafeOwner");
    }
    
    /**
     * @dev Replace owner in all modules
     * @param prevOwner Address of the previous owner in the list
     * @param oldOwner Address of the owner to be replaced
     * @param newOwner Address of the new owner
     */
    function replaceSafeOwnerInAll(address prevOwner, address oldOwner, address newOwner) external {
        _validateManagerOwner();
        if (newOwner == address(0)) revert InvalidNewOwnerAddress();
        if (oldOwner == newOwner) revert SameOwnerAddress();
        
        bytes memory callData = abi.encodeWithSelector(
            ManagedSafeModule.replaceSafeOwner.selector,
            prevOwner,
            oldOwner,
            newOwner
        );
        
        _executeOnAllModules(callData, "replaceSafeOwner");
        emit CrossModuleCall(msg.sender, allModules, "replaceSafeOwner");
    }
    
    /**
     * @dev Change threshold in all modules
     * @param threshold New threshold
     */
    function changeSafeThresholdInAll(uint256 threshold) external {
        _validateManagerOwner();
        if (threshold == 0) revert ThresholdTooLow();
        
        bytes memory callData = abi.encodeWithSelector(
            ManagedSafeModule.changeSafeThreshold.selector,
            threshold
        );
        
        _executeOnAllModules(callData, "changeSafeThreshold");
        emit CrossModuleCall(msg.sender, allModules, "changeSafeThreshold");
    }
    
    /**
     * @dev Execute transaction in all modules
     * @param to Destination address
     * @param value Value in ETH
     * @param data Transaction data
     * @param operation Operation type
     */
    function execTransactionInAll(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    ) external {
        _validateManagerOwner();
        bytes memory callData = abi.encodeWithSelector(
            ManagedSafeModule.execTransaction.selector,
            to,
            value,
            data,
            operation
        );
        
        _executeOnAllModules(callData, "execTransaction");
        emit CrossModuleCall(msg.sender, allModules, "execTransaction");
    }
    

    
    /**
     * @dev Call a specific function in all modules
     * @param functionSelector Function selector (4 bytes)
     * @param params Function parameters
     */
    function callFunctionInAll(bytes4 functionSelector, bytes calldata params) external {
        _validateManagerOwner();
        bytes memory callData = abi.encodePacked(functionSelector, params);
        _callAllModules(callData);
        
        emit CrossModuleCall(msg.sender, allModules, string(abi.encodePacked(functionSelector)));
    }
    
    /**
     * @dev Call function in specific modules
     * @param modules List of modules
     * @param functionSelector Function selector
     * @param params Function parameters
     */
    function callFunctionInModules(
        address[] calldata modules,
        bytes4 functionSelector,
        bytes calldata params
    ) external {
        _validateManagerOwner();
        bytes memory callData = abi.encodePacked(functionSelector, params);
        
        for (uint i = 0; i < modules.length; i++) {
            if (!isModule[modules[i]]) revert InvalidModuleAddress();
            (bool _success, ) = address(modules[i]).call(callData);
            // Ignore failures silently
        }
        
        emit CrossModuleCall(msg.sender, modules, string(abi.encodePacked(functionSelector)));
    }
    
    
    /**
     * @dev Internal function to call all modules
     * @param data Function data
     */
    function _callAllModules(bytes memory data) internal {
        for (uint i = 0; i < allModules.length; i++) {
            (bool _success, ) = address(allModules[i]).call(data);
            // Ignore failures silently - module may not have the function or have different permissions
        }
    }
    
    // Query functions
    
    /**
     * @dev Return all created modules
     */
    function getAllModules() external view returns (address[] memory) {
        return allModules;
    }
    
    /**
     * @dev Return the total number of modules
     */
    function getModuleCount() external view returns (uint256) {
        return allModules.length;
    }
    
    /**
     * @dev Check if a Safe has a module
     */
    function hasModule(address safe) external view returns (bool) {
        return safeToModule[safe] != address(0);
    }
    
    /**
     * @dev Return the module of a Safe
     */
    function getModuleForSafe(address safe) external view returns (address) {
        return safeToModule[safe];
    }
    
    /**
     * @dev Return all Safes that have modules
     */
    function getAllSafes() external view returns (address[] memory) {
        address[] memory safes = new address[](allModules.length);
        uint256 count = 0;
        
        // Since we don't have reverse mapping, we need to iterate
        // In a more efficient implementation, we would maintain a list of Safes
        for (uint i = 0; i < allModules.length; i++) {
            // Here we would need a way to map module -> Safe
            // For simplicity, we return only the modules
            safes[count] = allModules[i];
            count++;
        }
        
        return safes;
    }

    // ============ NETWORK MANAGEMENT SYSTEM ============

    /**
     * @dev Internal function to disable a module on a Safe
     * @param safe Address of the Safe
     * @param module Address of the module to disable
     */
    function _disableModuleOnSafe(address safe, address module) internal {
        try ISafe(safe).disableModule(address(0x1), module) {
            // Success - module disabled
            emit ModuleDisabledOnSafe(safe, module);
        } catch (bytes memory errorData) {
            // Log the error but continue with cleanup
            emit SafeOperationError(safe, "disableModule", errorData);
        }
    }

    /**
     * @dev Remove a Safe from the network completely
     * @param safe Address of the Safe to remove
     */
    function removeSafeFromNetwork(address safe) external {
        _validateManagerOwner();
        if (safe == address(0)) revert InvalidSafeAddress();
        
        address module = safeToModule[safe];
        if (module == address(0)) revert NoModuleFound();
        
        // Disable module on Safe
        _disableModuleOnSafe(safe, module);
        
        // Remove from mappings
        delete safeToModule[safe];
        delete safeToChainId[safe];
        delete isModuleActive[module];
        
        // Remove from allModules array
        for (uint i = 0; i < allModules.length; i++) {
            if (allModules[i] == module) {
                allModules[i] = allModules[allModules.length - 1];
                allModules.pop();
                break;
            }
        }
        
        // Remove from isModule mapping
        delete isModule[module];
        
        emit SafeRemovedFromNetwork(safe);
    }

    /**
     * @dev Get network status with chain context
     * @return info Network information struct
     */
    function getNetworkStatus() external returns (NetworkInfo memory info) {
        uint256 activeCount = 0;
        
        // Count active modules
        for (uint i = 0; i < allModules.length; i++) {
            if (isModuleActive[allModules[i]]) {
                activeCount++;
            }
        }
        
        info = NetworkInfo({
            totalSafes: allModules.length,
            activeModules: activeCount,
            chainId: block.chainid,
            lastUpdate: block.timestamp
        });
        
        emit NetworkStatusUpdated(info.totalSafes, info.activeModules, info.chainId);
    }

    /**
     * @dev Check if a module is active and healthy
     * @param safe Address of the Safe
     * @return isActive True if module is active and healthy
     */
    function isModuleActiveForSafe(address safe) external returns (bool isActive) {
        address module = safeToModule[safe];
        if (module == address(0)) return false;
        
        // Check if module is marked as active
        isActive = isModuleActive[module];
        
        // Additional health checks
        if (isActive) {
            try ManagedSafeModule(module).isSafeConfigured() returns (bool configured) {
                isActive = configured;
            } catch {
                isActive = false;
            }
        }
        
        emit ModuleHealthChecked(module, isActive);
    }


    /**
     * @dev Update module health status
     * @param module Address of the module to check
     */
    function updateModuleHealth(address module) external {
        if (!isModule[module]) revert InvalidModuleAddress();
        
        bool isHealthy = false;
        try ManagedSafeModule(module).isSafeConfigured() returns (bool configured) {
            isHealthy = configured;
        } catch {
            isHealthy = false;
        }
        
        isModuleActive[module] = isHealthy;
        emit ModuleHealthChecked(module, isHealthy);
    }

    /**
     * @dev Get chain ID for a specific Safe
     * @param safe Address of the Safe
     * @return chainId Chain ID where Safe is deployed
     */
    function getSafeChainId(address safe) external view returns (uint256 chainId) {
        chainId = safeToChainId[safe];
        if (chainId == 0) {
            chainId = block.chainid; // Default to current chain
        }
    }


    // ============ VERSION MANAGEMENT ============

    /**
     * @dev Get current version of the factory
     * @return version Current version string
     */
    function getVersion() external pure returns (string memory version) {
        return VERSION;
    }

  } 