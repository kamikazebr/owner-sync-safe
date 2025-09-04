# Safe Integration Guide

This guide explains how to properly integrate the OwnerModuleFactory with Gnosis Safe using the correct two-step process.

## 🏗️ Architecture Overview

The `OwnerModuleFactory` is a **Zodiac Module** that creates and manages `ControlOwnerModule` instances for Gnosis Safes. It follows the Zodiac module pattern where:

1. **Factory is a Module**: The factory itself inherits from `Module` and gets enabled on Safes
2. **Factory Creates Modules**: Once enabled, it can create child modules for the Safe
3. **Two-Step Process**: Integration requires enabling the factory first, then calling module creation

## ✅ Correct Integration Process

### Step 1: Enable Factory as Module

The factory must first be enabled as a module on your Safe.

**Via Safe UI (app.safe.global):**
1. Go to **Settings** → **Modules** 
2. Click **Add Module**
3. Enter factory address: `0xYourFactoryAddress`
4. Execute transaction with required signatures

**Via Transaction Builder:**
1. Go to **Apps** → **Transaction Builder**
2. **Add Transaction**:
   - **To**: `[Your Safe Address]`
   - **Value**: `0`
   - **Data**: `0x610b5925[Factory Address without 0x]` (enableModule selector)
3. Execute with required signatures

### Step 2: Create Child Module

After the factory is enabled, call the factory to create a child module.

**Via Transaction Builder:**
1. **Add Transaction**:
   - **To**: `[Factory Address]` 
   - **Value**: `0`
   - **Data**: `0x8cb84e18` (addModuleForSafe selector)
2. Execute transaction

**What happens:**
- Factory creates a new `ControlOwnerModule` instance
- Factory automatically enables the child module on your Safe
- Child module is configured and ready to use

## 🔧 Function Reference

### Factory Functions

#### `createModuleForSafe(address safe)`
- **Access**: Factory owner only
- **Purpose**: Creates module for specified Safe (doesn't enable it)
- **Use case**: Manual/external module creation

#### `addModuleForSafe()`
- **Access**: Must be called by the Safe itself
- **Purpose**: Creates and enables module atomically  
- **Use case**: **Recommended approach** after factory is enabled

#### `getModuleForSafe(address safe)`
- **Access**: Public view
- **Returns**: Module address for the Safe (or address(0) if none)

#### `hasModule(address safe)`
- **Access**: Public view  
- **Returns**: True if Safe has a module

### Network Management

#### `removeSafeFromNetwork(address safe)`
- **Access**: Factory owner only
- **Purpose**: Completely removes Safe and its module from the factory

#### `getNetworkStatus()`
- **Access**: Public
- **Returns**: Network statistics (total Safes, active modules, chain info)

## 🌐 Multi-Chain Support

The factory includes built-in multi-chain support:

- **Chain Tracking**: Tracks which chain each Safe is deployed on
- **Cross-Chain Ready**: Prepared for future multi-chain module management
- **Version Management**: Built-in version tracking for upgrades

### Chain Functions

#### `getSafeChainId(address safe)`
- Returns the chain ID where the Safe is deployed

#### `getSafesByChain(uint256 chainId)`
- Returns all Safes on a specific chain

## ⚠️ Important Notes

### Security Considerations

1. **Factory Owner**: Factory has an immutable owner set at deployment
2. **Module Permissions**: Child modules inherit Safe's execution permissions
3. **Zodiac Compliance**: Follows standard Zodiac security patterns

### Common Pitfalls

1. **❌ Don't try to enable modules directly** - Let the factory handle it
2. **❌ Don't skip Step 1** - Factory must be enabled first
3. **✅ Use `addModuleForSafe()`** - This is the atomic approach

### Deployment Addresses

Check `broadcast/` folder for deployed addresses on different networks:
- **Base**: `0xc42e4af82969e757602E657D92829E9e2F06f6B3` (v1.1.0)

## 📋 Example Integration

```solidity
// 1. Enable factory as module (via Safe transaction)
safe.enableModule(factoryAddress);

// 2. Create child module (called by Safe)
factory.addModuleForSafe();

// 3. Verify integration
address module = factory.getModuleForSafe(address(safe));
assert(module != address(0));
assert(factory.hasModule(address(safe)));
```

## 🔗 Safe UI Integration

### Using Safe{Wallet} Web App

1. **Connect** to your Safe at [app.safe.global](https://app.safe.global)
2. **Settings** → **Modules** → **Add Module**
3. **Enter Factory Address** and execute
4. **Apps** → **Transaction Builder**
5. **Call** `addModuleForSafe()` and execute
6. **Verify** in Modules section

### Module Management

After integration, you can:
- **View** active modules in Safe settings
- **Manage** owners via the child module
- **Execute** cross-module operations via factory
- **Monitor** network status and health

## 📞 Support

For issues or questions:
- **Repository**: Check GitHub issues
- **Documentation**: Review Zodiac docs
- **Community**: Safe community forums

This integration guide ensures secure, compliant module deployment following Zodiac best practices.