// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "forge-std/Script.sol";
import "../src/ControlOwnerModule.sol";
import "../src/OwnerModuleFactory.sol";

contract DeployFactoryMultiChain is Script {
    function run(string memory network) external {
        console.log("Deploying Factory on network:", network);
        
        vm.startBroadcast();

        // 1. Deploy do template do módulo
        console.log("Deploying ControlOwnerModule template...");
        ControlOwnerModule template = new ControlOwnerModule();
        console.log("Template deployed at:", address(template));

        // 2. Deploy da factory
        console.log("Deploying OwnerModuleFactory...");
        OwnerModuleFactory factory = new OwnerModuleFactory(template);
        console.log("Factory deployed at:", address(factory));
        console.log("Factory owner:", factory.factoryOwner());
        console.log("Module template:", address(factory.moduleTemplate()));
        console.log("Factory version:", factory.getVersion());

        vm.stopBroadcast();
        
        console.log("\n=== DEPLOY SUMMARY FOR", network, "===");
        console.log("Network:", network);
        console.log("Factory:", address(factory));
        console.log("Factory Owner:", factory.factoryOwner());
        console.log("Module Template:", address(factory.moduleTemplate()));
        console.log("=====================================");
        
        // Salvar endereços para uso posterior
        string memory deploymentData = string(abi.encodePacked(
            "Network: ", network, "\n",
            "Factory: ", vm.toString(address(factory)), "\n",
            "Template: ", vm.toString(address(template)), "\n",
            "Factory Owner: ", vm.toString(factory.factoryOwner()), "\n",
            "Version: ", factory.getVersion(), "\n"
        ));
        console.log(deploymentData);

        // Escrever em arquivo para referência
        // vm.writeFile(string(abi.encodePacked("deployments/", network, ".txt")), deploymentData);
    }
} 