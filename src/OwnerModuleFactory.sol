// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;


import "./ControlOwnerModule.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./interfaces/ISafe.sol";
import "@gnosis.pm/zodiac/contracts/core/Module.sol";
import "./errors/SafeModuleErrors.sol";

contract OwnerModuleFactory is Module {
    
    // Version for migration tracking
    string public constant VERSION = "1.1.0";
    
    // Template do módulo (implementação)
    ControlOwnerModule public immutable moduleTemplate;
    
    // Mapeamento de Safe para seu módulo
    mapping(address => address) public safeToModule;
    
    // Lista de todos os módulos criados
    address[] public allModules;
    
    // Mapeamento para verificar se um endereço é um módulo válido
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
    
    // Owner da factory (pode ser um Safe)
    address public immutable factoryOwner;
    
    
    // Eventos
    event ModuleCreated(address indexed safe, address indexed module);
    event SafeRemovedFromNetwork(address indexed safe);
    event CrossModuleCall(address indexed caller, address[] modules, string functionName);
    event FallbackCalled(address indexed caller, address[] modules, bytes data);
    event BatchOperationExecuted(address indexed caller, uint256 operationCount, uint256 successCount);
    event SafeValidated(address indexed safe, uint256 chainId, bool isValid);
    event NetworkStatusUpdated(uint256 totalSafes, uint256 activeModules, uint256 chainId);
    event ModuleHealthChecked(address indexed module, bool isActive);
    event SafeOperationError(address indexed safe, string operation, bytes errorData);
    
    constructor(ControlOwnerModule _moduleTemplate) {
        factoryOwner = msg.sender;
        
        moduleTemplate = _moduleTemplate;
    }
    
    /**
     * @dev Implementação da função setUp requerida pelo FactoryFriendly
     * @param initializeParams Parâmetros de inicialização (não usados neste caso)
     */
    function setUp(bytes memory initializeParams) public override {
        // Esta função é chamada quando o módulo é inicializado via factory
        // Por enquanto, não fazemos nada específico
    }
    
    /**
     * @dev Função interna para criar um novo módulo para um Safe específico usando proxy
     * @param safe Endereço do Safe
     * @return module Endereço do módulo criado
     */
    function _createModuleForSafe(address safe) internal returns (address module) {
        if (safe == address(0)) revert InvalidSafeAddress();
        if (safeToModule[safe] != address(0)) revert ModuleAlreadyExists();
        // Parâmetros de inicialização para o módulo
        bytes memory initParams = "";
        // Criar proxy que aponta para o template
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(moduleTemplate),
            abi.encodeWithSelector(
                ControlOwnerModule.setUp.selector,
                initParams
            )
        );
        module = address(proxy);
        ControlOwnerModule moduleInstance = ControlOwnerModule(payable(module));
        moduleInstance.setAvatar(safe);
        moduleInstance.setTarget(safe);
        moduleInstance.configureForSafe();
        safeToModule[safe] = module;
        allModules.push(module);
        isModule[module] = true;
        emit ModuleCreated(safe, module);
    }

    /**
     * @dev Cria um novo módulo para um Safe específico usando proxy
     * @param _safe Endereço do Safe
     */
    function createModuleForSafe(address _safe) external returns (address module) {
        module = _createModuleForSafe(_safe);
    }

    /**
     * @dev Cria ou habilita o módulo para o Safe chamador
     * Só pode ser chamada pelo próprio Safe
     */
    function addModuleForSafe() external returns (address module) {
        address _safe = msg.sender;
        module = safeToModule[_safe];
        if (module == address(0)) {
            module = _createModuleForSafe(_safe);
        }
        
        // Mark module as active
        isModuleActive[module] = true;
        
        // Set factory's target and avatar to the Safe so exec() works
        if (target != _safe) {
            avatar = _safe;
            target = _safe;
        }
        
        // Usar exec() para chamar enableModule no Safe (quando factory é módulo)
        bytes memory data = abi.encodeWithSelector(ISafe.enableModule.selector, module);
        exec(_safe, 0, data, Enum.Operation.Call);
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
     * @dev Remove (desabilita) o módulo do Safe informado
     * Só pode ser chamada pelo próprio Safe
     */
    function removeModuleForSafe() external {
        address prevModule = address(0x1);
        address _safe = msg.sender;
        address module = safeToModule[_safe];
        if (module == address(0)) revert NoModuleForSafe();
        // Usar exec() para chamar disableModule no Safe (quando factory é módulo)
        bytes memory data = abi.encodeWithSelector(ISafe.disableModule.selector, prevModule, module);
        exec(_safe, 0, data, Enum.Operation.Call);
    }
    
    /**
     * @dev Fallback function para chamar funções em todos os módulos
     * @param data Dados da função a ser chamada
     */
    fallback(bytes calldata data) external returns (bytes memory) {
        if (msg.sender != factoryOwner) revert OnlyFactoryOwner();
        
        // Chamar a função em todos os módulos
        _callAllModules(data);
        
        emit FallbackCalled(msg.sender, allModules, data);
        
        return "";
    }
    
    /**
     * @dev Receive function
     */
    receive() external payable {
        // Factory pode receber ETH
    }
    
    /**
     * @dev Adiciona owner em todos os módulos
     * @param newOwner Endereço do novo owner
     * @param threshold Novo threshold
     */
    function addSafeOwnerToAll(address newOwner, uint256 threshold) external {
        if (msg.sender != factoryOwner) revert OnlyFactoryOwner();
        if (newOwner == address(0)) revert InvalidOwnerAddress();
        
        for (uint i = 0; i < allModules.length; i++) {
            try ControlOwnerModule(allModules[i]).addSafeOwner(newOwner, threshold) {
                // Sucesso
            } catch {
                // Falha silenciosa - módulo pode não estar configurado ou ter permissões diferentes
            }
        }
        
        emit CrossModuleCall(msg.sender, allModules, "addSafeOwner");
    }
    
    /**
     * @dev Remove owner de todos os módulos
     * @param prevOwner Endereço do owner anterior na lista
     * @param ownerToRemove Endereço do owner a ser removido
     * @param threshold Novo threshold
     */
    function removeSafeOwnerFromAll(address prevOwner, address ownerToRemove, uint256 threshold) external {
        if (msg.sender != factoryOwner) revert OnlyFactoryOwner();
        if (ownerToRemove == address(0)) revert InvalidOwnerAddress();
        
        for (uint i = 0; i < allModules.length; i++) {
            try ControlOwnerModule(allModules[i]).removeSafeOwner(prevOwner, ownerToRemove, threshold) {
                // Sucesso
            } catch {
                // Falha silenciosa
            }
        }
        
        emit CrossModuleCall(msg.sender, allModules, "removeSafeOwner");
    }
    
    /**
     * @dev Substitui owner em todos os módulos
     * @param prevOwner Endereço do owner anterior na lista
     * @param oldOwner Endereço do owner a ser substituído
     * @param newOwner Endereço do novo owner
     */
    function replaceSafeOwnerInAll(address prevOwner, address oldOwner, address newOwner) external {
        if (msg.sender != factoryOwner) revert OnlyFactoryOwner();
        if (newOwner == address(0)) revert InvalidNewOwnerAddress();
        if (oldOwner == newOwner) revert SameOwnerAddress();
        
        for (uint i = 0; i < allModules.length; i++) {
            try ControlOwnerModule(allModules[i]).replaceSafeOwner(prevOwner, oldOwner, newOwner) {
                // Sucesso
            } catch {
                // Falha silenciosa
            }
        }
        
        emit CrossModuleCall(msg.sender, allModules, "replaceSafeOwner");
    }
    
    /**
     * @dev Altera threshold em todos os módulos
     * @param threshold Novo threshold
     */
    function changeSafeThresholdInAll(uint256 threshold) external {
        if (msg.sender != factoryOwner) revert OnlyFactoryOwner();
        if (threshold == 0) revert ThresholdTooLow();
        
        for (uint i = 0; i < allModules.length; i++) {
            try ControlOwnerModule(allModules[i]).changeSafeThreshold(threshold) {
                // Sucesso
            } catch {
                // Falha silenciosa
            }
        }
        
        emit CrossModuleCall(msg.sender, allModules, "changeSafeThreshold");
    }
    
    /**
     * @dev Executa transação em todos os módulos
     * @param to Endereço de destino
     * @param value Valor em ETH
     * @param data Dados da transação
     * @param operation Tipo de operação
     */
    function execTransactionInAll(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    ) external {
        if (msg.sender != factoryOwner) revert OnlyFactoryOwner();
        
        for (uint i = 0; i < allModules.length; i++) {
            try ControlOwnerModule(allModules[i]).execTransaction(to, value, data, operation) {
                // Sucesso
            } catch {
                // Falha silenciosa
            }
        }
        
        emit CrossModuleCall(msg.sender, allModules, "execTransaction");
    }
    

    
    /**
     * @dev Chama uma função específica em todos os módulos
     * @param functionSelector Seletor da função (4 bytes)
     * @param params Parâmetros da função
     */
    function callFunctionInAll(bytes4 functionSelector, bytes calldata params) external {
        if (msg.sender != factoryOwner) revert OnlyFactoryOwner();
        
        bytes memory callData = abi.encodePacked(functionSelector, params);
        _callAllModules(callData);
        
        emit CrossModuleCall(msg.sender, allModules, string(abi.encodePacked(functionSelector)));
    }
    
    /**
     * @dev Chama função em módulos específicos
     * @param modules Lista de módulos
     * @param functionSelector Seletor da função
     * @param params Parâmetros da função
     */
    function callFunctionInModules(
        address[] calldata modules,
        bytes4 functionSelector,
        bytes calldata params
    ) external {
        if (msg.sender != factoryOwner) revert OnlyFactoryOwner();
        
        bytes memory callData = abi.encodePacked(functionSelector, params);
        
        for (uint i = 0; i < modules.length; i++) {
            if (!isModule[modules[i]]) revert InvalidModuleAddress();
            (bool success, ) = address(modules[i]).call(callData);
            // Ignorar falhas silenciosamente
        }
        
        emit CrossModuleCall(msg.sender, modules, string(abi.encodePacked(functionSelector)));
    }
    
    /**
     * @dev Executa uma transação via módulo (quando a factory está habilitada como módulo)
     * @param to Endereço de destino
     * @param value Valor em ETH
     * @param data Dados da transação
     * @param operation Tipo de operação
     */
    function executeTransaction(
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation
    ) external returns (bool success) {
        if (msg.sender != factoryOwner) revert OnlyFactoryOwner();
        success = exec(to, value, data, operation);
    }
    
    /**
     * @dev Função interna para chamar todos os módulos
     * @param data Dados da função
     */
    function _callAllModules(bytes memory data) internal {
        for (uint i = 0; i < allModules.length; i++) {
            (bool success, ) = address(allModules[i]).call(data);
            // Ignorar falhas silenciosamente - módulo pode não ter a função ou ter permissões diferentes
        }
    }
    
    // Funções de consulta
    
    /**
     * @dev Retorna todos os módulos criados
     */
    function getAllModules() external view returns (address[] memory) {
        return allModules;
    }
    
    /**
     * @dev Retorna o número total de módulos
     */
    function getModuleCount() external view returns (uint256) {
        return allModules.length;
    }
    
    /**
     * @dev Verifica se um Safe tem módulo
     */
    function hasModule(address safe) external view returns (bool) {
        return safeToModule[safe] != address(0);
    }
    
    /**
     * @dev Retorna o módulo de um Safe
     */
    function getModuleForSafe(address safe) external view returns (address) {
        return safeToModule[safe];
    }
    
    /**
     * @dev Retorna todos os Safes que têm módulos
     */
    function getAllSafes() external view returns (address[] memory) {
        address[] memory safes = new address[](allModules.length);
        uint256 count = 0;
        
        // Como não temos mapeamento reverso, precisamos iterar
        // Em uma implementação mais eficiente, manteríamos uma lista de Safes
        for (uint i = 0; i < allModules.length; i++) {
            // Aqui precisaríamos de uma forma de mapear módulo -> Safe
            // Por simplicidade, retornamos apenas os módulos
            safes[count] = allModules[i];
            count++;
        }
        
        return safes;
    }

    // ============ NETWORK MANAGEMENT SYSTEM ============

    /**
     * @dev Remove a Safe from the network completely
     * @param safe Address of the Safe to remove
     */
    function removeSafeFromNetwork(address safe) external {
        if (msg.sender != factoryOwner) revert OnlyFactoryOwner();
        if (safe == address(0)) revert InvalidSafeAddress();
        
        address module = safeToModule[safe];
        if (module == address(0)) revert NoModuleFound();
        
        // Disable module on Safe
        try ISafe(safe).disableModule(address(0x1), module) {
            // Success - module disabled
        } catch (bytes memory errorData) {
            // Log the error but continue with cleanup
            emit SafeOperationError(safe, "disableModule", errorData);
        }
        
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
            try ControlOwnerModule(module).isSafeConfigured() returns (bool configured) {
                isActive = configured;
            } catch {
                isActive = false;
            }
        }
        
        emit ModuleHealthChecked(module, isActive);
    }

    /**
     * @dev Execute batch operations optimized for cross-chain calls
     * @param calls Array of encoded function calls
     * @return results Array of results for each call
     */
    function batchOperation(bytes[] calldata calls) external returns (bytes[] memory results) {
        if (msg.sender != factoryOwner) revert OnlyFactoryOwner();
        if (calls.length == 0) revert NoCalls();
        
        results = new bytes[](calls.length);
        uint256 successCount = 0;
        
        for (uint i = 0; i < calls.length; i++) {
            (bool success, bytes memory result) = address(this).delegatecall(calls[i]);
            results[i] = result;
            if (success) {
                successCount++;
            } else {
                // Log failed operation for debugging
                emit SafeOperationError(address(this), "batchOperation", result);
            }
        }
        
        emit BatchOperationExecuted(msg.sender, calls.length, successCount);
        
        // Optionally revert if too many operations failed
        if (successCount == 0) {
            revert BatchOperationPartialFailure(successCount, calls.length);
        }
    }

    /**
     * @dev Update module health status
     * @param module Address of the module to check
     */
    function updateModuleHealth(address module) external {
        if (!isModule[module]) revert InvalidModuleAddress();
        
        bool isHealthy = false;
        try ControlOwnerModule(module).isSafeConfigured() returns (bool configured) {
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

    /**
     * @dev Get all Safes on a specific chain
     * @param chainId Chain ID to filter by
     * @return safes Array of Safe addresses on the specified chain
     */
    function getSafesByChain(uint256 chainId) external view returns (address[] memory safes) {
        // This is a simplified implementation
        // In a full implementation, we'd maintain a mapping of chainId -> safes[]
        address[] memory allSafes = new address[](allModules.length);
        uint256 count = 0;
        
        for (uint i = 0; i < allModules.length; i++) {
            // We'd need to iterate through safeToModule to find the Safe for each module
            // This is a placeholder implementation
            if (safeToChainId[allSafes[i]] == chainId) {
                allSafes[count] = allSafes[i];
                count++;
            }
        }
        
        // Resize array to actual count
        safes = new address[](count);
        for (uint i = 0; i < count; i++) {
            safes[i] = allSafes[i];
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

    /**
     * @dev Check if factory supports a specific version
     * @param version Version to check
     * @return isSupported True if version is supported
     */
    function isVersionSupported(string memory version) external pure returns (bool isSupported) {
        // Simple version check - in production, you might want more sophisticated versioning
        bytes32 currentVersionHash = keccak256(abi.encodePacked(VERSION));
        bytes32 checkVersionHash = keccak256(abi.encodePacked(version));
        return currentVersionHash == checkVersionHash;
    }

    /**
     * @dev Get migration information for upgrading
     * @return currentVersion Current version
     * @return migrationAvailable Whether migration is available
     * @return migrationTarget Target version for migration
     */
    function getMigrationInfo() external pure returns (
        string memory currentVersion,
        bool migrationAvailable,
        string memory migrationTarget
    ) {
        currentVersion = VERSION;
        migrationAvailable = false; // No migration available for now
        migrationTarget = ""; // No target version
    }

    /**
     * @dev Prepare for future cross-chain integration
     * @return chainId Current chain ID
     * @return isCrossChainReady Whether factory is ready for cross-chain
     * @return supportedChains Array of supported chain IDs
     */
    function getCrossChainInfo() external view returns (
        uint256 chainId,
        bool isCrossChainReady,
        uint256[] memory supportedChains
    ) {
        chainId = block.chainid;
        isCrossChainReady = true; // Basic cross-chain support is ready
        
        // Return current chain as supported
        supportedChains = new uint256[](1);
        supportedChains[0] = block.chainid;
    }

  } 