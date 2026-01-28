# Owner Sync Safe Subgraph

This subgraph indexes events from the Owner Sync Safe smart contracts on Gnosis Chain and other networks.

## Overview

The subgraph tracks:
- Sync group creation and management
- Safe module deployment and configuration
- Owner changes and synchronization events
- Cross-module operations
- Operation failures for debugging

## Entity Hierarchy

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

## Development

### Prerequisites

- Node.js 20.x
- pnpm 9.7.0+
- Graph CLI (`@graphprotocol/graph-cli`)

### Commands

```bash
# Generate manifest for Gnosis Chain
pnpm manifest:gnosis

# Generate manifest for Base
pnpm manifest:base

# Generate TypeScript types from schema
pnpm codegen

# Build subgraph
pnpm build

# Deploy to Graph Studio (Gnosis)
pnpm deploy:gnosis

# Deploy to Graph Studio (Base)
pnpm deploy:base
```

## Example Queries

See `queries.graphql` for a comprehensive list of example queries.

### Quick Start

1. Open Graph Studio Playground: https://thegraph.com/studio/subgraph/owner-sync-safe-gnosis/playground
2. Copy queries from `queries.graphql`
3. Adjust parameters (Safe addresses, group IDs, etc.)
4. Run queries

### Most Useful Queries

- **SubgraphMeta**: Check indexing status and current block
- **AllGroups**: List all sync groups
- **ModulesBySafe**: Find all modules for a specific Safe
- **RecentOwnerChanges**: See recent owner changes across all Safes
- **OperationFailures**: Debug failed operations

### Example: Check Subgraph Status

```graphql
query SubgraphMeta {
  _meta {
    block {
      number
      hash
      timestamp
    }
    deployment
    hasIndexingErrors
  }
}
```

### Example: Find Modules for a Safe

```graphql
query ModulesBySafe {
  managedSafeModules(
    where: { safe: "0x9a17de1f0cad0c592f656410997e4b685d339029" }
  ) {
    id
    safe
    isActive
    isConfigured
    threshold
    autoSyncEnabled
    manager {
      group {
        name
        groupId
      }
    }
    owners(where: { isActive: true }) {
      owner
    }
  }
}
```

## Endpoints

### Gnosis Chain

- **Studio (Dev)**: https://api.studio.thegraph.com/query/29898/owner-sync-safe-gnosis/v0.1.2
- **Production**: https://gateway.thegraph.com/api/subgraphs/id/GJ5xkXEcTc8k23CbqpE97BEChJseRziTYCXGBDxQdTYi (requires API key)

### Base

- **Studio (Dev)**: https://api.studio.thegraph.com/query/29898/owner-sync-safe-base/v0.1.2

## Configuration

Subgraph manifest is generated from `subgraph.template.yaml` using Mustache templates and deployment configurations in `src/scripts/config/`.

### Network Configurations

- `src/scripts/config/gnosis.json` - Gnosis Chain deployment
- `src/scripts/config/base.json` - Base deployment

Each configuration includes:
- Network name and chain ID
- Contract addresses (Registry, Manager, Module)
- Start block for indexing
- RPC endpoints

## Schema

See `src/schema.graphql` for the complete GraphQL schema definition.

Key entities:
- `SyncGroup` - A sync group with multiple Safes
- `SafeModuleManager` - Manager contract for a group
- `ManagedSafeModule` - Module contract for a Safe
- `ModuleOwner` - Current owner of a module
- `OwnerChange` - Historical owner change event
- `OwnerSyncEvent` - Owner synchronization event
- `CrossModuleCall` - Cross-module operation
- `ModuleOperationFailure` - Failed operation for debugging

## Deployment

### Deploy New Version

1. Update version in `package.json`
2. Build subgraph: `pnpm build`
3. Deploy to Studio: `pnpm deploy:gnosis`
4. Wait for indexing to complete (~30-60 minutes for full sync)
5. Test queries in Playground
6. Update frontend endpoint in `src/lib/subgraph-client.ts`

### Troubleshooting

**Subgraph stuck at block (reorg issue)**:
- Deploy new version with incremented version number
- The Graph will re-index from startBlock
- Monitor progress in Graph Studio UI

**Query returns empty results**:
- Check subgraph indexing status with `_meta` query
- Verify contract addresses in network config
- Check start block is before relevant events
- Review Graph Studio logs for indexing errors

## Version History

- **v0.1.2** - Re-deploy to fix chain reorganization issue at block 44377199
- **v0.1.1** - Initial production deployment
- **v0.1.0** - Initial development version

## License

AGPL-3.0
