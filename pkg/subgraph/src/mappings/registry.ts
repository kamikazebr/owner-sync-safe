import { BigInt, log, dataSource, DataSourceContext } from "@graphprotocol/graph-ts";
import {
  GroupCreated,
  GroupUpdated,
  GroupDeactivated,
  SafeAddedToGroup,
  SafeRemovedFromGroup,
} from "../../generated/SyncGroupRegistry/SyncGroupRegistry";
import {
  SyncGroupRegistry,
  SyncGroup,
  SafeModuleManager,
  GroupSafe,
} from "../../generated/schema";
import { SafeModuleManager as SafeModuleManagerTemplate } from "../../generated/templates";

export function handleGroupCreated(event: GroupCreated): void {
  log.info("GroupCreated: groupId={}, owner={}, manager={}, name={}", [
    event.params.groupId.toString(),
    event.params.owner.toHexString(),
    event.params.manager.toHexString(),
    event.params.name,
  ]);

  // Get or create registry
  const registryAddress = event.address.toHexString();
  let registry = SyncGroupRegistry.load(registryAddress);
  if (registry == null) {
    registry = new SyncGroupRegistry(registryAddress);
    registry.totalGroups = BigInt.fromI32(0);
    registry.save();
  }

  // Create group entity
  const groupId = event.params.groupId.toString();
  const group = new SyncGroup(groupId);
  group.registry = registryAddress;
  group.groupId = event.params.groupId;
  group.manager = event.params.manager.toHexString();
  group.template = event.params.manager; // Template address from event
  group.owner = event.params.owner;
  group.name = event.params.name;
  group.active = true;
  group.createdAt = event.block.timestamp;
  group.save();

  // Create manager entity
  const managerId = event.params.manager.toHexString();
  let manager = SafeModuleManager.load(managerId);
  if (manager == null) {
    manager = new SafeModuleManager(managerId);
    manager.group = groupId;
    manager.moduleTemplate = event.params.manager; // Will be updated when we know the actual template
    manager.totalModules = BigInt.fromI32(0);
    manager.save();
  }

  // Create template data source for this manager
  // This will start indexing all events from this SafeModuleManager
  const context = new DataSourceContext();
  context.setString("groupId", groupId);
  SafeModuleManagerTemplate.createWithContext(event.params.manager, context);

  // Update registry count
  registry.totalGroups = registry.totalGroups.plus(BigInt.fromI32(1));
  registry.save();
}

export function handleGroupUpdated(event: GroupUpdated): void {
  log.info("GroupUpdated: groupId={}, name={}", [
    event.params.groupId.toString(),
    event.params.name,
  ]);

  const groupId = event.params.groupId.toString();
  const group = SyncGroup.load(groupId);
  if (group == null) {
    log.error("Group not found: {}", [groupId]);
    return;
  }

  group.name = event.params.name;
  group.updatedAt = event.block.timestamp;
  group.save();
}

export function handleGroupDeactivated(event: GroupDeactivated): void {
  log.info("GroupDeactivated: groupId={}", [event.params.groupId.toString()]);

  const groupId = event.params.groupId.toString();
  const group = SyncGroup.load(groupId);
  if (group == null) {
    log.error("Group not found: {}", [groupId]);
    return;
  }

  group.active = false;
  group.updatedAt = event.block.timestamp;
  group.save();
}

export function handleSafeAddedToGroup(event: SafeAddedToGroup): void {
  log.info("SafeAddedToGroup: groupId={}, safe={}, module={}", [
    event.params.groupId.toString(),
    event.params.safe.toHexString(),
    event.params.module.toHexString(),
  ]);

  const groupSafeId = event.params.groupId.toString() + "-" + event.params.safe.toHexString();
  let groupSafe = GroupSafe.load(groupSafeId);

  if (groupSafe == null) {
    groupSafe = new GroupSafe(groupSafeId);
    groupSafe.group = event.params.groupId.toString();
    groupSafe.safe = event.params.safe;
    groupSafe.module = event.params.module.toHexString();
    groupSafe.addedAt = event.block.timestamp;
  }

  groupSafe.isActive = true;
  groupSafe.removedAt = null;
  groupSafe.save();
}

export function handleSafeRemovedFromGroup(event: SafeRemovedFromGroup): void {
  log.info("SafeRemovedFromGroup: groupId={}, safe={}", [
    event.params.groupId.toString(),
    event.params.safe.toHexString(),
  ]);

  const groupSafeId = event.params.groupId.toString() + "-" + event.params.safe.toHexString();
  const groupSafe = GroupSafe.load(groupSafeId);

  if (groupSafe == null) {
    log.warning("GroupSafe not found for removal: {}", [groupSafeId]);
    return;
  }

  groupSafe.isActive = false;
  groupSafe.removedAt = event.block.timestamp;
  groupSafe.save();
}
