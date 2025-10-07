# TODO

## High Priority Security Issues

### 1. Fix `_disableModuleOnSafe` silent failure (SafeModuleManager.sol:433-440)

**Location**: `src/SafeModuleManager.sol` lines 433-440

**Problem**:
The `_disableModuleOnSafe` function uses try-catch and silently swallows errors when attempting to disable a module on a Safe. This creates an inconsistent state where:
- Manager state is cleaned up (module removed from mappings/arrays)
- BUT the module may still be ENABLED on the Safe
- No indication to caller that disable failed

**Current Code**:
```solidity
function _disableModuleOnSafe(address safe, address module) internal {
    try ISafe(safe).disableModule(address(0x1), module) {
        // Success - module disabled
        emit ModuleDisabledOnSafe(safe, module);
    } catch (bytes memory /* errorData */) {
        // Log the error but continue with cleanup
        // 🚨 DANGER: Silent failure!
    }
}
```

**Security Impact**:
- **Group invitation decline fails silently**: When users decline a group invitation via UI, the module remains active on their Safe
- **False sense of security**: UI shows "invitation declined" but module is still functional
- **Inconsistent state**: Manager thinks Safe is removed, but Safe still has module enabled
- **Owner sync confusion**: Other group members might sync assuming this Safe is out

**When Can This Fail**:
1. Module was never enabled on the Safe (user never completed setup)
2. Module already disabled by Safe owners
3. Safe is malicious/custom implementation that reverts
4. Incorrect prevModule parameter (currently hardcoded to `0x1` sentinel)

**Recommended Solutions** (choose one):

**Option A: Revert on failure (SAFEST)**
```solidity
function _disableModuleOnSafe(address safe, address module) internal {
    try ISafe(safe).disableModule(address(0x1), module) {
        emit ModuleDisabledOnSafe(safe, module);
    } catch (bytes memory errorData) {
        revert ModuleDisableFailed(safe, module, errorData);
    }
}
```

**Option B: Check first, then require Safe to disable**
```solidity
function removeSafeFromNetwork(address safe) external {
    _validateManagerOwner();
    address module = safeToModule[safe];
    if (module == address(0)) revert NoModuleFound();

    // Require Safe to disable module first
    if (ISafe(safe).isModuleEnabled(module)) {
        revert ModuleStillEnabled();
    }

    // Clean up manager state only after module is disabled
    delete safeToModule[safe];
    // ... rest of cleanup
}
```

**Option C: Return status and handle in caller**
```solidity
function _disableModuleOnSafe(address safe, address module) internal returns (bool success) {
    try ISafe(safe).disableModule(address(0x1), module) {
        emit ModuleDisabledOnSafe(safe, module);
        return true;
    } catch {
        return false;
    }
}

function removeSafeFromNetwork(address safe) external {
    // ...
    bool disabled = _disableModuleOnSafe(safe, module);
    if (!disabled) {
        revert FailedToDisableModule();
    }
    // ... cleanup only if successful
}
```

**Option D: Emit failure event (MINIMUM)**
```solidity
event ModuleDisableFailed(address indexed safe, address indexed module, bytes errorData);

function _disableModuleOnSafe(address safe, address module) internal {
    try ISafe(safe).disableModule(address(0x1), module) {
        emit ModuleDisabledOnSafe(safe, module);
    } catch (bytes memory errorData) {
        emit ModuleDisableFailed(safe, module, errorData);
        // Still cleans up, but at least warns about inconsistency
    }
}
```

**Recommendation**: Use Option A or B for production. Option A is simplest and safest.

**Testing Required**:
- Test decline invitation when module is not enabled
- Test decline invitation when module is already disabled
- Test decline invitation when module is properly enabled
- Verify UI handles revert cases gracefully

**Related Files**:
- `src/SafeModuleManager.sol` - Contract fix
- `src/hooks/useDeclineInvitation.ts` - May need to handle revert
- `src/components/CompleteSetupModal.tsx` - UI error handling

---

## Other Tasks

(Add other TODO items here as needed)
