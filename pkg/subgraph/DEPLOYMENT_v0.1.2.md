# Subgraph v0.1.2 Deployment Guide

## Overview

This deployment fixes the chain reorganization issue at block 44377199 by deploying a fresh subgraph version that will re-index from the start block.

## What Changed

### 1. Version Bump
- `package.json`: Updated version from `0.1.1` to `0.1.2`
- Deploy scripts updated to use `--version-label v0.1.2`

### 2. New Files
- `queries.graphql`: 13 example queries for Graph Studio Playground
- `README.md`: Complete documentation with query examples
- `DEPLOYMENT_v0.1.2.md`: This deployment guide

### 3. Frontend Update
- `src/lib/subgraph-client.ts`: Updated endpoints to v0.1.2

## Pre-Deployment Checklist

- [x] Version bumped to 0.1.2 in `package.json`
- [x] Deploy scripts updated with new version label
- [x] Subgraph rebuilt successfully (`pnpm build`)
- [x] Example queries created in `queries.graphql`
- [x] README.md created with documentation
- [x] Frontend updated to use v0.1.2 endpoint
- [x] Type checking passes (`pnpm type-check`)

## Deployment Steps

### 1. Authenticate with Graph Studio

If not already authenticated:

```bash
cd pkg/subgraph
graph auth --studio YOUR_DEPLOY_KEY
```

**Get your deploy key from**: https://thegraph.com/studio/subgraph/owner-sync-safe-gnosis/

### 2. Deploy to Graph Studio

```bash
cd pkg/subgraph
pnpm deploy:gnosis
```

This will:
- Upload the built subgraph to Graph Studio
- Create a new version labeled `v0.1.2`
- Start indexing from block 42680229

### 3. Monitor Deployment

Go to Graph Studio: https://thegraph.com/studio/subgraph/owner-sync-safe-gnosis/

**Expected timeline:**
- **0-2 min**: Deployment uploaded and validated
- **2-5 min**: Indexing starts, first blocks processed
- **5-30 min**: Indexing progresses through historical blocks
- **30-60 min**: Reaches recent blocks (44377199+)
- **60+ min**: Fully synced, new events indexed

### 4. Verify Indexing Progress

Copy this query into Graph Studio Playground:

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

**Expected results:**
- `block.number`: Should be increasing (starts at 42680229)
- `hasIndexingErrors`: Should be `false`
- `deployment`: Should show new deployment ID

### 5. Test Example Queries

Once indexing reaches block 44379113+ (where new events are), test these queries:

**Check new modules were indexed:**

```graphql
query NewModules {
  managedSafeModules(
    orderBy: createdAt
    orderDirection: desc
    first: 5
  ) {
    id
    safe
    createdAt
    manager {
      group {
        name
      }
    }
  }
}
```

**Check all groups:**

```graphql
query AllGroups {
  syncGroups(first: 10, orderBy: createdAt, orderDirection: desc) {
    id
    groupId
    name
    owner
    active
    createdAt
    manager {
      id
      totalModules
    }
  }
}
```

### 6. Add Example Queries to Studio

Manually copy queries from `queries.graphql` into Graph Studio Playground:

1. Open: https://thegraph.com/studio/subgraph/owner-sync-safe-gnosis/playground
2. Open `queries.graphql` in your editor
3. Copy individual queries (e.g., "SubgraphMeta", "AllGroups", etc.)
4. Paste into Playground
5. Test each query
6. Studio will save them in recent queries

**Note**: Graph Studio doesn't support bulk import of queries - this is a manual step.

### 7. Update Production

Once v0.1.2 is fully synced and tested:

1. **Publish to Production Gateway** (optional, requires GRT stake):
   - Go to Studio UI → Publish tab
   - Follow instructions to publish to decentralized network
   - Update `SUBGRAPH_URLS_PROD` in frontend when published

2. **Frontend is already updated**:
   - `src/lib/subgraph-client.ts` now uses v0.1.2
   - No additional changes needed
   - Users will automatically use new endpoint

