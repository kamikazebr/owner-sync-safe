- use Errors instead require in Solidity code

# ⚠️ CRITICAL FEATURES - DO NOT REMOVE
**IMPORTANT**: See `docs/FEATURES.md` for complete documentation of critical features that must be preserved.

## Required Frontend Features
1. **Safe App Integration** (MANDATORY)
   - Hook: `src/hooks/useSafeApps.ts` - Must be imported and used in main page
   - Must detect Safe iframe context and display Safe-specific UI
   - Must retrieve Safe address, owners, and threshold
   - Dependencies: `@safe-global/safe-apps-sdk` must remain in package.json

2. **Module Management** (CORE)
   - Hook: `src/hooks/useModuleManager.ts`
   - Contract integration with SafeModuleManager

3. **Owner Synchronization** (CORE)
   - Contract: `SyncGroupRegistry.sol`
   - Hook: `src/hooks/useSyncGroupRegistry.ts`

## Refactoring Rules
- ✅ ALWAYS verify Safe App integration after UI refactors
- ✅ ALWAYS ensure `useSafeApps` is used in main page component
- ✅ NEVER remove hooks without checking `docs/FEATURES.md`
- ✅ Test in Safe iframe after major changes: Load at https://app.safe.global as custom app

# Contract Size Management
- Ethereum contract size limit: 24,576 bytes (EIP-170)
- Monitor contract sizes with `forge build --sizes`
- When contracts exceed limit, prioritize core functionality over convenience features
- Manager contracts should focus on creation/management, avoid complex cross-module operations
- Remove manager-as-module patterns if they cause size bloat
- Use named imports `{A, B}` instead of wildcard imports to reduce compilation warnings

# Contract Architecture Best Practices
- Keep managers simple and focused on their primary responsibility
- Separate complex network management into dedicated contracts if needed
- Avoid inheritance from heavy base contracts (like Module) unless essential
- Remove unused functions like batch operations, version management if not critical
- Test core functionality after optimization to ensure nothing essential was broken

# Current Architecture
- **SafeModuleManager**: Creates ManagedSafeModule instances for cross-module operations
- **ManagedSafeModule**: Individual modules installed in Safes, owned by their respective Safe
- **Ownership Model**: Each Safe owns its own module → Safe controls its module operations and upgrades
- **Module Enablement**: Each ManagedSafeModule must be individually enabled on its respective Safe
- **Cross-Module Operations**: Only manager owner can execute operations across all managed modules
- **Individual Module Control**: Each Safe can upgrade its own module independently via multisig approval

# Foundry Version Management
- Current: 1.3.2-nightly (8cd97db, Sept 3, 2025)  
- Previous: 1.3.0-nightly (cb8f3bf, July 23, 2025)
- Rollback command: `foundryup -C cb8f3bf2c4047f17310b84a685fcc12b61c98891`
- Upgrade command: `foundryup -C 8cd97db7281d1bf64617699359596f553bbf88c4`
- to deploy use makefile example, also account require password, so let command to the user run.
- always run forge test before suggest deploy
- always check server is up after some modifications, run it in dev mode and also check logs after some changes

# Vercel Deployment
- **pnpm version conflicts**: Vercel's default pnpm (6.35.1) is too old for modern projects (need >=8.0.0)
- **Solution**: Use `npx pnpm@9.7.0` in `vercel.json` to bypass version conflicts
- **Never use** `engines.pnpm` restriction - it blocks deployment when Vercel's old pnpm tries to read package.json
- **Node.js version**: Use specific version like `"node": "20.x"` to prevent auto-upgrades (avoid `>=18.0.0`)
- **vercel.json config**:
  ```json
  {
    "installCommand": "npx pnpm@9.7.0 install",
    "buildCommand": "npx pnpm@9.7.0 build"
  }
  ```
- **Vercel CLI commands**:
  - `vercel ls --yes` - List deployments
  - `vercel inspect <url>` - View deployment details
  - `vercel logs <url>` - View runtime logs (not build logs)

# Known Security Issues

## 🚨 HIGH PRIORITY: Silent Module Disable Failure

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
- only commit manifest.json if i ask for it