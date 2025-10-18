# Contract Upgrade Process

## Architecture Overview

The owner-sync-safe system uses a **3-layer UUPS upgradeable architecture** with the Registry pattern:

```
┌─────────────────────────────────────────────┐
│  SyncGroupRegistry (UUPS Proxy)             │
│  - Stores implementation templates          │
│  - Creates new groups                       │
│  - Owner: 0x2F9e113434aeBDd70bB99cB6505e... │
└─────────────────┬───────────────────────────┘
                  │
                  │ createGroup()
                  ↓
┌─────────────────────────────────────────────┐
│  SafeModuleManager (UUPS Proxy per group)   │
│  - One per sync group                       │
│  - Creates modules for Safes                │
│  - Owner: Governance Safe of the group      │
└─────────────────┬───────────────────────────┘
                  │
                  │ createModuleForSafe()
                  ↓
┌─────────────────────────────────────────────┐
│  ManagedSafeModule (UUPS Proxy per Safe)    │
│  - One per Safe in the group                │
│  - Manages Safe owners                      │
│  - Owner: The Safe itself                   │
└─────────────────────────────────────────────┘
```

### Key Characteristics

- **Decentralized Ownership**: Each layer is owned by different entities
- **Independent Upgrades**: Each proxy can be upgraded independently
- **Template Pattern**: Registry and Managers store implementation templates for creating new instances
- **Backward Compatibility**: Old instances continue working after template updates

## Upgrade Scenarios

### Scenario 1: Upgrade SyncGroupRegistry

**What:** Upgrade the main Registry contract implementation

**Who can do it:** Registry owner (deployer address)

**Impact:**
- ✅ Only affects Registry functionality
- ✅ Existing groups continue working unchanged
- ✅ New groups created after upgrade use new Registry logic

**Steps:**

```bash
# 1. Deploy new Registry implementation
forge script script/DeployRegistryImplementation.s.sol \
  --rpc-url $RPC_URL_GNOSIS \
  --account pkf \
  \
  --broadcast

# 2. Upgrade Registry proxy
PROXY_ADDRESS=0xa74c4551f0b32e0754dfecff5dc0239f23cc7844 \
NEW_IMPL=0x[new-impl-address] \
forge script script/UpgradeRegistry.s.sol \
  --rpc-url $RPC_URL_GNOSIS \
  --account pkf \
  \
  --broadcast
```

**Verification:**

```solidity
cast call $PROXY_ADDRESS "VERSION()(string)" --rpc-url $RPC_URL_GNOSIS
```

---

### Scenario 2: Update Manager Template in Registry

**What:** Update the SafeModuleManager implementation template stored in Registry

**Who can do it:** Registry owner

**Impact:**
- ✅ Only affects **new groups** created after update
- ❌ Existing groups NOT affected (they use their own manager proxy)
- 💡 To upgrade existing groups, see Scenario 3

**Steps:**

```bash
# 1. Deploy new SafeModuleManager implementation
forge script script/DeployManagerImplementation.s.sol \
  --rpc-url $RPC_URL_GNOSIS \
  --account pkf \
  --broadcast

# 2. Update template in Registry
NEW_MANAGER_IMPL=0x[new-manager-impl] \
forge script script/UpdateRegistryTemplates.s.sol \
  --rpc-url $RPC_URL_GNOSIS \
  --account pkf \
  --sig "updateManagerTemplate()" \
  --broadcast
```

**Verification:**

```solidity
cast call $REGISTRY_ADDRESS "managerImplementation()(address)" --rpc-url $RPC_URL_GNOSIS
```

---

### Scenario 3: Upgrade Specific Group's Manager

**What:** Upgrade a specific group's SafeModuleManager proxy to new implementation

**Who can do it:** Group owner (governance Safe)

**Impact:**
- ✅ Only affects this specific group
- ✅ Other groups unaffected
- ✅ Allows gradual rollout across groups

**Steps:**

