// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "forge-std/Test.sol";
import "../src/ControlOwnerModule.sol";
import "../src/OwnerModuleFactory.sol";
import "./helpers/SafeTestHelper.sol";
import {ISafe} from "../src/interfaces/ISafe.sol";

contract FactoryCrossModuleTest is SafeTestHelper {
    OwnerModuleFactory moduleFactory;
    GnosisSafe safe1;
    GnosisSafe safe2;
    GnosisSafe safe3;
    
    address factoryOwner;
    address owner1;
    address owner2;
    address owner3;
    address newOwner;
    address oldOwner;
    
    uint256 factoryOwnerPK;
    uint256 owner1PK;
    uint256 owner2PK;
    uint256 owner3PK;
    uint256 newOwnerPK;
    uint256 oldOwnerPK;

    function setUp() public {
        setUpSafeHelpers();

        // Criar owners usando makeAddrAndKey para poder assinar depois
        (factoryOwner, factoryOwnerPK) = makeAddrAndKey("factoryOwner");
        (owner1, owner1PK) = makeAddrAndKey("owner1");
        (owner2, owner2PK) = makeAddrAndKey("owner2");
        (owner3, owner3PK) = makeAddrAndKey("owner3");
        (newOwner, newOwnerPK) = makeAddrAndKey("newOwner");
        (oldOwner, oldOwnerPK) = makeAddrAndKey("oldOwner");

        // Deploy factory com template
        ControlOwnerModule template = new ControlOwnerModule();
        vm.prank(factoryOwner);
        moduleFactory = new OwnerModuleFactory(template);
        
        // Criar Safes reais com owners
        address[] memory owners1 = new address[](1);
        owners1[0] = owner1;
        safe1 = createSafeWithNonce(owners1, 1, 1);
        
        address[] memory owners2 = new address[](1);
        owners2[0] = owner2;
        safe2 = createSafeWithNonce(owners2, 1, 2);
        
        address[] memory owners3 = new address[](1);
        owners3[0] = owner3;
        safe3 = createSafeWithNonce(owners3, 1, 3);
    }

    function _deployAndSetupModule(GnosisSafe safe, uint256 ownerPK) internal returns (address) {
        require(address(safe) != address(0), "Safe address cannot be 0");
        
        vm.startPrank(factoryOwner);
        address module = moduleFactory.createModuleForSafe(address(safe));
        
        // Habilitar módulo no Safe usando assinatura
        safeHelper(safe, ownerPK, address(safe), 
            abi.encodeWithSelector(ISafe.enableModule.selector, module));

        vm.stopPrank();
        
        return module;
    }

    function testDeployFactory() public {
        assertEq(moduleFactory.factoryOwner(), factoryOwner);
        assertEq(moduleFactory.getModuleCount(), 0);
    }

    function testCreateModulesForSafes() public {
        // Criar módulos para diferentes Safes
        address module1 = _deployAndSetupModule(safe1, owner1PK);
        address module2 = _deployAndSetupModule(safe2, owner2PK);
        address module3 = _deployAndSetupModule(safe3, owner3PK);
        
        // Verificar se os módulos foram criados
        assertEq(moduleFactory.getModuleCount(), 3,"getModuleCount");
        assertEq(moduleFactory.safeToModule(address(safe1)), module1,"safe1->module1"); // The module address is the safe address
        assertEq(moduleFactory.safeToModule(address(safe2)), module2,"safe2->module2"); // The module address is the safe address
        assertEq(moduleFactory.safeToModule(address(safe3)), module3,"safe3->module3"); // The module address is the safe address
        assertTrue(moduleFactory.isModule(address(module1)),"module1");
        assertTrue(moduleFactory.isModule(address(module2)),"module2");
        assertTrue(moduleFactory.isModule(address(module3)),"module3");
        
        // Verificar se os módulos estão configurados
        assertTrue(ControlOwnerModule(module1).isSafeConfigured());
        assertTrue(ControlOwnerModule(module2).isSafeConfigured());
        assertTrue(ControlOwnerModule(module3).isSafeConfigured());
    }

    function testCrossModuleAddOwner() public {
        // Criar módulos
        address module1 = _deployAndSetupModule(safe1, owner1PK);
        address module2 = _deployAndSetupModule(safe2, owner2PK);
        address module3 = _deployAndSetupModule(safe3, owner3PK);
        vm.startPrank(factoryOwner);
        moduleFactory.addSafeOwnerToAll(newOwner, 2);
        vm.stopPrank();
        
        
        // Verificar se o owner foi adicionado em todos os módulos
        assertTrue(ControlOwnerModule(module1).isSafeOwner(newOwner),"module1 isSafeOwner");
        assertTrue(ControlOwnerModule(module2).isSafeOwner(newOwner));
        assertTrue(ControlOwnerModule(module3).isSafeOwner(newOwner));
    }

    function testCrossModuleRemoveOwner() public {
        // Criar módulos
        address module1 = _deployAndSetupModule(safe1, owner1PK);
        address module2 = _deployAndSetupModule(safe2, owner2PK);
        
        // Adicionar owners primeiro
        vm.startPrank(factoryOwner);
        moduleFactory.addSafeOwnerToAll(newOwner, 2);
        moduleFactory.addSafeOwnerToAll(oldOwner, 2);
        moduleFactory.removeSafeOwnerFromAll(newOwner, oldOwner, 1);
        vm.stopPrank();
        
        // Verificar se o owner foi removido
        assertFalse(ControlOwnerModule(module1).isSafeOwner(oldOwner));
        assertFalse(ControlOwnerModule(module2).isSafeOwner(oldOwner));
    }

    function testCrossModuleReplaceOwner() public {
        // Criar módulos
        address module1 = _deployAndSetupModule(safe1, owner1PK);
        address module2 = _deployAndSetupModule(safe2, owner2PK);
        
        // Adicionar owner antigo
        vm.startPrank(factoryOwner);
        moduleFactory.addSafeOwnerToAll(oldOwner, 2);
        moduleFactory.replaceSafeOwnerInAll(address(0), oldOwner, newOwner);
        vm.stopPrank();
        
        // Verificar se o owner foi substituído
        assertFalse(ControlOwnerModule(module1).isSafeOwner(oldOwner));
        assertTrue(ControlOwnerModule(module1).isSafeOwner(newOwner));
        assertFalse(ControlOwnerModule(module2).isSafeOwner(oldOwner));
        assertTrue(ControlOwnerModule(module2).isSafeOwner(newOwner));
    }

    function testCrossModuleChangeThreshold() public {
        // Criar módulos
        address module1 = _deployAndSetupModule(safe1, owner1PK);
        address module2 = _deployAndSetupModule(safe2, owner2PK);
        
        // Adicionar alguns owners primeiro
        vm.startPrank(factoryOwner);
        moduleFactory.addSafeOwnerToAll(newOwner, 1);
        moduleFactory.addSafeOwnerToAll(oldOwner, 1);
        
        // Alterar threshold em todos os módulos
        moduleFactory.changeSafeThresholdInAll(2);
        vm.stopPrank();
        
        // Verificar se o threshold foi alterado
        assertEq(ControlOwnerModule(module1).getSafeThreshold(), 2);
        assertEq(ControlOwnerModule(module2).getSafeThreshold(), 2);
    }

    function testCrossModuleExecTransaction() public {
        // Criar módulos
        _deployAndSetupModule(safe1, owner1PK);
        _deployAndSetupModule(safe2, owner2PK);
        
        // Adicionar owner para poder executar transações
        vm.startPrank(factoryOwner);
        moduleFactory.addSafeOwnerToAll(newOwner, 1);
        
        // Executar transação em todos os módulos
        bytes memory data = abi.encodeWithSignature("enableModule(address)", address(0x123));
        
        moduleFactory.execTransactionInAll(
            address(safe1),
            0,
            data,
            Enum.Operation.Call
        );
        vm.stopPrank();
        
        // Verificar se as transações foram executadas
        // (Neste caso, apenas verificar se não reverteu)
        emit log("Cross-module transaction executed successfully");
    }


    function testCrossModuleCallFunction() public {
        // Criar módulos
        address module1 = _deployAndSetupModule(safe1, owner1PK);
        address module2 = _deployAndSetupModule(safe2, owner2PK);
        
        // Chamar função específica em todos os módulos
        bytes4 functionSelector = ControlOwnerModule.addSafeOwner.selector;
        bytes memory params = abi.encode(newOwner, uint256(2));
        
        vm.prank(factoryOwner);
        moduleFactory.callFunctionInAll(functionSelector, params);
        
        // Verificar se a função foi chamada
        assertTrue(ControlOwnerModule(module1).isSafeOwner(newOwner));
        assertTrue(ControlOwnerModule(module2).isSafeOwner(newOwner));
    }

    function testCrossModuleCallSpecificModules() public {
        // Criar módulos
        address module1 = _deployAndSetupModule(safe1, owner1PK);
        address module2 = _deployAndSetupModule(safe2, owner2PK);
        address module3 = _deployAndSetupModule(safe3, owner3PK);
        
        // Chamar função apenas nos módulos 1 e 3
        address[] memory modules = new address[](2);
        modules[0] = module1;
        modules[1] = module3;

        bytes4 functionSelector = ControlOwnerModule.addSafeOwner.selector;
        bytes memory params = abi.encode(newOwner, uint256(2));

        vm.prank(factoryOwner);
        moduleFactory.callFunctionInModules(modules, functionSelector, params);
        
        // Verificar se a função foi chamada apenas nos módulos selecionados
        assertTrue(ControlOwnerModule(module1).isSafeOwner(newOwner));
        assertFalse(ControlOwnerModule(module2).isSafeOwner(newOwner));
        assertTrue(ControlOwnerModule(module3).isSafeOwner(newOwner));
    }

    function testFallbackFunction() public {
        // Criar módulos
        address module1 = _deployAndSetupModule(safe1, owner1PK);
        address module2 = _deployAndSetupModule(safe2, owner2PK);
        
        // Usar fallback para chamar addSafeOwner
        bytes4 functionSelector = ControlOwnerModule.addSafeOwner.selector;
        bytes memory params = abi.encode(newOwner, uint256(2));
        bytes memory callData = abi.encodePacked(functionSelector, params);
        
        vm.prank(factoryOwner);
        (bool success, ) = address(moduleFactory).call(callData);
        assertTrue(success,"fallback called");

        // Verificar se a função foi chamada via fallback
        assertTrue(ControlOwnerModule(module1).isSafeOwner(newOwner));
        assertTrue(ControlOwnerModule(module2).isSafeOwner(newOwner));
    }

    function testOnlyFactoryOwnerCanCall() public {
        // Criar módulo
        _deployAndSetupModule(safe1, owner1PK);
        
        // Tentar chamar função sem ser factory owner
        // vm.prank(factoryOwner);
        try moduleFactory.addSafeOwnerToAll(newOwner, 1) {
            fail(); //Should have reverted - only factory owner can call
        } catch {
            emit log("Correctly reverted - only factory owner can call cross-module functions");
        }
    }

    function testGetAllModules() public {
        // Criar módulos
        address module1 = _deployAndSetupModule(safe1, owner1PK);
        address module2 = _deployAndSetupModule(safe2, owner2PK);
        address module3 = _deployAndSetupModule(safe3, owner3PK);
        
        // Verificar se todos os módulos são retornados
        address[] memory modules = moduleFactory.getAllModules();
        assertEq(modules.length, 3);
        assertEq(modules[0], module1);
        assertEq(modules[1], module2);
        assertEq(modules[2], module3);
        
        assertEq(moduleFactory.getModuleCount(), 3);
    }

    function testHasModule() public {
        // Verificar se Safe não tem módulo
        assertFalse(moduleFactory.hasModule(address(safe1)));
        
        // Criar módulo
        address module1 = _deployAndSetupModule(safe1, owner1PK);
        
        // Verificar se Safe tem módulo
        assertTrue(moduleFactory.hasModule(address(safe1)));
        assertEq(moduleFactory.getModuleForSafe(address(safe1)), module1);
    }

    function testAddModuleForSafe() public {
        // Safe ainda não tem módulo
        assertFalse(moduleFactory.hasModule(address(safe1)));
        // Gerar calldata para addModuleForSafe(address)
        bytes memory data = abi.encodeWithSelector(moduleFactory.addModuleForSafe.selector, address(safe1));
        // Assinar a transação com o owner
        uint256 nonce = safe1.nonce();
        bytes memory sig = signSafeTransaction(
            safe1,
            address(moduleFactory),
            0,
            data,
            Enum.Operation.Call,
            nonce,
            owner1PK
        );
        // Executar via execTransaction
        bool success = safe1.execTransaction(
            address(moduleFactory),
            0,
            data,
            Enum.Operation.Call,
            0,
            0,
            0,
            address(0),
            payable(0),
            sig
        );
        assertTrue(success, "execTransaction failed");
        assertTrue(moduleFactory.hasModule(address(safe1)));
        address module = moduleFactory.getModuleForSafe(address(safe1));
        // Chamar de novo não deve criar outro módulo, só habilitar
        nonce = safe1.nonce();
        sig = signSafeTransaction(
            safe1,
            address(moduleFactory),
            0,
            data,
            Enum.Operation.Call,
            nonce,
            owner1PK
        );
        success = safe1.execTransaction(
            address(moduleFactory),
            0,
            data,
            Enum.Operation.Call,
            0,
            0,
            0,
            address(0),
            payable(0),
            sig
        );
        assertTrue(success, "execTransaction failed (2)");
        address module2 = moduleFactory.getModuleForSafe(address(safe1));
        assertEq(module, module2);
    }

    function testAddModuleForSafeRevertsIfNotSafe() public {
        // Tentar chamar de outro endereço
        vm.expectRevert("Only the Safe can call");
        moduleFactory.addModuleForSafe(address(safe1));
    }

    function testRemoveModuleForSafe() public {
        // Criar e habilitar módulo via execTransaction
        bytes memory data = abi.encodeWithSelector(moduleFactory.addModuleForSafe.selector, address(safe1));
        uint256 nonce = safe1.nonce();
        bytes memory sig = signSafeTransaction(
            safe1,
            address(moduleFactory),
            0,
            data,
            Enum.Operation.Call,
            nonce,
            owner1PK
        );
        bool success = safe1.execTransaction(
            address(moduleFactory),
            0,
            data,
            Enum.Operation.Call,
            0,
            0,
            0,
            address(0),
            payable(0),
            sig
        );
        assertTrue(success, "execTransaction failed (addModuleForSafe)");
        address module = moduleFactory.getModuleForSafe(address(safe1));
        // Remover o módulo usando o próprio módulo como prevModule
        data = abi.encodeWithSelector(moduleFactory.removeModuleForSafe.selector, address(safe1), module);
        nonce = safe1.nonce();
        sig = signSafeTransaction(
            safe1,
            address(moduleFactory),
            0,
            data,
            Enum.Operation.Call,
            nonce,
            owner1PK
        );
        success = safe1.execTransaction(
            address(moduleFactory),
            0,
            data,
            Enum.Operation.Call,
            0,
            0,
            0,
            address(0),
            payable(0),
            sig
        );
        assertTrue(success, "execTransaction failed (removeModuleForSafe)");
        // Não reverte, mas não remove do mapping (mantém histórico)
        assertEq(moduleFactory.getModuleForSafe(address(safe1)), module);
    }

    function testRemoveModuleForSafeRevertsIfNotSafe() public {
        // Criar módulo
        vm.prank(address(safe1));
        moduleFactory.addModuleForSafe(address(safe1));
        // Tentar remover de outro endereço
        vm.expectRevert("Only the Safe can call");
        moduleFactory.removeModuleForSafe(address(safe1), address(0x1234));
    }
} 