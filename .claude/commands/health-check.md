# System Health Check

Comprehensive system validation to ensure all components are properly configured and functional.

## Your Task

Perform end-to-end system health validation:

### 1. Configuration Validation

**networks.json vs On-Chain State:**
- Read `script/config/networks.json`
- For each deployed chain (Gnosis, Ethereum, Base):
  - Verify Registry proxy address exists on-chain (has code)
  - Query Registry implementation via `cast call <registry> "implementation()"`
  - Compare with IMPLEMENTATIONS.SyncGroupRegistry in networks.json
  - Verify Manager and Module implementation templates stored in Registry
  - Check deployment block numbers are reasonable (not 0, not future)

**Subgraph Config Sync:**
- Read `pkg/subgraph/configs/gnosis.json` (and others)
- Compare contract addresses with networks.json
- Verify startBlock matches deployment block
- Check that network name matches chain ID
- Ensure all required contracts are configured

**Environment Variables:**
- Check if `PRIVATE_KEY` is set (for deployments)
- Check if `GNOSIS_RPC_URL` is set
- Check if `GNOSISSCAN_API_KEY` is set (for verification)
- Check if subgraph API keys are set (if applicable)
- Don't log values, just confirm presence

### 2. Smart Contract Health

**Registry Contract:**
- Query `managerImplementation()` - should return valid address
- Query `moduleImplementation()` - should return valid address
- Try to read `owner()` - should return deployer address
- Check if contract is paused (if pause mechanism exists)

**Sample Manager (if any exist on-chain):**
- Find a deployed Manager from events or known addresses
- Query `moduleTemplate()` - should return valid address
- Query `owner()` - should return governance Safe
- Try to call `getNetworkSafes()` to verify read operations work

**Sample Module (if any exist on-chain):**
- Find a deployed Module from events or known addresses
- Query `owner()` - should return the Safe address
- Check if module is enabled on Safe via `cast call <safe> "isModuleEnabled(address)" <module>`
- Query `syncWithOtherModules()` state if applicable

### 3. Frontend Health

**Development Server:**
- Check if `pnpm dev` is running on port 3000
  ```bash
  lsof -ti:3000 || echo "Server not running"
  ```
- If running: Make a curl request to `http://localhost:3000`
- Check response status (should be 200)
- Verify page loads without errors

**Build Validation:**
- Run `pnpm type-check` to verify TypeScript compilation
- Check for type errors in hooks and components
- Verify no missing imports or broken references

**Dependencies:**
- Check `package.json` for critical dependencies:
  - `@safe-global/safe-apps-sdk` (MANDATORY per CLAUDE.md)
  - `wagmi`, `viem`, `@tanstack/react-query`
  - `@rainbow-me/rainbowkit`
- Verify no version conflicts or peer dependency warnings
- Check if `node_modules` is up to date (compare package.json vs lockfile)

### 4. Hook Integration Health
Validate all 19 custom hooks are importable and properly typed:
- Try importing each hook (just verify files exist and have exports)
- Check for circular dependencies between hooks
- Verify hooks import from correct paths
- Check for TypeScript errors in hook files

### 5. Contract Version Consistency
- Query contract versions from all deployed contracts
- Compare with expected versions in documentation
- Check if any contracts need upgrading
- Verify version numbers are sequential and make sense

### 6. Known Issues Check
Per `CLAUDE.md` and `TODO.md`, check for known issues:

**Silent Module Disable Failure:**
- Read `src/SafeModuleManager.sol:433-440`
- Verify the `_disableModuleOnSafe` function still has try-catch
- This is a KNOWN SECURITY ISSUE - remind user to fix
- Check if any events logged for failed disable attempts

**Other Issues:**
- Search for TODO comments in contract code
- Search for FIXME comments in frontend code
- Check if any tests are marked as `.skip()`

### 7. Deployment Status Summary
- Count total groups created (query Registry events)
- Count total Safes with modules (query Manager events)
- Show most recent deployment/upgrade timestamp
- Check if any deployments are in progress (pending transactions)

