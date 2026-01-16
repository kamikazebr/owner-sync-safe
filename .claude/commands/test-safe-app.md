# Test Safe App Integration

Validate that Safe App integration is working correctly and all critical features are preserved.

## Your Task

Perform comprehensive Safe App integration testing:

### 1. Critical Files Verification
According to `docs/FEATURES.md`, these features are MANDATORY:

**Check useSafeApps Hook:**
- Verify `src/hooks/useSafeApps.ts` exists and contains:
  - Safe Apps SDK initialization with retry logic (3 retries)
  - Timeout handling (2-10 seconds with exponential backoff)
  - iframe detection via `window?.parent !== window`
  - Safe info retrieval (address, owners, threshold)
  - Error handling and fallback to standalone mode

**Check Main Page Integration:**
- Read `src/app/page.tsx`
- VERIFY that `useSafeApps` hook is imported
- VERIFY that hook is actually called in the component
- VERIFY that Safe-specific UI is rendered when in iframe context
- If missing, this is a CRITICAL ERROR per CLAUDE.md

### 2. Dependencies Verification
- Check `package.json` for `@safe-global/safe-apps-sdk`
- Verify version is compatible (should be v9.1.0 or compatible)
- Check for any peer dependency warnings related to Safe SDK

### 3. Hook Integration Analysis
Analyze all 19 hooks for Safe compatibility:

**Safe Integration Hooks** (CRITICAL):
- `useSafeApps.ts` - Primary Safe detection
- `useSafeContract.ts` - Safe contract instance
- `usePendingSetup.ts` - Module enable tracking

**Module Management Hooks**:
- `useModuleManager.ts` - Must work in Safe context
- `useEnableModule.ts` - Must propose Safe transactions
- `useIsModuleEnabled.ts` - Must read Safe state
- `useManagedModule.ts` - Must interact with Safe's module

**Check each hook for**:
- Proper Safe address handling
- Transaction proposal creation (not direct execution)
- Error handling for Safe context
- Fallback behavior when not in Safe

### 4. Safe Transaction Proposal Validation
- Search codebase for `safe.txs.send()` usage
- Verify transactions are proposed, not executed directly
- Check that proper Safe SDK methods are used
- Verify error messages are Safe-context aware

### 5. Iframe Detection Testing
- Check the iframe detection logic in `useSafeApps.ts`:
  ```typescript
  const isIframe = window?.parent !== window
  ```
- Verify this is the first check before SDK initialization
- Ensure no assumptions about Safe context without detection

### 6. Timeout & Retry Logic Validation
- Verify retry configuration:
  - Initial timeout: 2 seconds
  - Max timeout: 10 seconds
  - Retry attempts: 3
  - Exponential backoff implemented
- Check that timeouts don't block UI
- Verify fallback to standalone mode after retries exhausted

### 7. UI Component Verification
Search for components that show different UI based on Safe context:
- Welcome messages mentioning Safe
- Transaction buttons (should say "Propose" in Safe, "Execute" standalone)
- Connection status indicators
- Safe-specific help text

### 8. Known Issues Check
Per CLAUDE.md, check for the silent module disable failure:
- Read `src/SafeModuleManager.sol` line 433-440
- Verify the `_disableModuleOnSafe` try-catch block
- This is a KNOWN SECURITY ISSUE that may affect Safe integration
- Alert user if this affects their Safe testing

## Output Format
```
✅ Safe App Integration Test Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Critical Features (MANDATORY):
  ✅ useSafeApps hook exists with retry logic
  ✅ Main page imports and uses useSafeApps
  ✅ Safe-specific UI rendering present
  ✅ @safe-global/safe-apps-sdk@9.1.0 installed

Hook Compatibility (19 hooks analyzed):
  ✅ Safe Integration Hooks: 3/3 compatible
  ✅ Module Management Hooks: 5/5 compatible
  ✅ Group Management Hooks: 6/6 compatible
  ✅ Owner Sync Hooks: 3/3 compatible
  ✅ UI Hooks: 2/2 compatible

Safe Transaction Handling:
  ✅ Transactions use safe.txs.send() for proposals
  ✅ No direct transaction execution in Safe context
  ✅ Error messages are Safe-context aware

Iframe Detection:
  ✅ Detection logic: window?.parent !== window
  ✅ Runs before SDK initialization
  ✅ Fallback to standalone mode working

Timeout & Retry Configuration:
  ✅ Initial timeout: 2s
  ✅ Max timeout: 10s
  ✅ Retry attempts: 3
  ✅ Exponential backoff: Implemented

⚠️  Known Issues:
  • Silent module disable failure in SafeModuleManager:433-440
    Impact: May affect group invitation decline in Safe context
    Status: Tracked in TODO.md, fix pending

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall Status: ✅ SAFE APP INTEGRATION VERIFIED

To test in real Safe environment:
1. Run `pnpm dev` to start local server
2. Visit https://app.safe.global
3. Apps → Add custom app → http://localhost:3000
4. Verify iframe detection and Safe info display
```

## Error Handling
- If useSafeApps missing from main page: CRITICAL ERROR - refactoring broke integration
- If Safe SDK not in package.json: CRITICAL ERROR - dependency removed
- If hooks incompatible with Safe: Show which hooks need fixing
- If timeout/retry logic missing: CRITICAL ERROR - SDK may fail silently

## Notes
- This is per `docs/FEATURES.md` - these features MUST NOT be removed
- Safe App integration is the primary use case for this project
- Always run this test after UI refactoring
- This command is READ-ONLY - no modifications made
