# Factory Cross-Module Calls

## 🎯 **Visão Geral**

O `OwnerModuleFactory` permite executar funções de owner em **múltiplos módulos simultaneamente**, facilitando o gerenciamento de vários Safes de forma centralizada.

## 🏗️ **Arquitetura**

```
Factory Owner (Safe/EOA)
    ↓
OwnerModuleFactory
    ↓
┌─────────────┬─────────────┬─────────────┐
│   Module 1  │   Module 2  │   Module 3  │
│   (Safe 1)  │   (Safe 2)  │   (Safe 3)  │
└─────────────┴─────────────┴─────────────┘
```

## 🚀 **Funcionalidades Cross-Module**

### **1. Fallback Function**
```solidity
// Chama qualquer função em todos os módulos
factory.call(abi.encodeWithSignature("addSafeOwner(address,uint256)", newOwner, 2));
```

### **2. Funções Específicas**
```solidity
// Adicionar owner em todos os módulos
factory.addSafeOwnerToAll(newOwner, 2);

// Remover owner de todos os módulos
factory.removeSafeOwnerFromAll(prevOwner, ownerToRemove, 1);

// Substituir owner em todos os módulos
factory.replaceSafeOwnerInAll(prevOwner, oldOwner, newOwner);

// Alterar threshold em todos os módulos
factory.changeSafeThresholdInAll(3);

// Executar transação em todos os módulos
factory.execTransactionInAll(target, 0, data, Enum.Operation.Call);

// Alterar module manager em todos os módulos
factory.changeModuleManagerInAll(newManager);
```

### **3. Funções Genéricas**
```solidity
// Chamar função específica em todos os módulos
factory.callFunctionInAll(
    ControlOwnerModule.addSafeOwner.selector,
    abi.encode(newOwner, 2)
);

// Chamar função em módulos específicos
address[] memory modules = [module1, module3];
factory.callFunctionInModules(
    modules,
    ControlOwnerModule.addSafeOwner.selector,
    abi.encode(newOwner, 2)
);
```

## 📋 **Exemplo Completo de Uso**

### **1. Deploy da Factory**
```solidity
// Deploy do template
ControlOwnerModule template = new ControlOwnerModule();

// Deploy da factory
OwnerModuleFactory factory = new OwnerModuleFactory(address(template));

console.log("Template:", address(template));
console.log("Factory:", address(factory));
console.log("Factory Owner:", factory.factoryOwner());
```

### **2. Criar Módulos para Safes**
```solidity
// Criar módulos para diferentes Safes
address treasuryModule = factory.createModuleForSafe(treasurySafe, treasuryManager);
address devModule = factory.createModuleForSafe(devSafe, devManager);
address marketingModule = factory.createModuleForSafe(marketingSafe, marketingManager);

console.log("Treasury Module:", treasuryModule);
console.log("Dev Module:", devModule);
console.log("Marketing Module:", marketingModule);
```

### **3. Adicionar Owner em Todos os Safes**
```solidity
// Adicionar novo membro da DAO em todos os Safes
factory.addSafeOwnerToAll(newDAOMember, 2);

// Verificar se foi adicionado
assertTrue(ControlOwnerModule(treasuryModule).isSafeOwner(treasurySafe, newDAOMember));
assertTrue(ControlOwnerModule(devModule).isSafeOwner(devSafe, newDAOMember));
assertTrue(ControlOwnerModule(marketingModule).isSafeOwner(marketingSafe, newDAOMember));
```

### **4. Remover Owner de Todos os Safes**
```solidity
// Remover membro que saiu da DAO
factory.removeSafeOwnerFromAll(prevOwner, leavingMember, 1);

// Verificar se foi removido
assertFalse(ControlOwnerModule(treasuryModule).isSafeOwner(treasurySafe, leavingMember));
assertFalse(ControlOwnerModule(devModule).isSafeOwner(devSafe, leavingMember));
assertFalse(ControlOwnerModule(marketingModule).isSafeOwner(marketingSafe, leavingMember));
```

### **5. Substituir Owner em Todos os Safes**
```solidity
// Substituir membro antigo por novo
factory.replaceSafeOwnerInAll(prevOwner, oldMember, newMember);

// Verificar se foi substituído
assertFalse(ControlOwnerModule(treasuryModule).isSafeOwner(treasurySafe, oldMember));
assertTrue(ControlOwnerModule(treasuryModule).isSafeOwner(treasurySafe, newMember));
```

### **6. Alterar Threshold em Todos os Safes**
```solidity
// Aumentar segurança - threshold 3 em todos os Safes
factory.changeSafeThresholdInAll(3);

// Verificar se foi alterado
assertEq(ControlOwnerModule(treasuryModule).getSafeThreshold(treasurySafe), 3);
assertEq(ControlOwnerModule(devModule).getSafeThreshold(devSafe), 3);
assertEq(ControlOwnerModule(marketingModule).getSafeThreshold(marketingSafe), 3);
```

### **7. Executar Transação em Todos os Safes**
```solidity
// Executar transação em todos os Safes
bytes memory data = abi.encodeWithSignature(
    "transfer(address,uint256)", 
    recipient, 
    amount
);

factory.execTransactionInAll(
    tokenAddress,
    0,
    data,
    Enum.Operation.Call
);
```

## 🔧 **Uso Avançado**

### **1. Fallback Function**
```solidity
// Usar fallback para qualquer função
bytes4 functionSelector = ControlOwnerModule.addSafeOwner.selector;
bytes memory params = abi.encode(newOwner, 2);
bytes memory callData = abi.encodePacked(functionSelector, params);

factory.call(callData);
```

