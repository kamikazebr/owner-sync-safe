// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "forge-std/Test.sol";
import "../src/ManagedSafeModule.sol";
import "./helpers/SafeTestHelper.sol";
import {ISafe} from "../src/interfaces/ISafe.sol";

contract ManagedSafeModuleTest is SafeTestHelper {
    Safe safe;
    ManagedSafeModule module;
    
    address owner0;
    address owner1;
    address owner2;
    address owner3;
    address ownerOfModuleOwner;
    uint256 owner0PK;
    uint256 owner1PK;
    uint256 owner2PK;
    uint256 owner3PK;
    

    function setUp() public {
        setUpSafeHelpers();

        // Usar makeAddr para labels bonitos nos testes
        (owner0, owner0PK) = makeAddrAndKey("owner0");
        (owner1, owner1PK) = makeAddrAndKey("owner1");
        (owner2, owner2PK) = makeAddrAndKey("owner2");
        (owner3, owner3PK) = makeAddrAndKey("owner3");
        ownerOfModuleOwner = address(this);
    
        // Criar Safe com o module owner como owner
        address[] memory owners = new address[](1);
        owners[0] = owner0;
        safe = createSafeWithNonce(owners, 1, 1);
        
        module = new ManagedSafeModule();
        module.setUp("");
        module.setAvatar(address(safe));
        module.setTarget(address(safe));
        // Configurar o módulo para o Safe
        module.configureForSafe();
        
        // Habilitar o módulo no Safe usando helper function como no SafeSetup.sol
        safeHelper(safe, owner0PK, address(safe), 
            abi.encodeWithSelector(ISafe.enableModule.selector, address(module))); // enableModule selector
    }

    function testSetup() public {
        // Verificar se o módulo foi configurado corretamente
        assertTrue(module.isSafeConfigured());
        assertEq(module.getModuleOwner(), ownerOfModuleOwner);
    }

    function testAddOwner() public {
        // Adicionar um novo owner usando o módulo
        vm.prank(ownerOfModuleOwner);
        module.addSafeOwner(owner1, 1);
        
        // Verificar se foi adicionado
        assertTrue(module.isSafeOwner(owner1));
        emit log("Owner added successfully");
    }

    function testRemoveOwner() public {
        // Primeiro adicionar owners
        vm.prank(ownerOfModuleOwner);
        module.addSafeOwner(owner1, 2);
        vm.prank(ownerOfModuleOwner);
        module.addSafeOwner(owner2, 2);
        
        // Remover um owner (prevOwner seria o primeiro owner)
        vm.prank(ownerOfModuleOwner);
        module.removeSafeOwner(owner1, owner2, 1);
        
        // Verificar se foi removido
        assertFalse(module.isSafeOwner(owner2));
        emit log("Owner removed successfully");
    }

    function testReplaceOwner() public {
        // Adicionar owners
        vm.prank(ownerOfModuleOwner);
        module.addSafeOwner(owner1, 2);
        vm.prank(ownerOfModuleOwner);
        module.addSafeOwner(owner2, 2);
        
        // Substituir owner2 por owner3
        vm.prank(ownerOfModuleOwner);
        module.replaceSafeOwner(owner1, owner2, owner3);
        
        // Verificar se foi substituído
        assertFalse(module.isSafeOwner(owner2));
        assertTrue(module.isSafeOwner(owner3));
        emit log("Owner replaced successfully");
    }

    function testChangeThreshold() public {
        // Adicionar owners primeiro
        vm.prank(ownerOfModuleOwner);
        module.addSafeOwner(owner1, 1);
        vm.prank(ownerOfModuleOwner);
        module.addSafeOwner(owner2, 1);
        
        // Alterar threshold
        vm.prank(ownerOfModuleOwner);
        module.changeSafeThreshold(2);
        
        // Verificar se foi alterado
        assertEq(module.getSafeThreshold(), 2);
        emit log("Threshold changed successfully");
    }

    function testInvalidOwnerAddress() public {
        // Tentar adicionar endereço inválido
        vm.prank(ownerOfModuleOwner);
        try module.addSafeOwner(address(0), 1) {
            fail();
        } catch {
            emit log("Correctly reverted for invalid address");
        }
    }

    function testOnlyOwnerCanAddManager() public {
        // Tentar adicionar owner sem ser module manager
        vm.prank(owner1);
        try module.addSafeOwner(owner2, 2) {
            fail();
        } catch {
            emit log("Correctly reverted - only module manager can add owners");
        }
    }

    function testManagerPermissions() public {
        // Verificar permissões do module manager
        assertFalse(module.isSafeOwner(ownerOfModuleOwner));
        
        // Adicionar manager como safe owner
        vm.prank(ownerOfModuleOwner);
        module.addSafeOwner(ownerOfModuleOwner, 2);
        
        // Agora manager é também safe owner
        assertTrue(module.isSafeOwner(ownerOfModuleOwner));
    }

    function testOwnerPermissions() public {
        // Adicionar owner
        vm.prank(ownerOfModuleOwner);
        module.addSafeOwner(owner1, 2);
        
        // Verificar permissões
        assertTrue(module.isSafeOwner(owner1));
    }


} 