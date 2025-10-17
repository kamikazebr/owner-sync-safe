import { BigInt, log } from "@graphprotocol/graph-ts";
import {
  SafeConfigured,
  SafeOwnerAdded,
  SafeOwnerRemoved,
  SafeOwnerReplaced,
  SafeThresholdChanged,
  OwnersSynced,
  SyncLimitReached,
  MaxSyncOwnersUpdated,
  AutoSyncStatusChanged,
  RequireFullSyncChanged,
} from "../../generated/templates/ManagedSafeModule/ManagedSafeModule";
import {
  ManagedSafeModule,
  ModuleOwner,
  OwnerChange,
  ThresholdChange,
  OwnerSyncEvent,
} from "../../generated/schema";

export function handleSafeConfigured(event: SafeConfigured): void {
  log.info("SafeConfigured: safe={}", [
    event.params.safe.toHexString(),
  ]);

  const moduleAddress = event.address.toHexString();
  const module = ManagedSafeModule.load(moduleAddress);
  if (module == null) {
    log.error("Module not found: {}", [moduleAddress]);
    return;
  }

  module.isConfigured = true;
  module.save();
}

export function handleSafeOwnerAdded(event: SafeOwnerAdded): void {
  log.info("SafeOwnerAdded: safe={}, newOwner={}", [
    event.params.safe.toHexString(),
    event.params.newOwner.toHexString(),
  ]);

  const moduleAddress = event.address.toHexString();
  const module = ManagedSafeModule.load(moduleAddress);
  if (module == null) {
    log.error("Module not found: {}", [moduleAddress]);
    return;
  }

  // Create or update ModuleOwner
  const moduleOwnerId = moduleAddress + "-" + event.params.newOwner.toHexString();
  let moduleOwner = ModuleOwner.load(moduleOwnerId);
  if (moduleOwner == null) {
    moduleOwner = new ModuleOwner(moduleOwnerId);
    moduleOwner.module = moduleAddress;
    moduleOwner.owner = event.params.newOwner;
    moduleOwner.addedAt = event.block.timestamp;
  }
  moduleOwner.isActive = true;
  moduleOwner.removedAt = null;
  moduleOwner.save();

  // Create OwnerChange event
  const changeId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const change = new OwnerChange(changeId);
  change.module = moduleAddress;
  change.safe = event.params.safe;
  change.changeType = "ADDED";
  change.newOwner = event.params.newOwner;
  change.oldOwner = null;
  change.threshold = null; // Can be set if we track it
  change.timestamp = event.block.timestamp;
  change.blockNumber = event.block.number;
  change.transactionHash = event.transaction.hash;
  change.save();
}

export function handleSafeOwnerRemoved(event: SafeOwnerRemoved): void {
  log.info("SafeOwnerRemoved: safe={}, removedOwner={}", [
    event.params.safe.toHexString(),
    event.params.removedOwner.toHexString(),
  ]);

  const moduleAddress = event.address.toHexString();
  const module = ManagedSafeModule.load(moduleAddress);
  if (module == null) {
    log.error("Module not found: {}", [moduleAddress]);
    return;
  }

  // Update ModuleOwner
  const moduleOwnerId = moduleAddress + "-" + event.params.removedOwner.toHexString();
  const moduleOwner = ModuleOwner.load(moduleOwnerId);
  if (moduleOwner != null) {
    moduleOwner.isActive = false;
    moduleOwner.removedAt = event.block.timestamp;
    moduleOwner.save();
  }

  // Create OwnerChange event
  const changeId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const change = new OwnerChange(changeId);
  change.module = moduleAddress;
  change.safe = event.params.safe;
  change.changeType = "REMOVED";
  change.oldOwner = event.params.removedOwner;
  change.newOwner = null;
  change.threshold = null;
  change.timestamp = event.block.timestamp;
  change.blockNumber = event.block.number;
  change.transactionHash = event.transaction.hash;
  change.save();
}

