import { BigInt, log, dataSource, DataSourceContext } from "@graphprotocol/graph-ts";
import {
  ModuleCreated,
  SafeRemovedFromNetwork,
  CrossModuleCall,
  SafeToModuleSet,
  ModuleDisabledOnSafe,
  ModuleOperationFailed,
} from "../../generated/templates/SafeModuleManager/SafeModuleManager";
import {
  SafeModuleManager,
  ManagedSafeModule,
  CrossModuleCall as CrossModuleCallEntity,
  SafeNetworkRemoval,
  ModuleOperationFailure,
} from "../../generated/schema";
import {
  ManagedSafeModule as ManagedSafeModuleTemplate,
  Safe as SafeTemplate
} from "../../generated/templates";

export function handleModuleCreated(event: ModuleCreated): void {
  log.info("ModuleCreated: safe={}, module={}", [
    event.params.safe.toHexString(),
    event.params.module.toHexString(),
  ]);

  const managerAddress = event.address.toHexString();
  const moduleAddress = event.params.module.toHexString();

  // Get manager
  let manager = SafeModuleManager.load(managerAddress);
  if (manager == null) {
    manager = new SafeModuleManager(managerAddress);
    manager.group = null;
    manager.moduleTemplate = event.params.module; // Will be set properly later
    manager.totalModules = BigInt.fromI32(0);
  }

  // Create module entity
  const module = new ManagedSafeModule(moduleAddress);
  module.manager = managerAddress;
  module.safe = event.params.safe;
  module.createdAt = event.block.timestamp;
  module.isActive = false; // Will be set to true when Safe enables the module
  module.isConfigured = false;
  module.threshold = null;
  module.autoSyncEnabled = true; // Default value
  module.requireFullSync = false; // Default value
  module.maxSyncOwners = BigInt.fromI32(10); // Default value
  module.save();

  // Update manager
  manager.totalModules = manager.totalModules.plus(BigInt.fromI32(1));
  manager.save();

  // Create template data source for this module
  // This will start indexing all events from this ManagedSafeModule
  const context = new DataSourceContext();
  context.setString("managerId", managerAddress);
  context.setBytes("safe", event.params.safe);
  ManagedSafeModuleTemplate.createWithContext(event.params.module, context);

  // Create template data source for the Safe contract
  // This will track EnabledModule/DisabledModule events from the Safe
  const safeContext = new DataSourceContext();
  safeContext.setBytes("module", event.params.module);
  SafeTemplate.createWithContext(event.params.safe, safeContext);

  log.info("Created data sources for module and Safe: module={}, safe={}", [
    moduleAddress,
    event.params.safe.toHexString(),
  ]);
}

export function handleSafeRemovedFromNetwork(event: SafeRemovedFromNetwork): void {
  log.info("SafeRemovedFromNetwork: safe={}", [
    event.params.safe.toHexString(),
  ]);

  // Find module for this safe
  const managerAddress = event.address.toHexString();
  const manager = SafeModuleManager.load(managerAddress);
  if (manager == null) {
    log.error("Manager not found: {}", [managerAddress]);
    return;
  }

  // Create removal event
  const removalId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const removal = new SafeNetworkRemoval(removalId);
  removal.safe = event.params.safe;
  removal.module = null; // We could look it up, but not critical
  removal.timestamp = event.block.timestamp;
  removal.blockNumber = event.block.number;
  removal.transactionHash = event.transaction.hash;
  removal.save();

  // Note: Module entity's isActive will be updated by handleModuleDisabledOnSafe
}

export function handleCrossModuleCall(event: CrossModuleCall): void {
  log.info("CrossModuleCall: caller={}, modules count={}", [
    event.params.caller.toHexString(),
    event.params.modules.length.toString(),
  ]);

  const callId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const call = new CrossModuleCallEntity(callId);
  call.manager = event.address.toHexString();
  call.caller = event.params.caller;
  call.modulesCount = BigInt.fromI32(event.params.modules.length);
  call.timestamp = event.block.timestamp;
  call.blockNumber = event.block.number;
  call.transactionHash = event.transaction.hash;
  call.save();
}

export function handleSafeToModuleSet(event: SafeToModuleSet): void {
  log.info("SafeToModuleSet: safe={}, module={}", [
    event.params.safe.toHexString(),
    event.params.module.toHexString(),
  ]);

  // If module is address(0), mark as inactive
  if (event.params.module.toHexString() == "0x0000000000000000000000000000000000000000") {
    // Find existing module for this safe and mark inactive
    // This would require iterating or keeping a safe->module mapping
    // For now, we'll handle this via ModuleDisabledOnSafe event
    return;
  }

  // Update or create module
  const moduleAddress = event.params.module.toHexString();
  let module = ManagedSafeModule.load(moduleAddress);
  if (module != null) {
    module.isActive = true;
    module.save();
  }
}

export function handleModuleDisabledOnSafe(event: ModuleDisabledOnSafe): void {
  log.info("ModuleDisabledOnSafe: safe={}, module={}", [
    event.params.safe.toHexString(),
    event.params.module.toHexString(),
  ]);

  const moduleAddress = event.params.module.toHexString();
  const module = ManagedSafeModule.load(moduleAddress);
  if (module != null) {
    module.isActive = false;
    module.save();
  }
}

export function handleModuleOperationFailed(event: ModuleOperationFailed): void {
  log.warning("ModuleOperationFailed: module={}, safe={}, operation={}", [
    event.params.module.toHexString(),
    event.params.safe.toHexString(),
    event.params.operation,
  ]);

  const failureId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const failure = new ModuleOperationFailure(failureId);

  const moduleAddress = event.params.module.toHexString();
  const module = ManagedSafeModule.load(moduleAddress);
  if (module == null) {
    log.error("Module not found for operation failure: {}", [moduleAddress]);
    return;
  }

  failure.module = moduleAddress;
  failure.manager = event.address.toHexString();
  failure.safe = event.params.safe;
  failure.operation = event.params.operation;
  failure.errorData = event.params.errorData;
  failure.timestamp = event.block.timestamp;
  failure.blockNumber = event.block.number;
  failure.transactionHash = event.transaction.hash;
  failure.save();

  log.info("ModuleOperationFailure recorded: id={}, module={}, operation={}", [
    failureId,
    moduleAddress,
    event.params.operation,
  ]);
}