## Verification Checklist

After deployment completes:

- [ ] Subgraph indexing reached block 44379113+
- [ ] No indexing errors in Graph Studio logs
- [ ] `_meta` query returns current block
- [ ] `AllGroups` query returns expected groups
- [ ] `managedSafeModules` includes new modules from blocks 44379113 and 44379123
- [ ] Example queries work in Playground
- [ ] Frontend loads data correctly from new endpoint

## Troubleshooting

### Indexing Stuck

If indexing gets stuck again:

1. Check Graph Studio logs for errors
2. Verify network RPC is responding
3. If another reorg, wait for chain to stabilize
4. May need to bump to v0.1.3 and re-deploy

### Queries Return Empty

If queries return empty results:

1. Check `_meta` query - is indexing still in progress?
2. Verify block number has reached relevant events
3. Check Graph Studio logs for indexing errors
4. Verify contract addresses in `configs/gnosis.json`

### Frontend Not Loading Data

If frontend doesn't show data after deployment:

1. Clear browser cache and hard refresh
2. Check browser console for errors
3. Verify endpoint URL is correct in `subgraph-client.ts`
4. Test subgraph directly with curl:

```bash
curl -X POST 'https://api.studio.thegraph.com/query/29898/owner-sync-safe-gnosis/v0.1.2' \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ _meta { block { number } } }"}'
```

## Rollback Plan

If v0.1.2 has critical issues:

1. Frontend can temporarily use v0.1.1:
   ```typescript
   // In src/lib/subgraph-client.ts, change back to:
   100: 'https://api.studio.thegraph.com/query/29898/owner-sync-safe-gnosis/v0.1.1',
   ```

2. Fix issues and deploy v0.1.3

3. Graph Studio keeps all versions - can switch between them

## Expected Results

### Before Deployment (v0.1.1)
- ❌ Stuck at block 44377199
- ❌ Missing 2 new `ModuleCreated` events
- ❌ "Block not found" errors in logs

### After Deployment (v0.1.2)
- ✅ Indexing from block 42680229
- ✅ No reorg issues (fresh start)
- ✅ All events indexed including new ones
- ✅ Clean indexing logs
- ✅ Example queries available

## Timeline Summary

| Time | Status | Block Range |
|------|--------|-------------|
| T+0 | Deploy initiated | - |
| T+2min | Indexing starts | 42680229 |
| T+10min | Early progress | ~42700000 |
| T+30min | Mid progress | ~43500000 |
| T+60min | Reaching target | ~44379113+ |
| T+60min+ | Fully synced | Latest block |

## Post-Deployment Tasks

- [ ] Update this file with actual deployment results
- [ ] Document any issues encountered
- [ ] Update main README.md if needed
- [ ] Commit changes with message: "chore: deploy subgraph v0.1.2 to fix reorg issue"

## Related Files

- `package.json` - Version and deploy scripts
- `queries.graphql` - Example queries
- `README.md` - Complete documentation
- `src/lib/subgraph-client.ts` - Frontend endpoint config
- `configs/gnosis.json` - Network configuration

## Notes

- **Chain reorg explained**: Block 44377199 had hash `0xe8a2...5189` when first indexed, but chain reorganized and now has hash `0x8908...4cb8`. The Graph's RPC couldn't find the old hash, causing indexing to fail.

- **Fresh deployment**: By deploying a new version, The Graph will re-index from scratch using current chain state, avoiding the reorg issue entirely.

- **Data consistency**: All historical data will be re-indexed exactly the same (blockchain is immutable), plus the 2 new events that occurred after the original indexing stopped.

- **No data loss**: Previous versions (v0.1.1) remain available in Graph Studio for comparison.

## Contact

If you encounter issues during deployment:
- Check Graph Studio logs first
- Review troubleshooting section above
- Check The Graph Discord for RPC/indexing status
- Create issue in project repo with logs
