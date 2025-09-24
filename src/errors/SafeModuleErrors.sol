// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

/**
 * @notice Shared custom errors for Safe module contracts
 * @dev Using custom errors instead of require strings for gas efficiency
 */

// ============ COMMON ERRORS ============
error InvalidSafeAddress();
error SafeNotConfigured();
error SafeAlreadyConfigured();
error InvalidOwnerAddress();
error SameOwnerAddress();
error ThresholdTooLow();
error ThresholdTooHigh();
error OnlyModuleOwner();
error OnlySafeOwners();

// ============ OWNER MANAGEMENT ERRORS ============
error AlreadySafeOwner();
error NotSafeOwner();
error OldOwnerNotFound();
error NewOwnerAlreadyExists();
error InvalidNewOwnerAddress();

// ============ MANAGER ERRORS ============
error ModuleAlreadyExists();
error InvalidSafeContract();
error NoModuleForSafe();
error OnlyManagerOwner();
error InvalidModuleAddress();
error NoModuleFound();
error NoCalls();
error AlreadyHasModuleForSafe();

// ============ OPERATION ERRORS ============
error FailedToEnableModule();
error FailedToDisableModule();
error FailedToAddOwner(bytes data);
error SafeOperationFailed(string operation, bytes data);
error BatchOperationPartialFailure(uint256 successCount, uint256 totalCount);

// ============ STATUS ERRORS ============
error InvalidInstallationStatus(uint8 current, uint8 expected);

// ============ SYNC ERRORS ============
error SyncLimitTooHigh();
error SyncLimitTooLow();
error OperationRequiresFullSync();