```bash
# 1. Deploy new SafeModuleManager implementation
forge script script/DeployManagerImplementation.s.sol \
  --rpc-url $RPC_URL_GNOSIS \
  --account pkf \
  --broadcast

# 2. Get manager address for the group
GROUP_ID=0 \
cast call $REGISTRY_ADDRESS "getGroup(uint256)((address,address,address,string,bool,uint256))" $GROUP_ID

# 3. Upgrade manager (must be done via governance Safe multisig)
# Option A: Via Safe SDK (if running in Safe app)
# Option B: Via Transaction Builder
# Navigate to: https://app.safe.global/apps/open?safe=gno:0x[governance-safe]&appUrl=https://app.safe.global/apps/transaction-builder

# Transaction data:
# To: [manager-address]
# Value: 0
# Data: upgradeTo(address)
# Param: [new-implementation-address]
```

**Generate transaction:**

```bash
MANAGER_ADDRESS=0x[manager-from-step-2]
NEW_IMPL=0x[new-impl-address]

# Encode the upgradeTo call
cast calldata "upgradeTo(address)" $NEW_IMPL
```

**Verification:**

```solidity
cast call $MANAGER_ADDRESS "VERSION()(string)" --rpc-url $RPC_URL_GNOSIS
```

---

### Scenario 4: Update Module Template in Manager

**What:** Update the ManagedSafeModule implementation template in a specific manager

