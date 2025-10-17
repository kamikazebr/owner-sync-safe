import { log, dataSource } from "@graphprotocol/graph-ts";
import { EnabledModule, DisabledModule } from "../../generated/templates/Safe/Safe";
import { ManagedSafeModule } from "../../generated/schema";

export function handleEnabledModule(event: EnabledModule): void {
  const moduleAddress = event.params.module.toHexString();
  const safeAddress = event.address.toHexString();

  log.info("Safe EnabledModule: safe={}, module={}", [
    safeAddress,
    moduleAddress,
  ]);

  // Load the module entity
  const module = ManagedSafeModule.load(moduleAddress);
  if (module == null) {
    log.warning("Module not found for EnabledModule event: module={}, safe={}", [
      moduleAddress,
      safeAddress,
    ]);
    return;
  }

  // Verify this is the correct Safe for this module
  if (module.safe.toHexString().toLowerCase() !== safeAddress.toLowerCase()) {
    log.warning("EnabledModule event from wrong Safe: expected={}, got={}, module={}", [
      module.safe.toHexString(),
      safeAddress,
      moduleAddress,
    ]);
    return;
  }

  // Update module to active
  module.isActive = true;
  module.save();

  log.info("Module marked as active: module={}, safe={}", [
    moduleAddress,
    safeAddress,
  ]);
}

export function handleDisabledModule(event: DisabledModule): void {
  const moduleAddress = event.params.module.toHexString();
  const safeAddress = event.address.toHexString();

  log.info("Safe DisabledModule: safe={}, module={}", [
    safeAddress,
    moduleAddress,
  ]);

  // Load the module entity
  const module = ManagedSafeModule.load(moduleAddress);
  if (module == null) {
    log.warning("Module not found for DisabledModule event: module={}, safe={}", [
      moduleAddress,
      safeAddress,
    ]);
    return;
  }

  // Verify this is the correct Safe for this module
  if (module.safe.toHexString().toLowerCase() !== safeAddress.toLowerCase()) {
    log.warning("DisabledModule event from wrong Safe: expected={}, got={}, module={}", [
      module.safe.toHexString(),
      safeAddress,
      moduleAddress,
    ]);
    return;
  }

  // Update module to inactive
  module.isActive = false;
  module.save();

  log.info("Module marked as inactive: module={}, safe={}", [
    moduleAddress,
    safeAddress,
  ]);
}
