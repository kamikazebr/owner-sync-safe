// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "forge-std/console.sol";
import "./ControlOwnerModule.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./interfaces/ISafe.sol";

contract OwnerModuleFactory {
    
    // Template do módulo (implementação)
    ControlOwnerModule public immutable moduleTemplate;
    
    // Mapeamento de Safe para seu módulo
    mapping(address => address) public safeToModule;
    
    // Lista de todos os módulos criados
    address[] public allModules;
    
    // Mapeamento para verificar se um endereço é um módulo válido
    mapping(address => bool) public isModule;
    
    // Owner da factory (pode ser um Safe)
    address public immutable factoryOwner;
    
    // Eventos
    event ModuleCreated(address indexed safe, address indexed module);
    event CrossModuleCall(address indexed caller, address[] modules, string functionName);
    event FallbackCalled(address indexed caller, address[] modules, bytes data);
    
    constructor(ControlOwnerModule _moduleTemplate) {
        factoryOwner = msg.sender;
        
        moduleTemplate = _moduleTemplate;
    }
    
    /**
     * @dev Função interna para criar um novo módulo para um Safe específico usando proxy
     * @param safe Endereço do Safe
     * @return module Endereço do módulo criado
     */
    function _createModuleForSafe(address safe) internal returns (address module) {
        require(safe != address(0), "Invalid Safe address");
        require(safeToModule[safe] == address(0), "Module already exists for this Safe");
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
    function addModuleForSafe(address _safe) external returns (address module) {
        require(msg.sender == _safe, "Only the Safe can call");
        require(_safe != address(0), "Invalid Safe address");
        module = safeToModule[_safe];
        if (module == address(0)) {
            module = _createModuleForSafe(_safe);
        }
        // Sempre chama enableModule
        ISafe(_safe).enableModule(module);
    }
      /**
     * @dev Remove (desabilita) o módulo do Safe informado
     * Só pode ser chamada pelo próprio Safe
     * @param _safe Endereço do Safe
     * @param prevModule Endereço do módulo anterior na lista de módulos do Safe
     */
    function removeModuleForSafe(address _safe, address prevModule) external {
        require(msg.sender == _safe, "Only the Safe can call");
        address module = safeToModule[_safe];
        require(module != address(0), "No module for this Safe");
        ISafe(_safe).disableModule(prevModule, module);
        // Opcional: não removemos do mapping para manter histórico, mas pode ser ajustado
    }
    
    /**
     * @dev Fallback function para chamar funções em todos os módulos
     * @param data Dados da função a ser chamada
     */
    fallback(bytes calldata data) external returns (bytes memory) {
        require(msg.sender == factoryOwner, "Only factory owner can call fallback");
        
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
        require(msg.sender == factoryOwner, "Only factory owner can call");
        require(newOwner != address(0), "Invalid owner address");
        
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
        require(msg.sender == factoryOwner, "Only factory owner can call");
        require(ownerToRemove != address(0), "Invalid owner address");
        
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
        require(msg.sender == factoryOwner, "Only factory owner can call");
        require(newOwner != address(0), "Invalid new owner address");
        require(oldOwner != newOwner, "Same owner address");
        
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
        require(msg.sender == factoryOwner, "Only factory owner can call");
        require(threshold > 0, "Threshold must be greater than 0");
        
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
        require(msg.sender == factoryOwner, "Only factory owner can call");
        
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
        require(msg.sender == factoryOwner, "Only factory owner can call");
        
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
        require(msg.sender == factoryOwner, "Only factory owner can call");
        
        bytes memory callData = abi.encodePacked(functionSelector, params);
        
        for (uint i = 0; i < modules.length; i++) {
            require(isModule[modules[i]], "Invalid module address");
            (bool success, ) = address(modules[i]).call(callData);
            // Ignorar falhas silenciosamente
        }
        
        emit CrossModuleCall(msg.sender, modules, string(abi.encodePacked(functionSelector)));
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

  } 