**Who can do it:** Manager owner (group's governance Safe)

**Impact:**
- ✅ Only affects **new Safes** added to this group after update
- ❌ Existing Safe modules NOT affected
- 💡 To upgrade existing modules, see Scenario 5

**Steps:**

```bash
# 1. Deploy new ManagedSafeModule implementation
forge script script/DeployModuleImplementation.s.sol \
  --rpc-url $RPC_URL_GNOSIS \
  --account pkf \
  --broadcast

# 2. Update template in manager (via governance Safe multisig)
# Transaction data:
# To: [manager-address]
# Value: 0
# Function: updateModuleTemplate(address)
# Param: [new-module-implementation]
```

**Using Makefile (if you have direct access):**

```bash
PROXY_ADDRESS=0x[manager-address] \
make upgrade-module-template-gnosis
```

**Verification:**

```solidity
cast call $MANAGER_ADDRESS "moduleTemplate()(address)" --rpc-url $RPC_URL_GNOSIS
```

---

### Scenario 5: Upgrade Individual Safe's Module

**What:** Upgrade a specific Safe's ManagedSafeModule proxy to new implementation

**Who can do it:** Safe owners (via multisig)

**Impact:**
- ✅ Only affects this specific Safe
- ✅ Other Safes in group unaffected
- ✅ Safe controls its own upgrade

**Authorization:**

The module's `_authorizeUpgrade` allows upgrades from:
- Module owner (the Safe itself)
- OR Manager (for coordinated upgrades)

**Steps:**

```bash
# 1. Deploy new ManagedSafeModule implementation
forge script script/DeployModuleImplementation.s.sol \
  --rpc-url $RPC_URL_GNOSIS \
  --account pkf \
  --broadcast

# 2. Get module address for the Safe
SAFE_ADDRESS=0x[safe-address]
cast call $MANAGER_ADDRESS "getModuleForSafe(address)(address)" $SAFE_ADDRESS

# 3. Upgrade module (via Safe multisig)
# Transaction Builder:
# To: [module-address]
# Value: 0
# Function: upgradeTo(address)
# Param: [new-implementation-address]
```

**Verification:**

```solidity
MODULE_ADDRESS=0x[module-from-step-2]
cast call $MODULE_ADDRESS "VERSION()(string)" --rpc-url $RPC_URL_GNOSIS
```

---

## Complete Upgrade Flow

### Goal: Upgrade Everything for All Groups

**Phase 1: Update Registry Templates (once)**

```bash
# Deploy new implementations
forge script script/DeployAllImplementations.s.sol --broadcast

# Update Registry templates
# This affects future groups only
make update-registry-templates-gnosis
```

**Phase 2: Upgrade Existing Groups (per group)**

For each group:

```bash
# 1. Get group info
GROUP_ID=0
cast call $REGISTRY_ADDRESS "getGroup(uint256)" $GROUP_ID

# 2. Governance Safe upgrades their manager
# Via Safe Transaction Builder

# 3. Update module template in manager
# Via Safe Transaction Builder
```

**Phase 3: Upgrade Existing Safes (per Safe, optional)**

For each Safe that wants the upgrade:

```bash
# Safe owners upgrade their module
# Via Safe Transaction Builder
```

---

## Makefile Commands Reference

### Current Commands

```makefile
# Deploy new UUPS implementations
make deploy-uups-gnosis

# Upgrade specific manager proxy
PROXY_ADDRESS=0x[manager] make upgrade-uups-gnosis

# Update module template in manager
PROXY_ADDRESS=0x[manager] make upgrade-module-template-gnosis

# Deploy Registry
make deploy-registry-gnosis
```

### Commands Needed (TODO)

```makefile
# Deploy individual implementations
make deploy-manager-impl-gnosis
make deploy-module-impl-gnosis
make deploy-registry-impl-gnosis

# Update Registry templates
make update-registry-manager-template-gnosis
make update-registry-module-template-gnosis

# Upgrade Registry
PROXY_ADDRESS=0x[registry] make upgrade-registry-gnosis
```

---

## Important Considerations

### ⚠️ Before Any Upgrade

1. **Test on testnet first**
   - Deploy to testnet
   - Perform upgrade
   - Verify functionality

2. **Check event compatibility**
   ```bash
   # Compare events
   forge inspect SafeModuleManager abi | jq '.[] | select(.type=="event")'
   forge inspect SafeModuleManager_v2 abi | jq '.[] | select(.type=="event")'
   ```

3. **Verify storage layout**
   ```bash
   forge inspect SafeModuleManager storage
   forge inspect SafeModuleManager_v2 storage
   ```

4. **Check subgraph compatibility**
   - See `docs/SUBGRAPH_UPGRADES.md`
   - Event changes may require subgraph redeployment

### 🔒 Security Checklist

- [ ] Storage layout unchanged (or properly upgraded)
- [ ] Events backward compatible
- [ ] `_authorizeUpgrade` properly restricts access
- [ ] `__gap` storage slot maintained
- [ ] Version string updated
- [ ] No `selfdestruct` or `delegatecall` to user input
- [ ] Initialize functions protected with `initializer` modifier

### 🎯 Best Practices

1. **Incremental Rollout**
   - Upgrade one group first
   - Monitor for issues
   - Roll out to other groups

2. **Coordination**
   - Notify group owners before template updates
   - Provide upgrade documentation
   - Offer upgrade assistance

3. **Backward Compatibility**
   - Keep old implementations deployed
   - Allow groups to stay on old versions
   - Support multiple versions temporarily

4. **Monitoring**
   - Watch for events after upgrade
   - Check subgraph indexing
   - Monitor transaction success rates

---

## Troubleshooting

### Upgrade Fails: "Ownable: caller is not the owner"

**Cause:** Transaction sent from wrong address

**Solution:**
- Registry upgrades: Use deployer address
- Manager upgrades: Use group's governance Safe
- Module upgrades: Use the Safe itself

### Upgrade Fails: "ERC1967: new implementation is not UUPS"

**Cause:** New implementation doesn't inherit `UUPSUpgradeable`

**Solution:** Ensure new implementation has:
```solidity
contract SafeModuleManager is UUPSUpgradeable {
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
```

### Subgraph Stops Indexing After Upgrade

**Cause:** Event signature changed

**Solution:** See `docs/SUBGRAPH_UPGRADES.md` for event compatibility checks

### Storage Collision After Upgrade

**Cause:** New variables added without considering existing storage

**Solution:**
- Use `__gap` for new variables
- Never remove or reorder existing variables
- Add new variables at the end

---

## Version History

| Version | Contract | Changes | Date |
|---------|----------|---------|------|
| 2.0.0-uups | SafeModuleManager | Initial UUPS version | 2025-01 |
| 2.0.0-uups | ManagedSafeModule | Initial UUPS version | 2025-01 |
| 1.0.0-uups | SyncGroupRegistry | Initial Registry | 2025-01 |

---

## See Also

- [Subgraph Upgrade Guide](./SUBGRAPH_UPGRADES.md)
- [OpenZeppelin UUPS Proxy Pattern](https://docs.openzeppelin.com/contracts/4.x/api/proxy#UUPSUpgradeable)
- [Safe Transaction Builder](https://app.safe.global/apps/transaction-builder)
