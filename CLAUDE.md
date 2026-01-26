# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Owner Sync Safe is a full-stack dApp for managing synchronized ownership across multiple Gnosis Safe wallets using upgradeable smart contracts (Solidity/Foundry), a Next.js frontend, and a Graph Protocol subgraph for indexing.

## Tech Stack

- **Smart Contracts**: Solidity ^0.8.6 with Foundry 1.3.2-nightly (8cd97db)
- **Frontend**: Next.js 14.2 + React 18 + TypeScript 5.5 + Tailwind CSS 3.4
- **Web3**: Wagmi 2.12 + Viem 2.21 + RainbowKit 2.1
- **Safe Integration**: @safe-global/safe-apps-sdk 9.1.0
- **Indexing**: The Graph Protocol (subgraph 0.69.2)
- **Package Manager**: pnpm 9.7.0 (enforced)
- **Node**: 20.x

## Common Commands

This project uses [Task](https://taskfile.dev) for build automation. See [docs/TASKFILE.md](docs/TASKFILE.md) for complete documentation.

### Smart Contracts

```bash
# Build with optimization
task build

# Run all tests (verbose)
task test

# Run specific test file
task test:file FILE=SafeModuleManagerTest.t.sol

# Run specific test function
task test:function FUNC=testCreateModuleForSafe

# Generate gas snapshots
task snapshot

# Check contract sizes (24,576 byte limit)
task check-sizes

# Deploy Registry to Gnosis Chain
task deploy:registry:gnosis

# Deploy to other networks
task deploy:registry:base        # Base
task deploy:registry:arbitrum    # Arbitrum One
task deploy:registry:optimism    # Optimism
task deploy:registry:polygon     # Polygon

# Upgrade Registry (5 scenarios - see docs/UPGRADE_PROCESS.md)
task upgrade:registry:gnosis
task upgrade:manager-template:gnosis
task upgrade:module-template:gnosis

# List all available tasks
task --list-all

# Check environment setup
task doctor

# Complete project setup
task setup
```

**Important**: Always run `task test` before deploying. Deployment requires password for account `pkf`, so leave the command for the user to execute.

### Frontend

```bash
# Development server (runs on 0.0.0.0:3000)
pnpm dev

# Type checking
pnpm type-check

# Build for production
pnpm build

# Generate Wagmi types from ABIs
pnpm generate

# Sync deployment configs to subgraph
pnpm sync-configs

# Update deployment addresses from networks.json
pnpm update-deployments
```

**Important**: Always check server is up after modifications (run in dev mode and check logs).

### Subgraph

```bash
# Generate manifest and build
pnpm build

# Deploy to Graph Studio (Gnosis)
pnpm deploy:gnosis

# Generate manifest from Mustache template
pnpm manifest:gnosis
```

## Architecture

### Three-Tier UUPS Proxy System

All core contracts use OpenZeppelin's UUPS upgradeable pattern:

```
Deployer (Registry Owner)
  └─> SyncGroupRegistry (UUPS Proxy)
       ├─ Stores Manager + Module templates
       └─> SafeModuleManager (UUPS Proxy, one per group)
            ├─ Owner: Governance Safe
            └─> ManagedSafeModule (UUPS Proxy, one per Safe)
                 └─ Owner: Individual Safe
```

**Layer 1: SyncGroupRegistry** (`src/SyncGroupRegistry.sol`)
- Main registry that creates and manages sync groups
- Deployed: `0xa74c4551f0b32e0754dfecff5dc0239f23cc7844` (Gnosis Chain)
- Owner: `0x2F9e113434aeBDd70bB99cB6505e1F726C578D6d`
- Stores implementation templates for Manager and Module
- Creates isolated groups with their own governance

**Layer 2: SafeModuleManager** (`src/SafeModuleManager.sol`)
- One instance per sync group (created by Registry)
- Owner: Governance Safe specified during group creation
- Creates ManagedSafeModule proxies for Safes in group
- Executes cross-Safe batch operations (owner sync)

**Layer 3: ManagedSafeModule** (`src/ManagedSafeModule.sol`)
- One instance per Safe in a group (created by Manager)
- Owner: The Safe itself
- Must be enabled on Safe via Safe's interface
- Handles individual Safe owner operations and auto-sync

### Ownership & Control

- **Registry Level**: Deployer owns Registry, can upgrade Registry and update templates
- **Group Level**: Governance Safe owns Manager, can execute cross-module operations
- **Safe Level**: Safe owns its Module, controls individual upgrades and operations

### Module Enablement

- Each ManagedSafeModule must be individually enabled on its respective Safe
- Enablement tracked via Safe's `EnabledModule` event (indexed by subgraph)
- Module is functional only after Safe enables it

### Upgrade Scenarios (5 Levels)

See detailed documentation in `docs/UPGRADE_PROCESS.md` and `docs/SUBGRAPH_UPGRADES.md`.

1. **Registry Upgrade**: `Registry.upgradeTo()` - Affects Registry only, future groups
2. **Manager Template Update**: `Registry.updateManagerImplementation()` - Future groups only
3. **Manager Upgrade**: `Manager.upgradeTo()` - Specific group, requires governance Safe
4. **Module Template Update**: `Manager.updateModuleTemplate()` - Future Safes in group
5. **Module Upgrade**: `Module.upgradeTo()` - Individual Safe, requires Safe multisig

## Frontend Architecture

### Critical Features (MANDATORY)

**See `docs/FEATURES.md` for complete documentation of features that must be preserved.**

1. **Safe App Integration** (MANDATORY)
   - Hook: `src/hooks/useSafeApps.ts` - Must be imported and used in main page
   - Must detect Safe iframe context and display Safe-specific UI
   - Must retrieve Safe address, owners, and threshold
   - Dependencies: `@safe-global/safe-apps-sdk` must remain in package.json
   - Test: Load at https://app.safe.global as custom app

2. **Module Management** (CORE)
   - Hook: `src/hooks/useModuleManager.ts`
   - Contract integration with SafeModuleManager

3. **Owner Synchronization** (CORE)
   - Contract: `SyncGroupRegistry.sol`
   - Hook: `src/hooks/useSyncGroupRegistry.ts`

4. **Wallet Connectivity** (MANDATORY)
   - Providers: `src/app/providers.tsx`
   - WagmiProvider + RainbowKitProvider setup

### Refactoring Rules

- ✅ ALWAYS verify Safe App integration after UI refactors
- ✅ ALWAYS ensure `useSafeApps` is used in main page component
- ✅ NEVER remove hooks without checking `docs/FEATURES.md`
- ✅ Test in Safe iframe after major changes

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx             # Main app component (must import useSafeApps)
│   ├── layout.tsx           # Root layout
│   ├── providers.tsx        # Wagmi + RainbowKit config
│   └── globals.css
├── components/             # React components (17 total)
│   ├── ModuleManager.tsx
│   ├── GroupDashboard.tsx
│   └── ...
├── hooks/                  # Custom React hooks (17 total)
│   ├── useSafeApps.ts       # Safe App detection (CRITICAL)
│   ├── useModuleManager.ts  # Contract interactions
│   ├── useSyncGroupRegistry.ts
│   └── ...
├── lib/                    # Utils & configs
│   ├── wagmi.ts             # Wagmi config
│   ├── network-config.ts    # Chain configs
│   ├── subgraph-client.ts   # GraphQL client
│   └── deployments.ts       # Contract addresses
└── interfaces/             # TypeScript types

src/ (contracts)
├── SyncGroupRegistry.sol       # Layer 1: Registry
├── SafeModuleManager.sol       # Layer 2: Group Manager
├── ManagedSafeModule.sol       # Layer 3: Safe Module
└── errors/SafeModuleErrors.sol

test/                       # Foundry tests
├── SafeModuleManager*.t.sol
├── ManagedSafeModule*.t.sol
└── helpers/

pkg/subgraph/
├── src/schema.graphql      # GraphQL schema
├── src/mappings/           # Event handlers
└── src/templates/          # Dynamic contract templates
```

### Environment Variables

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID (required)
- `NEXT_PUBLIC_ALCHEMY_GNOSIS_URL` - Optional Alchemy RPC for Gnosis Chain

## Solidity Best Practices

- Use custom errors instead of `require()` statements (gas efficient)
- All errors defined in `src/errors/SafeModuleErrors.sol`
- Use named imports `{A, B}` instead of wildcard imports
- Monitor contract sizes with `forge build --sizes` (24,576 byte limit)
- Keep managers simple and focused on primary responsibility
- Test core functionality after optimization

## Foundry Version Management

- Current: 1.3.2-nightly (8cd97db, Sept 3, 2025)
- Previous: 1.3.0-nightly (cb8f3bf, July 23, 2025)
- Rollback: `foundryup -C cb8f3bf2c4047f17310b84a685fcc12b61c98891`
- Upgrade: `foundryup -C 8cd97db7281d1bf64617699359596f553bbf88c4`

## Deployment Process

1. **Test First**: `task test`
2. **Check Sizes**: `task check-sizes`
3. **Deploy**: `task deploy:registry:gnosis` (requires password, let user run)
   - Or other networks: `task deploy:registry:base`, `task deploy:registry:arbitrum`, etc.
4. **Update Configs**: Automatically updates `script/config/networks.json`
5. **Sync Subgraph**: Automatically runs `pnpm sync-configs`
6. **Update Frontend**: Automatically runs `pnpm update-deployments`

**Note**: Task automatically runs tests before deployment (configured as dependency).

## Vercel Deployment

- **pnpm version conflicts**: Vercel's default pnpm (6.35.1) is too old
- **Solution**: Use `npx pnpm@9.7.0` in `vercel.json`
- **Never use** `engines.pnpm` restriction in package.json
- **Node.js version**: Use `"node": "20.x"` (specific, not `>=18.0.0`)
- **vercel.json config**:
  ```json
  {
    "installCommand": "npx pnpm@9.7.0 install",
    "buildCommand": "npx pnpm@9.7.0 build"
  }
  ```

## Known Security Issues

### 🚨 HIGH PRIORITY: Silent Module Disable Failure

**Location**: `src/SafeModuleManager.sol:433-440` (`_disableModuleOnSafe` function)

**Problem**: The function uses try-catch and silently ignores errors when attempting to disable a module on a Safe. This creates dangerous inconsistent state.

**Code**:
```solidity
function _disableModuleOnSafe(address safe, address module) internal {
    try ISafe(safe).disableModule(address(0x1), module) {
        emit ModuleDisabledOnSafe(safe, module);
    } catch (bytes memory /* errorData */) {
        // 🚨 SILENT FAILURE - continues cleanup even if disable failed!
    }
}
```

**What Goes Wrong**:
1. Manager cleans up its state (deletes mappings, removes from arrays)
2. BUT module may still be enabled on the Safe
3. No error/warning to caller or user
4. Manager thinks Safe is removed, Safe still has active module

**Real-World Impact**:
- **Group invitation decline**: User clicks "decline invitation" → UI shows success → module still active on their Safe
- **Security risk**: Module can still execute transactions even after "removal"
- **State inconsistency**: Group member list shows Safe as removed, but it's still in the group
- **Owner sync issues**: Other Safes might sync owners assuming this Safe is out

**When This Fails**:
- Module was never enabled (user didn't complete setup)
- Module already disabled by Safe owners
- Safe has custom/malicious implementation
- Wrong prevModule parameter (hardcoded `0x1` may be incorrect)

**Fix Required**: See `TODO.md` for detailed fix options. Recommended: revert on failure instead of silent catch.

**Affected Features**:
- Decline group invitation (`useDeclineInvitation.ts`)
- Remove Safe from network (`removeSafeFromNetwork`)
- Group switching functionality

**Priority**: HIGH - Fix before production deployment

## Subgraph

### Purpose

Indexes smart contract events for efficient querying of:
- Group creation and updates
- Module deployment and activation
- Owner changes and sync events
- Cross-module operations
- Operation failures

### Entity Hierarchy

```
SyncGroupRegistry (root)
  └── SyncGroup
       ├── SafeModuleManager
       ├── GroupSafe (Safe membership)
       └── ManagedSafeModule
            ├── ModuleOwner (current owners)
            ├── OwnerChange (change history)
            ├── ThresholdChange
            └── OwnerSyncEvent
```

### When Schema or Events Change

1. Check event compatibility: `docs/SUBGRAPH_UPGRADES.md`
2. Update schema: `pkg/subgraph/src/schema.graphql`
3. Update mappings: `pkg/subgraph/src/mappings/`
4. Rebuild: `pnpm build` (in pkg/subgraph)
5. Deploy: `pnpm deploy:gnosis`

**Important**: After SQL or schema changes, always check affected queries.

## Git Workflow

- Use `fd` instead of `find` command (symlinked: `ln -s $(which fdfind) ~/.local/bin/fd`)
- Never include "Co-Authored-By: Claude" in commits (per global CLAUDE.md)
- Put "WIP" in commit message if changes were not tested and confirmed working
- Only commit `manifest.json` if explicitly asked
- Don't commit markdown files used for GG24 or other form submissions

## Testing

### Smart Contracts

```bash
# Run all tests with verbose output
task test

# Run specific test file
task test:file FILE=SafeModuleManagerTest.t.sol

# Run specific test function
task test:function FUNC=testCreateModuleForSafe

# Generate gas snapshots
task snapshot

# Check contract sizes
task check-sizes

# Or use forge directly for advanced options:
forge test --gas-report
forge test --match-path test/SafeModuleManagerTest.t.sol -vvv
```

### Frontend

```bash
# Type checking
pnpm type-check

# Build validation
pnpm build
```

### Integration Testing

After major changes:
1. Run dev server: `pnpm dev`
2. Check logs for errors
3. Test Safe App mode: Load at https://app.safe.global as custom app
4. Verify module operations work

## Key Documentation

- `ARCHITECTURE.md` - Visual system diagrams
- `docs/FEATURES.md` - Critical features checklist (MUST READ before refactoring)
- `docs/UPGRADE_PROCESS.md` - 5 upgrade scenarios with step-by-step procedures
- `docs/SUBGRAPH_UPGRADES.md` - Event compatibility and impact analysis
- `README.md` - Project overview and quick start
- Online docs: https://notes.felipenovaesrocha.xyz/s/gHyTdvBYj

## Contract Dependencies

- OpenZeppelin Contracts v4.6.0
- OpenZeppelin Contracts Upgradeable v4.6.0
- Gnosis Safe v1.3.0
- Zodiac v1.0.10
- Solmate (Rari Capital)

## Storage Layout Inspection

Use the following command to inspect contract storage layout:

```bash
forge inspect pkg/contracts/src/CVStrategy/CVStrategyV0_0.sol storageLayout --md
```

This is useful for verifying storage compatibility during upgrades.

## Port Management

- `pnpm dev` always runs on port 3000
- Different worktrees run on different ports, but keep the same port per worktree
- Never kill ngrok when it's running

## Troubleshooting & Lessons Learned

### Common Issues & Solutions

#### 1. Subgraph Endpoint `/version/latest` Not Working

**Error:**
```
deployment `u29898/s108340/latest` does not exist
```

**Solution:**
Use specific version in URL instead of `/version/latest`:
- Dev: `https://api.studio.thegraph.com/query/29898/owner-sync-safe-gnosis/v0.1.1`
- Prod: `https://gateway.thegraph.com/api/subgraphs/id/GJ5xkXEcTc8k23CbqpE97BEChJseRziTYCXGBDxQdTYi` (requires API key)

**Test with curl first:**
```bash
curl -X POST 'https://api.studio.thegraph.com/query/29898/owner-sync-safe-gnosis/v0.1.1' \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ _meta { block { number } } }"}'
```

#### 2. TypeScript Errors Not Caught Locally

**Problem:** `pnpm dev` doesn't run full TypeScript checks

**Solution:** ALWAYS run before committing:
```bash
pnpm type-check  # TypeScript validation
pnpm build       # Production build test
```

**Common TypeScript fixes:**
```typescript
// Bad: implicit type causes deployment error
const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};

// Good: explicit type annotation
const headers: Record<string, string> = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
```

#### 3. Browser Cache After Config Changes

**Problem:** Browser shows old errors even after code update

**Solution:**
```bash
# 1. Clear Next.js cache
rm -rf .next

# 2. Restart dev server
pnpm dev

# 3. Hard refresh browser
# Chrome/Edge: Ctrl + Shift + R (Cmd + Shift + R on Mac)
# Or open incognito/private window
```

#### 4. Module Not Showing in UI

**Problem:** Subgraph returns data via curl, but UI shows nothing

**Root Cause:** `usePendingSetup` and `useActiveGroups` hooks require Safe App context

**Solution:** Test INSIDE Safe App:
1. Go to https://app.safe.global
2. Settings → Apps → Add custom app
3. Enter your ngrok or production URL
4. Check browser DevTools Console for logs:
   ```
   [usePendingSetup] Effect running: { isSafeApp: true, ... }
   [SubgraphClient] Creating client for chain 100...
   ```

#### 5. Vercel Deployment URL Confusion

**Wrong:** Checking deployment-specific URL (temporary)
```
https://owner-sync-safe-8rqr8icgk-felipe-novaes-rochas-projects.vercel.app
```

**Right:** Check production URL (canonical)
```bash
vercel project ls  # Shows production URLs
curl -I https://owner-sync-safe.vercel.app
```

### Pre-Commit Checklist

Before every commit:
```bash
# 1. Type check
pnpm type-check

# 2. Build test (catches more issues)
pnpm build

# 3. Review staged changes
git diff --staged
```

### Deployment Checklist

- [ ] `pnpm type-check` passes
- [ ] `pnpm build` succeeds locally
- [ ] Remove "DEV" prefixes from production configs (`public/manifest.json`)
- [ ] Verify environment variables set in Vercel Dashboard
- [ ] After deploy, check **production URL** (from `vercel project ls`)
- [ ] Test in Safe App context if Safe-specific features changed

### Debugging Flow

1. **Backend/API fails?** → Test with `curl` first
2. **Frontend fails?** → Check browser DevTools Console
3. **Build fails on Vercel?** → Run `pnpm type-check` and `pnpm build` locally
4. **Hooks not running?** → Verify all dependencies (isSafeApp, safeInfo, publicClient)

### Quick Commands Reference

```bash
# Clear Next.js cache and restart
rm -rf .next && pnpm dev

# Test subgraph query
curl -X POST 'https://api.studio.thegraph.com/query/29898/owner-sync-safe-gnosis/v0.1.1' \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ managedSafeModules(first: 5) { id safe } }"}'

# Check Vercel deployments
vercel ls              # List recent deployments
vercel project ls      # Show production URLs

# Ngrok fixed URL (for testing Safe App)
ngrok http 3001 --url https://outgoing-rationally-weevil.ngrok-free.app
```

### Critical Files for Config Changes

- `src/lib/subgraph-client.ts` - Subgraph endpoint configuration
- `public/manifest.json` - Safe App metadata (remove "DEV -" for production)
- `.env.example` - Document all required environment variables
- `vercel.json` - Vercel build configuration

### Never Commit

- `.next/` - Next.js build cache (add to .gitignore)
- `pkg/subgraph/build/subgraph.yaml` - Generated file
- `pkg/subgraph/subgraph.yaml` - Generated file

## License

AGPL-3.0
