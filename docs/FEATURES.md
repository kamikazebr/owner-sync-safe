# Critical Features Documentation

This document lists **CRITICAL FEATURES** that must be preserved during refactors, updates, and code changes.

⚠️ **WARNING**: Removing or breaking these features without explicit approval is considered a breaking change.

---

## 🔴 Critical Features (DO NOT REMOVE)

### 1. Safe App Integration

**Status**: MANDATORY - Must work in Safe wallet iframe

**Description**:
The application must detect and integrate with Safe (Gnosis Safe) wallet when loaded as a Safe App.

**Implementation**:
- **Hook**: `src/hooks/useSafeApps.ts`
- **Dependencies**: `@safe-global/safe-apps-sdk`
- **Detection**: Checks if running in iframe and communicates with Safe parent window
- **Required Info**: Safe address, owners, threshold, chain ID

**Required Behavior**:
- ✅ Detect when running inside Safe iframe
- ✅ Retrieve Safe context (address, owners, threshold)
- ✅ Show Safe-specific UI elements
- ✅ Handle Safe transaction proposals
- ✅ Timeout gracefully if not in Safe (3s)

**How to Verify**:
```tsx
// This hook MUST be used in main app component
import { useSafeApps } from '@/hooks/useSafeApps';

function App() {
  const { isSafeApp, safeInfo, sdk } = useSafeApps();
  // Must show Safe-specific UI when isSafeApp === true
}
```

**Breaking Changes**:
- ❌ Removing `useSafeApps` hook
- ❌ Not importing/using `useSafeApps` in main page
- ❌ Removing Safe App detection UI
- ❌ Breaking Safe Apps SDK integration

---

### 2. Module Management

**Status**: CORE FEATURE

**Description**:
Create and manage Safe modules through the SafeModuleManager contract.

**Implementation**:
- **Hook**: `src/hooks/useModuleManager.ts`
- **Contract**: `SafeModuleManager.sol`

**Required Operations**:
- ✅ Create new modules for Safes
- ✅ Check if Safe has module
- ✅ Get module address for Safe
- ✅ Execute cross-module operations

---

### 3. Owner Synchronization

**Status**: CORE FEATURE

**Description**:
Synchronize owners across multiple Safes in a group.

**Implementation**:
- **Contract**: `SyncGroupRegistry.sol`
- **Hook**: `src/hooks/useSyncGroupRegistry.ts`
- **Components**: Owner sync UI components

**Required Operations**:
- ✅ Create sync groups
- ✅ Add/remove Safes from groups
- ✅ Sync owners across group
- ✅ Manage group admins

---

### 4. Wallet Connectivity

**Status**: MANDATORY

**Description**:
Connect user wallets via RainbowKit for dApp mode.

**Implementation**:
- **Provider**: `src/app/providers.tsx`
- **Config**: `src/lib/wagmi.ts`
- **Dependencies**: `wagmi`, `@rainbow-me/rainbowkit`

**Required Behavior**:
- ✅ Support multiple wallet types
- ✅ Handle network switching
- ✅ Persist connection state
- ✅ Work alongside Safe App mode

---

## 🟡 Important Features (Preserve When Possible)

### 5. Contract Information Display

**Implementation**: `src/components/ContractInfo.tsx`

Shows deployed contract addresses and versions. Important for debugging and user transparency.

---

### 6. Responsive Layout

**Implementation**: `src/components/AppLayout.tsx`, `src/hooks/useResponsive.ts`

Mobile-friendly interface with sidebar/mobile navigation.

---

## 📋 Refactoring Checklist

Before completing any refactor, verify:

- [ ] `useSafeApps` hook is imported and used in main page
- [ ] Safe App detection banner displays when `isSafeApp === true`
- [ ] All critical hooks are preserved and functional
- [ ] Build completes without errors (`pnpm build`)
- [ ] Type checking passes (`pnpm type-check`)
- [ ] Safe App SDK dependencies remain in `package.json`
- [ ] Main providers include WagmiProvider + RainbowKitProvider

---

## 🔍 How Features Were Lost (Example)

**What Happened**: During UI refactor, `src/app/page.tsx` was completely rewritten with new component structure but `useSafeApps` import was not added.

**Result**: Safe App functionality broke silently. Build passed but Safe integration failed at runtime.

**Prevention**: Always cross-reference this document when refactoring major files.

---

## 🛠️ Testing Critical Features

### Safe App Integration Test

```bash
# 1. Run dev server
pnpm dev

# 2. Load in Safe at https://app.safe.global
# Go to Apps → Add Custom App → http://localhost:3000

# 3. Verify:
# - Green "Running as Safe App" banner appears
# - Safe address is displayed
# - Threshold/owners count shown
```

### Module Management Test

```bash
# 1. Connect wallet
# 2. Select a Safe address
# 3. Create module
# 4. Verify module appears in Safe's modules list
```

---

## 📝 Maintenance Notes

**Last Updated**: 2025-10-07
**Updated By**: Claude Code
**Reason**: Safe App functionality was removed during refactor and needed restoration

**Version**: 1.0.0

---

## 🚨 Emergency Recovery

If a critical feature is broken:

1. Check git history: `git log --all --oneline --grep="safe.*app" -i`
2. Find last working commit for the feature
3. Restore relevant files: `git checkout <commit> -- src/hooks/useSafeApps.ts`
4. Re-integrate into current code
5. Update this document with recovery notes