export function handleSafeOwnerReplaced(event: SafeOwnerReplaced): void {
  log.info("SafeOwnerReplaced: safe={}, oldOwner={}, newOwner={}", [
    event.params.safe.toHexString(),
    event.params.oldOwner.toHexString(),
    event.params.newOwner.toHexString(),
  ]);

  const moduleAddress = event.address.toHexString();
  const module = ManagedSafeModule.load(moduleAddress);
  if (module == null) {
    log.error("Module not found: {}", [moduleAddress]);
    return;
  }

  // Update old owner
  const oldModuleOwnerId = moduleAddress + "-" + event.params.oldOwner.toHexString();
  const oldModuleOwner = ModuleOwner.load(oldModuleOwnerId);
  if (oldModuleOwner != null) {
    oldModuleOwner.isActive = false;
    oldModuleOwner.removedAt = event.block.timestamp;
    oldModuleOwner.save();
  }

  // Create new owner
  const newModuleOwnerId = moduleAddress + "-" + event.params.newOwner.toHexString();
  let newModuleOwner = ModuleOwner.load(newModuleOwnerId);
  if (newModuleOwner == null) {
    newModuleOwner = new ModuleOwner(newModuleOwnerId);
    newModuleOwner.module = moduleAddress;
    newModuleOwner.owner = event.params.newOwner;
    newModuleOwner.addedAt = event.block.timestamp;
  }
  newModuleOwner.isActive = true;
  newModuleOwner.removedAt = null;
  newModuleOwner.save();

  // Create OwnerChange event
  const changeId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const change = new OwnerChange(changeId);
  change.module = moduleAddress;
  change.safe = event.params.safe;
  change.changeType = "REPLACED";
  change.oldOwner = event.params.oldOwner;
  change.newOwner = event.params.newOwner;
  change.threshold = null;
  change.timestamp = event.block.timestamp;
  change.blockNumber = event.block.number;
  change.transactionHash = event.transaction.hash;
  change.save();
}

export function handleSafeThresholdChanged(event: SafeThresholdChanged): void {
  log.info("SafeThresholdChanged: safe={}, newThreshold={}", [
    event.params.safe.toHexString(),
    event.params.newThreshold.toString(),
  ]);

  const moduleAddress = event.address.toHexString();
  const module = ManagedSafeModule.load(moduleAddress);
  if (module == null) {
    log.error("Module not found: {}", [moduleAddress]);
    return;
  }

  const oldThreshold = module.threshold;
  module.threshold = event.params.newThreshold;
  module.save();

  // Create ThresholdChange event
  const changeId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const change = new ThresholdChange(changeId);
  change.module = moduleAddress;
  change.safe = event.params.safe;
  change.oldThreshold = oldThreshold;
  change.newThreshold = event.params.newThreshold;
  change.timestamp = event.block.timestamp;
  change.blockNumber = event.block.number;
  change.transactionHash = event.transaction.hash;
  change.save();
}

export function handleOwnersSynced(event: OwnersSynced): void {
  log.info("OwnersSynced: count={}, isComplete={}", [
    event.params.count.toString(),
    event.params.isComplete ? "true" : "false",
  ]);

  const moduleAddress = event.address.toHexString();
  const module = ManagedSafeModule.load(moduleAddress);
  if (module == null) {
    log.error("Module not found: {}", [moduleAddress]);
    return;
  }

  // Create OwnerSyncEvent
  const syncId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const syncEvent = new OwnerSyncEvent(syncId);
  syncEvent.module = moduleAddress;
  syncEvent.ownerCount = event.params.count;
  syncEvent.isComplete = event.params.isComplete;
  syncEvent.timestamp = event.block.timestamp;
  syncEvent.blockNumber = event.block.number;
  syncEvent.transactionHash = event.transaction.hash;
  syncEvent.save();
}

export function handleSyncLimitReached(event: SyncLimitReached): void {
  log.info("SyncLimitReached: totalOwners={}, syncedOwners={}", [
    event.params.totalOwners.toString(),
    event.params.syncedOwners.toString(),
  ]);

  // This is informational - we track it via OwnersSynced with isComplete=false
}

export function handleMaxSyncOwnersUpdated(event: MaxSyncOwnersUpdated): void {
  log.info("MaxSyncOwnersUpdated: oldLimit={}, newLimit={}", [
    event.params.oldLimit.toString(),
    event.params.newLimit.toString(),
  ]);

  const moduleAddress = event.address.toHexString();
  const module = ManagedSafeModule.load(moduleAddress);
  if (module == null) {
    log.error("Module not found: {}", [moduleAddress]);
    return;
  }

  module.maxSyncOwners = event.params.newLimit;
  module.save();
}

export function handleAutoSyncStatusChanged(event: AutoSyncStatusChanged): void {
  log.info("AutoSyncStatusChanged: enabled={}", [
    event.params.enabled ? "true" : "false",
  ]);

  const moduleAddress = event.address.toHexString();
  const module = ManagedSafeModule.load(moduleAddress);
  if (module == null) {
    log.error("Module not found: {}", [moduleAddress]);
    return;
  }

  module.autoSyncEnabled = event.params.enabled;
  module.save();
}

export function handleRequireFullSyncChanged(event: RequireFullSyncChanged): void {
  log.info("RequireFullSyncChanged: enabled={}", [
    event.params.enabled ? "true" : "false",
  ]);

  const moduleAddress = event.address.toHexString();
  const module = ManagedSafeModule.load(moduleAddress);
  if (module == null) {
    log.error("Module not found: {}", [moduleAddress]);
    return;
  }

  module.requireFullSync = event.params.enabled;
  module.save();
}
