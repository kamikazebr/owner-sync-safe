// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "@gnosis.pm/zodiac/contracts/core/Module.sol";
import "forge-std/console.sol";
import "./errors/SafeModuleErrors.sol";

contract ControlOwnerModule is Module {
    // Mapeamento para armazenar configurações por Safe
    string public constant VERSION = "0.0.1";
    
    SafeConfig public safeConfig;
    
    struct SafeConfig {
        bool isConfigured;
        uint256 threshold;
        address[] safeOwners;      // Lista de owners do Safe
        mapping(address => bool) isSafeOwner; // Verificação rápida se é owner
    }

    // Eventos para rastrear mudanças
    event SafeConfigured(address indexed safe);
    event SafeOwnerAdded(address indexed safe, address indexed newOwner);
    event SafeOwnerRemoved(address indexed safe, address indexed removedOwner);
    event SafeOwnerReplaced(address indexed safe, address indexed oldOwner, address indexed newOwner);
    event SafeThresholdChanged(address indexed safe, uint256 newThreshold);

    constructor() {
    }

    /**
     * @dev Implementação da função setUp do FactoryFriendly
     * @param initializeParams Parâmetros de inicialização (owner, safe)
     */
    function setUp(bytes memory initializeParams) public override initializer {
        // Decodificar parâmetros: owner, safe
        // (address p_owner, address p_safe) = abi.decode(initializeParams, (address, address));
        
        // Inicializar Ownable
        __Ownable_init();
        
        // Transferir ownership para o owner especificado
        // if (p_owner != address(0)) {
            // _transferOwnership(p_owner);
        // }
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
     * @dev Adiciona um novo owner ao Safe
     * @param newOwner Endereço do novo owner
     * @param threshold Novo threshold
     */
    function addSafeOwner(address newOwner, uint256 threshold) external {
        if (msg.sender != owner()) revert OnlyModuleOwner();
        
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
        address safe = avatar;
        if (!safeConfig.isConfigured) revert SafeNotConfigured();
        if (msg.sender != owner()) revert OnlyModuleOwner();
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
     * @dev Substitui um owner por outro
     * @param prevOwner Endereço do owner anterior na lista
     * @param oldOwner Endereço do owner a ser substituído
     * @param newOwner Endereço do novo owner
     */
    function replaceSafeOwner(address prevOwner, address oldOwner, address newOwner) external {
        address safe = avatar;
        if (!safeConfig.isConfigured) revert SafeNotConfigured();
        if (msg.sender != owner()) revert OnlyModuleOwner();
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
     * @dev Altera o threshold do Safe
     * @param threshold Novo threshold
     */
    function changeSafeThreshold(uint256 threshold) external {
        address safe = avatar;
        if (!safeConfig.isConfigured) revert SafeNotConfigured();
        if (msg.sender != owner()) revert OnlyModuleOwner();
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
        address safe = avatar;
        if (!safeConfig.isConfigured) revert SafeNotConfigured();
        if (!safeConfig.isSafeOwner[msg.sender]) revert OnlySafeOwners();
        
        exec(to, value, data, operation);
    }



    // Funções auxiliares para gerenciar a lista de owners
    function removeFromSafeOwnersList(address safe, address ownerToRemove) internal {
        address[] storage owners = safeConfig.safeOwners;
        for (uint i = 0; i < owners.length; i++) {
            if (owners[i] == ownerToRemove) {
                owners[i] = owners[owners.length - 1];
                owners.pop();
                break;
            }
        }
    }

    function replaceInSafeOwnersList(address safe, address oldOwner, address newOwner) internal {
        address[] storage owners = safeConfig.safeOwners;
        for (uint i = 0; i < owners.length; i++) {
            if (owners[i] == oldOwner) {
                owners[i] = newOwner;
                break;
            }
        }
    }

    // Funções de consulta
    function isModuleOwner(address account) external view returns (bool) {
        return owner() == account;
    }

    function isSafeOwner(address account) external view returns (bool) {
        address safe = avatar;
        if (!safeConfig.isConfigured) return false;
        return safeConfig.isSafeOwner[account];
    }

    function getSafeOwners() external view returns (address[] memory) {
        address safe = avatar;
        return safeConfig.safeOwners;
    }

    function getSafeOwnerCount() external view returns (uint256) {
        address safe = avatar;
        return safeConfig.safeOwners.length;
    }

    function getSafeThreshold() external view returns (uint256) {
        address safe = avatar;
        return safeConfig.threshold;
    }

    function getModuleOwner() external view returns (address) {
        return owner();
    }

    function isSafeConfigured() external view returns (bool) {
        address safe = target;
        console.log("safe", safe);
        return safeConfig.isConfigured;
    }
} 