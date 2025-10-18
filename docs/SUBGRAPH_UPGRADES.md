# Subgraph Upgrade Guide

## Overview

The subgraph for owner-sync-safe is designed to work with the **Registry architecture** using **dynamic templates**. This guide explains when the subgraph needs updates and how to handle contract upgrades.

## Subgraph Architecture

### 🏗️ Three-Layer Indexing

```
┌─────────────────────────────────────────────┐
│  Data Source: SyncGroupRegistry             │
│  Address: 0xa74c4551f0b32e0754dfecff5dc0... │
│  Events: GroupCreated, GroupUpdated, etc.   │
└─────────────────┬───────────────────────────┘
                  │
                  │ GroupCreated → createWithContext()
                  ↓
┌─────────────────────────────────────────────┐
│  Template: SafeModuleManager (Dynamic)      │
│  One instance per group                     │
│  Events: ModuleCreated, CrossModuleCall...  │
└─────────────────┬───────────────────────────┘
                  │
                  │ ModuleCreated → createWithContext()
                  ↓
┌─────────────────────────────────────────────┐
│  Template: ManagedSafeModule (Dynamic)      │
│  One instance per Safe                      │
│  Events: SafeOwnerAdded, OwnersSynced...    │
└─────────────────────────────────────────────┘
```

### How Dynamic Templates Work

**Step 1: Registry emits `GroupCreated`**
```typescript
// pkg/subgraph/src/mappings/registry.ts
export function handleGroupCreated(event: GroupCreated): void {
  // Create entities
  const group = new SyncGroup(groupId);
  const manager = new SafeModuleManager(managerId);

  // 🔑 Dynamically create data source for this manager
  SafeModuleManagerTemplate.createWithContext(event.params.manager, context);
}
```

**Step 2: Manager emits `ModuleCreated`**
```typescript
// pkg/subgraph/src/mappings/manager.ts
export function handleModuleCreated(event: ModuleCreated): void {
  // Create module entity
  const module = new ManagedSafeModule(moduleId);

  // 🔑 Dynamically create data source for this module
  ManagedSafeModuleTemplate.createWithContext(event.params.module, context);

  // 🔑 Also track the Safe contract for EnabledModule events
  SafeTemplate.createWithContext(event.params.safe, context);
}
```

**Step 3: All events are now indexed**
- Registry events → tracked at registry level
- Manager events → tracked per group
- Module events → tracked per Safe
- Safe events → EnabledModule/DisabledModule

---

## Contract Upgrade Impact

### Scenario 1: Upgrade Registry Implementation

**Contract Change:**
```bash
SyncGroupRegistry Proxy → New Implementation
```

**Subgraph Impact:** ✅ **NONE**

**Why:**
- Subgraph indexes by **proxy address**, not implementation
- Same address = same data source
- Events remain at same address

**Action Required:** ✅ **None**

**Verification:**
```bash
# Subgraph should continue indexing without changes
pnpm codegen  # Should succeed with same schema
```

---

### Scenario 2: Update Manager Template in Registry

**Contract Change:**
```bash
Registry.updateManagerImplementation(newImpl)
```

**Subgraph Impact:** ⚠️ **Depends on Event Compatibility**

**Why:**
- New groups use new template
- Subgraph must understand events from new template
- If events unchanged → no impact
- If events added → may want to track them

**Check Event Compatibility:**
```bash
# Compare old and new events
forge inspect SafeModuleManager_OLD abi | jq '.[] | select(.type=="event")'
forge inspect SafeModuleManager_NEW abi | jq '.[] | select(.type=="event")'

# Check for differences
diff <(forge inspect old abi) <(forge inspect new abi)
```

**Action Required:**

**If events are identical:** ✅ **None**

**If new events added:**
1. Add events to `subgraph.yaml`:
   ```yaml
   eventHandlers:
     - event: NewEventSignature(indexed uint256,address)
       handler: handleNewEvent
   ```

2. Add handler in `manager.ts`:
   ```typescript
   export function handleNewEvent(event: NewEvent): void {
     // Handle new event
   }
   ```

3. Redeploy subgraph:
   ```bash
   pnpm codegen
   pnpm build:gnosis
   pnpm deploy:gnosis
   ```

**If event signatures changed:** 🔴 **Breaking Change** (see below)

---

### Scenario 3: Upgrade Specific Group's Manager

**Contract Change:**
```bash
Manager.upgradeTo(newImpl)
```

**Subgraph Impact:** ⚠️ **Depends on Event Compatibility**

**Why:**
- Manager proxy address unchanged → same data source
- But implementation changed → may emit different events
- Template already indexing this address

**Action Required:**

Same as Scenario 2 - check event compatibility.

**Special Case: Only one group upgraded**
- Old groups: Use old events
- New group: Uses new events
- Subgraph must support **both** sets of events if incompatible