### 8. Security & Best Practices
- Verify all contracts use custom errors (not require strings)
- Check that UUPS contracts have proper initializers
- Verify no delegatecall to untrusted addresses
- Check that upgradeable contracts follow storage gaps pattern
- Verify reentrancy guards on sensitive functions

## Output Format
```
🏥 System Health Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Configuration Validation
  networks.json:
    ✅ Gnosis: Registry deployed at 0xa74c... (block 12345678)
    ✅ Implementation addresses match on-chain state
    ⚠️  Ethereum: Not deployed yet
    ⚠️  Base: Not deployed yet

  Subgraph configs:
    ✅ gnosis.json synced with networks.json
    ✅ Start blocks configured correctly
    ✅ All contract addresses present

  Environment:
    ✅ PRIVATE_KEY: Set
    ✅ GNOSIS_RPC_URL: Set
    ✅ GNOSISSCAN_API_KEY: Set

🔷 Smart Contract Health
  Registry (0xa74c...):
    ✅ Manager template: 0x...
    ✅ Module template: 0x...
    ✅ Owner: 0x2F9e... (deployer)
    ✅ Contract operational

  Sample Manager (0x...):
    ✅ Module template: 0x...
    ✅ Owner: 0x... (governance Safe)
    ✅ Network Safes: 3 Safes registered
    ✅ Read operations working

  Sample Module (0x...):
    ✅ Owner: 0x... (Safe)
    ⚠️  Module enable status: PENDING (not yet enabled on Safe)
    ⚠️  This is expected for new modules

🌐 Frontend Health
  Development Server:
    ✅ Running on port 3000
    ✅ HTTP 200 response
    ✅ No server errors in console

  Build Status:
    ✅ TypeScript compilation: No errors
    ✅ No missing imports
    ✅ No broken references

  Dependencies:
    ✅ @safe-global/safe-apps-sdk@9.1.0 (CRITICAL - present)
    ✅ wagmi@2.x, viem, rainbowkit
    ✅ No peer dependency warnings
    ✅ node_modules up to date

🎣 Hook Integration (19 hooks)
  ✅ All hooks importable
  ✅ No circular dependencies detected
  ✅ TypeScript types valid
  ✅ Critical hooks present:
      • useSafeApps (MANDATORY)
      • useModuleManager
      • useSyncGroupRegistry

🔢 Contract Versions
  ✅ SyncGroupRegistry: v1.0.0
  ✅ SafeModuleManager: v1.0.0
  ✅ ManagedSafeModule: v1.0.0
  ✅ All versions consistent

⚠️  Known Issues (2)
  🚨 HIGH: Silent module disable failure
      Location: src/SafeModuleManager.sol:433-440
      Impact: Module may stay enabled after removal attempt
      Status: Tracked in TODO.md
      Action: Fix before production deployment

  📝 TODO: 3 TODO comments in contract code
      Action: Review and address before deployment

📊 Deployment Summary
  Total Groups Created: 2
  Total Safes with Modules: 5
  Last Deployment: 2025-10-20T13:12:00Z
  Last Upgrade: Never
  Pending Transactions: None

🔒 Security Check
  ✅ All contracts use custom errors
  ✅ UUPS initializers present
  ✅ No untrusted delegatecalls
  ✅ Storage gaps implemented
  ✅ Reentrancy guards on sensitive functions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall Health: ⚠️  GOOD (1 known issue)

Recommendations:
  • Fix silent module disable failure before production
  • Deploy to Ethereum and Base for multi-chain support
  • Enable pending modules on Safes (user action required)
  • Review and resolve TODO comments
```

## Error Handling
- If networks.json missing: CRITICAL - cannot validate anything
- If on-chain addresses don't match config: CRITICAL - config out of sync
- If dev server not running: WARNING - start with `pnpm dev`
- If type errors exist: ERROR - fix before deployment
- If critical dependencies missing: CRITICAL - run `pnpm install`

## Notes
- This command is READ-ONLY - no modifications made
- Safe to run anytime, recommended before every deployment
- Helps catch configuration drift and integration issues early
- Should be run after every upgrade or configuration change
- Some warnings are expected (e.g., pending module enables)
