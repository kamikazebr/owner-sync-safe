# Deploy Multichain da Factory

Este documento descreve como usar o padrão de deploy multichain para a `OwnerModuleFactory` em múltiplas redes.

## 📋 Visão Geral

O padrão multichain permite fazer deploy da factory em múltiplas redes usando um único script, seguindo o mesmo padrão usado no projeto principal.

### 🌐 Redes Suportadas

**Testnets:**
- Sepolia (Ethereum)
- Arbitrum Sepolia
- Optimism Sepolia
- Base Sepolia

**Mainnets:**
- Arbitrum
- Optimism
- Polygon
- Gnosis
- Base (Coinbase L2)

## 🚀 Scripts Disponíveis

### Script Individual
- `script/DeployFactory.s.sol` - Deploy simples da factory

### Script Multichain
- `script/DeployFactoryMultiChain.s.sol` - Deploy multichain com parâmetro de rede

## 📝 Comandos Makefile

### Deploy Individual
```bash
# Localhost
make deploy-factory-local
make deploy-factory-anvil

# Testnets
make deploy-factory-sepolia
make deploy-factory-arbsep
make deploy-factory-opsep
make deploy-factory-basesep

# Mainnets
make deploy-factory-arbitrum
make deploy-factory-optimism
make deploy-factory-polygon
make deploy-factory-gnosis
make deploy-factory-base
```

### Deploy Multichain
```bash
# Testnets
make deploy-factory-multi-sep      # Sepolia
make deploy-factory-multi-arbsep   # Arbitrum Sepolia
make deploy-factory-multi-opsep    # Optimism Sepolia
make deploy-factory-multi-basesep  # Base Sepolia

# Mainnets
make deploy-factory-multi-arbitrum # Arbitrum
make deploy-factory-multi-optimism # Optimism
make deploy-factory-multi-polygon  # Polygon
make deploy-factory-multi-gnosis   # Gnosis
make deploy-factory-multi-base     # Base
```

### Deploy em Lote
```bash
# Todas as testnets
make deploy-factory-all-testnets

# Todas as mainnets
make deploy-factory-all-mainnets

# Todas as redes
make deploy-factory-all
```

## 🔧 Gerenciamento de Deployments

```bash
# Verificar deployments existentes
make check-deployments

# Limpar arquivos de deployment
make clean-deployments
```

## 📊 Estrutura de Deployments

O script multichain salva os endereços dos contratos deployados em arquivos separados:

```
deployments/
├── sepolia.txt
├── arbsepolia.txt
├── opsepolia.txt
├── basesepolia.txt
├── arbitrum.txt
├── optimism.txt
├── polygon.txt
├── gnosis.txt
└── base.txt
```

Cada arquivo contém:
```
Network: [nome da rede]
Factory: [endereço da factory]
Template: [endereço do template]
Factory Owner: [endereço do owner]
```

## 🎯 Benefícios do Padrão Multichain

1. **Consistência**: Mesmo script para todas as redes
2. **Rastreabilidade**: Logs específicos por rede
3. **Organização**: Arquivos separados por rede
4. **Automação**: Deploy em lote para múltiplas redes
5. **Manutenção**: Fácil atualização e verificação

## 🔍 Exemplo de Uso

```bash
# Deploy em Arbitrum Sepolia
make deploy-factory-multi-arbsep

# Deploy em Base
make deploy-factory-multi-base

# Verificar o deployment
cat deployments/arbsepolia.txt
cat deployments/base.txt

# Deploy em todas as testnets
make deploy-factory-all-testnets
```

## ⚙️ Configuração

Certifique-se de ter as seguintes variáveis no arquivo `.env`:

```env
# RPC URLs
RPC_URL_SEP_TESTNET=
RPC_URL_ARB_TESTNET=
RPC_URL_OP_TESTNET=
RPC_URL_BASE_TESTNET=
RPC_URL_ARB=
RPC_URL_OPT=
RPC_URL_POLYGON=
RPC_URL_GNOSIS=
RPC_URL_BASE=

# API Keys
ETHERSCAN_API_KEY=
ARBISCAN_API_KEY=
OPTIMISM_API_KEY=
POLYGONSCAN_API_KEY=
GNOSISSCAN_API_KEY=
BASESCAN_API_KEY=

# Conta
pkGarden=
``` 