**Solution for mixed versions:**
```typescript
// In handler, check which version
export function handleModuleCreated(event: ModuleCreated): void {
  const manager = SafeModuleManager.load(event.address.toHexString());

  // Handle both old and new event formats if needed
  if (event.params.length == 2) {
    // Old version: ModuleCreated(address,address)
  } else {
    // New version: ModuleCreated(address,address,uint256)
  }
}
```

---

### Scenario 4: Update Module Template in Manager

**Contract Change:**
```bash
Manager.updateModuleTemplate(newImpl)
```

**Subgraph Impact:** ⚠️ **Depends on Event Compatibility**

**Why:**
- Future modules use new template
- Subgraph templates must handle new module events

**Action Required:** Same as Scenario 2

---

### Scenario 5: Upgrade Individual Safe's Module

**Contract Change:**
```bash
Module.upgradeTo(newImpl)
```

**Subgraph Impact:** ⚠️ **Depends on Event Compatibility**

**Why:**
- Module proxy address unchanged
- Template already tracking this module
- New implementation may emit different events

**Action Required:** Same as Scenario 2

---

## Event Compatibility Matrix

### ✅ Backward Compatible Changes

**Safe changes:**
- Adding new events (optional to track)
- Adding new fields to events (must be at end)
- Adding new functions (no events)
- Bug fixes in implementation logic

**Examples:**
```solidity
// OLD
event ModuleCreated(address indexed safe, address indexed module);

// NEW - BACKWARD COMPATIBLE
event ModuleCreated(address indexed safe, address indexed module);
event ModuleUpgraded(address indexed module, address indexed newImpl);  // ✅ New event
```

**Action:** Add new event handlers if you want to track them. Existing handlers continue working.

---

### 🔴 Breaking Changes

**Breaking changes that REQUIRE subgraph update:**

1. **Event signature change**
   ```solidity
   // OLD
   event ModuleCreated(address indexed safe, address indexed module);

   // NEW - BREAKING
   event ModuleCreated(address indexed safe, address indexed module, uint256 version);
   ```

2. **Event name change**
   ```solidity
   // OLD
   event GroupCreated(uint256 indexed groupId, ...);

   // NEW - BREAKING
   event SyncGroupCreated(uint256 indexed groupId, ...);
   ```

3. **Event removed**
   ```solidity
   // OLD
   event ModuleDisabledOnSafe(address indexed safe, address indexed module);

   // NEW - REMOVED (BREAKING)
   // Event no longer exists
   ```

4. **Indexed parameter changes**
   ```solidity
   // OLD
   event OwnerChange(address indexed owner, ...);

   // NEW - BREAKING
   event OwnerChange(address owner, ...);  // No longer indexed
   ```

**Action Required:**
1. Update `schema.graphql` if entities change
2. Update event signatures in `subgraph.yaml`
3. Update handlers in mapping files
4. Redeploy subgraph
5. **May need to resync from scratch**

---

## Subgraph Update Procedures

### Procedure 1: Add New Event Handlers

**When:** New events added to contracts

**Steps:**

```bash
# 1. Update subgraph.yaml
# Add new event handler to appropriate template

# 2. Update mapping file
# Add handler function

# 3. Regenerate types
pnpm codegen

# 4. Build subgraph
pnpm build:gnosis

# 5. Deploy subgraph
pnpm deploy:gnosis
```

**Example:**

```yaml
# pkg/subgraph/subgraph.yaml
templates:
  - name: SafeModuleManager
    eventHandlers:
      - event: ManagerUpgraded(indexed address,indexed address)  # ✅ New
        handler: handleManagerUpgraded
```

```typescript
// pkg/subgraph/src/mappings/manager.ts
export function handleManagerUpgraded(event: ManagerUpgraded): void {
  log.info("Manager upgraded: old={}, new={}", [
    event.params.oldImpl.toHexString(),
    event.params.newImpl.toHexString()
  ]);

  const manager = SafeModuleManager.load(event.address.toHexString());
  if (manager) {
    manager.implementation = event.params.newImpl;
    manager.save();
  }
}
```

---

### Procedure 2: Update Event Signatures (Breaking)

**When:** Event signatures changed in contract

**Steps:**

```bash
# 1. Update schema if needed
# Edit pkg/subgraph/src/schema.graphql

# 2. Update event signatures in subgraph.yaml
# Match new contract events exactly

# 3. Update handlers
# Edit mapping files to handle new event structure

# 4. Regenerate types
pnpm codegen

# 5. Build and verify
pnpm build:gnosis

# 6. Deploy with full resync
pnpm deploy:gnosis --version-label v2.0.0
```

**Important:** Breaking changes may require reindexing from scratch. The Graph Network will detect incompatible changes.

---

### Procedure 3: Update Contract Address

**When:** Deploying entirely new Registry (rare)

**Steps:**