### **2. Chamar Função Específica**
```solidity
// Chamar função específica em todos os módulos
factory.callFunctionInAll(
    ControlOwnerModule.addSafeOwner.selector,
    abi.encode(newOwner, 2)
);
```

### **3. Chamar em Módulos Específicos**
```solidity
// Chamar apenas nos módulos de treasury e marketing
address[] memory modules = [treasuryModule, marketingModule];
factory.callFunctionInModules(
    modules,
    ControlOwnerModule.addSafeOwner.selector,
    abi.encode(newOwner, 2)
);
```

### **4. Alterar Module Manager**
```solidity
// Alterar quem pode gerenciar owners em todos os Safes
factory.changeModuleManagerInAll(newManager);

// Verificar se foi alterado
assertEq(ControlOwnerModule(treasuryModule).getModuleManager(treasurySafe), newManager);
assertEq(ControlOwnerModule(devModule).getModuleManager(devSafe), newManager);
```

## 📊 **Funções de Consulta**

### **1. Informações Gerais**
```solidity
// Obter todos os módulos
address[] memory modules = factory.getAllModules();

// Obter número de módulos
uint256 count = factory.getModuleCount();

// Verificar se Safe tem módulo
bool hasModule = factory.hasModule(safeAddress);

// Obter módulo de um Safe
address module = factory.getModuleForSafe(safeAddress);
```

### **2. Verificar Permissões**
```solidity
// Verificar se é factory owner
bool isFactoryOwner = (msg.sender == factory.factoryOwner());

// Verificar se é module manager
bool isManager = ControlOwnerModule(module).isModuleManager(safe, account);

// Verificar se é safe owner
bool isOwner = ControlOwnerModule(module).isSafeOwner(safe, account);
```

## 🛡️ **Segurança**

### **1. Controle de Acesso**
```solidity
// Apenas factory owner pode chamar cross-module functions
require(msg.sender == factoryOwner, "Only factory owner can call");

// Validações de endereços
require(newOwner != address(0), "Invalid owner address");
require(threshold > 0, "Threshold must be greater than 0");
```

### **2. Tratamento de Erros**
```solidity
// Falha silenciosa - módulo pode não estar configurado
try ControlOwnerModule(module).addSafeOwner(newOwner, threshold) {
    // Sucesso
} catch {
    // Falha silenciosa - continua com próximo módulo
}
```

### **3. Eventos de Auditoria**
```solidity
// Todos os cross-module calls emitem eventos
event CrossModuleCall(address indexed caller, address[] modules, string functionName);
event FallbackCalled(address indexed caller, address[] modules, bytes data);
```

## 📈 **Vantagens**

### **1. ✅ Centralização**
- Um ponto de controle para múltiplos Safes
- Facilita gerenciamento de DAOs com múltiplos treasuries

### **2. ✅ Eficiência**
- Uma transação para múltiplos Safes
- Economia de gas para operações em lote

### **3. ✅ Consistência**
- Garante que todos os Safes tenham as mesmas configurações
- Evita inconsistências entre diferentes treasuries

### **4. ✅ Flexibilidade**
- Suporte a operações em lote
- Suporte a operações seletivas
- Fallback para qualquer função

### **5. ✅ Auditoria**
- Eventos detalhados para todas as operações
- Rastreamento completo de mudanças

## 🎯 **Casos de Uso**

### **1. DAO com Múltiplos Treasuries**
```solidity
// DAO tem treasury principal, dev treasury, marketing treasury
// Adicionar novo membro em todos os treasuries
factory.addSafeOwnerToAll(newMember, 2);
```

### **2. Organização com Múltiplos Safes**
```solidity
// Empresa tem Safe para operações, Safe para investimentos, Safe para payroll
// Remover funcionário que saiu de todos os Safes
factory.removeSafeOwnerFromAll(prevOwner, leavingEmployee, 1);
```

### **3. Atualização de Segurança**
```solidity
// Aumentar threshold em todos os Safes por segurança
factory.changeSafeThresholdInAll(3);
```

### **4. Execução de Transações**
```solidity
// Executar transação em todos os Safes (ex: distribuir tokens)
factory.execTransactionInAll(tokenContract, 0, transferData, Enum.Operation.Call);
```

## 🚀 **Deploy e Configuração**

### **1. Script de Deploy**
```bash
# Deploy da factory
forge script script/DeployFactory.s.sol --rpc-url <RPC_URL> --private-key <PRIVATE_KEY> --broadcast
```

### **2. Configuração Inicial**
```solidity
// 1. Deploy template e factory
// 2. Criar módulos para cada Safe
// 3. Habilitar módulos nos Safes
// 4. Configurar module managers
// 5. Adicionar owners iniciais
```

### **3. Uso Contínuo**
```solidity
// Usar factory para gerenciar todos os Safes
factory.addSafeOwnerToAll(newMember, 2);
factory.removeSafeOwnerFromAll(prevOwner, oldMember, 1);
factory.changeSafeThresholdInAll(3);
```

## 📝 **Conclusão**

O `OwnerModuleFactory` com cross-module calls oferece:

- ✅ **Controle centralizado** de múltiplos Safes
- ✅ **Operações em lote** eficientes
- ✅ **Consistência** entre diferentes treasuries
- ✅ **Flexibilidade** para diferentes cenários
- ✅ **Segurança** com controle de acesso robusto
- ✅ **Auditoria** completa de todas as operações

É a solução ideal para organizações que precisam gerenciar múltiplos Safes de forma eficiente e consistente! 🚀 