```yaml
# 1. Update pkg/subgraph/subgraph.yaml
dataSources:
  - name: SyncGroupRegistry
    source:
      address: "0xNEW_REGISTRY_ADDRESS"  # ✅ Update
      startBlock: NEW_START_BLOCK        # ✅ Update
```

```bash
# 2. Regenerate deployment config
pnpm manifest:gnosis

# 3. Deploy as new subgraph
pnpm deploy:gnosis --version-label v2.0.0
```

---

## Testing Event Compatibility

### Method 1: Compare ABIs

```bash
# Extract events from ABIs
forge inspect src/SafeModuleManager.sol:SafeModuleManager abi > old-abi.json
forge inspect src/SafeModuleManager_v2.sol:SafeModuleManager abi > new-abi.json

# Filter events only
jq '.[] | select(.type=="event")' old-abi.json > old-events.json
jq '.[] | select(.type=="event")' new-abi.json > new-events.json

# Compare
diff old-events.json new-events.json
```

### Method 2: Check Event Signatures

```bash
# Get event signatures
cast sig-event "ModuleCreated(address,address)"
# Output: 0x...

# Compare old vs new
cast sig-event "ModuleCreated(address,address,uint256)"
# Output: 0x... (different = breaking)
```

### Method 3: Test on Testnet

```bash
# 1. Deploy old contract to testnet
# 2. Deploy subgraph pointing to testnet
# 3. Upgrade contract
# 4. Verify subgraph continues indexing
# 5. Check for errors in logs
```

---

## Monitoring Subgraph Health

### Check Indexing Status

```bash
# Via Graph Explorer
# https://thegraph.com/explorer/subgraphs/[your-subgraph-id]

# Via GraphQL endpoint
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ _meta { block { number } } }"}' \
  https://api.studio.thegraph.com/query/[your-endpoint]
```

### Common Issues After Upgrade

**Issue: "Failed to index event: unknown event signature"**

**Cause:** Event signature changed but subgraph.yaml not updated

**Solution:**
```bash
# Update event signature in subgraph.yaml
# Redeploy subgraph
pnpm deploy:gnosis
```

---

**Issue: "Entity not found: SafeModuleManager"**

**Cause:** Template not created for new manager

**Solution:** Check that `GroupCreated` handler calls `createWithContext()`

---

**Issue: "Subgraph stopped syncing after block X"**

**Cause:** Breaking change in contract events

**Solution:**
1. Check contract upgrade at block X
2. Compare event signatures
3. Update subgraph accordingly
4. Redeploy with resync

---

## Upgrade Checklist

Before deploying contract upgrades:

- [ ] **Extract and compare ABIs**
  ```bash
  forge inspect OldContract abi > old.json
  forge inspect NewContract abi > new.json
  diff old.json new.json
  ```

- [ ] **Check event compatibility**
  - Are event signatures identical?
  - Are new events added?
  - Are any events removed?

- [ ] **Test on testnet**
  - Deploy contracts
  - Deploy subgraph
  - Perform upgrade
  - Verify indexing continues

- [ ] **Update subgraph if needed**
  - Add new event handlers
  - Update event signatures
  - Update schema if needed

- [ ] **Plan deployment**
  - Coordinate contract + subgraph deployment
  - Communicate to users
  - Monitor indexing after deployment

- [ ] **Monitor after deployment**
  - Check subgraph sync status
  - Verify entities are created
  - Check for errors in logs

---

## Subgraph Deployment Commands

```bash
# Generate code from schema
pnpm codegen

# Build subgraph
pnpm build:gnosis

# Deploy to Graph Network (Gnosis)
pnpm deploy:gnosis

# Deploy with version label
pnpm deploy:gnosis --version-label v2.0.0

# Deploy to local Graph Node (development)
pnpm create-local
pnpm deploy-local
```

---

## File Reference

### Subgraph Configuration

```
pkg/subgraph/
├── subgraph.yaml              # Main config, data sources, templates
├── src/
│   ├── schema.graphql         # Entity definitions
│   └── mappings/
│       ├── registry.ts        # Registry event handlers
│       ├── manager.ts         # Manager event handlers
│       ├── module.ts          # Module event handlers
│       └── safe.ts            # Safe event handlers
└── abis/                      # ABI files
```

### Critical Files to Update

**For event changes:**
- `subgraph.yaml` - Event signatures
- `src/mappings/*.ts` - Handler implementations

**For entity changes:**
- `src/schema.graphql` - Entity definitions
- `src/mappings/*.ts` - Entity creation/updates

**For new contracts:**
- `subgraph.yaml` - Add data source or template
- `src/mappings/*.ts` - Add handlers

---

## See Also

- [Contract Upgrade Process](./UPGRADE_PROCESS.md)
- [The Graph Documentation](https://thegraph.com/docs/en/)
- [AssemblyScript API](https://thegraph.com/docs/en/developing/assemblyscript-api/)
- [Subgraph Best Practices](https://thegraph.com/docs/en/developing/creating-a-subgraph/)
