# Lessons Learned - Development Sessions

## Session: 2026-01-26 - Subgraph Integration & Deployment Fixes

### Issue 1: Subgraph Endpoint `/version/latest` Not Working

**Problem:**
```
deployment `u29898/s108340/latest` does not exist
```

**Root Cause:**
- The Graph Studio's `/version/latest` alias only works if properly configured
- Our subgraph was deployed but the alias wasn't set up

**Solution:**
- Use specific version in URL: `/v0.1.1` instead of `/version/latest`
- Configure dual endpoints (dev/prod):
  - **Dev**: `https://api.studio.thegraph.com/query/29898/owner-sync-safe-gnosis/v0.1.1` (no auth)
  - **Prod**: `https://gateway.thegraph.com/api/subgraphs/id/GJ5xkXEcTc8k23CbqpE97BEChJseRziTYCXGBDxQdTYi` (requires API key)

**Files Changed:**
- `src/lib/subgraph-client.ts` - Added `SUBGRAPH_URLS_DEV` and `SUBGRAPH_URLS_PROD`

**Lesson:**
Always test subgraph queries with `curl` before assuming frontend works:
```bash
curl -X POST \
  'https://api.studio.thegraph.com/query/29898/owner-sync-safe-gnosis/v0.1.1' \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ _meta { block { number } } }"}'
```

---

### Issue 2: TypeScript Errors Not Caught Locally

**Problem:**
- Deployment failed on Vercel with TypeScript errors
- Local `pnpm dev` didn't catch these errors

**Errors:**
1. `Type '{ Authorization?: undefined; }' is not assignable to type 'Record<string, string>'`
2. `'timeout' does not exist in type 'RequestConfig'`

**Root Cause:**
- Next.js dev server (`pnpm dev`) doesn't run full TypeScript checks
- Only checks files as they're accessed/edited

**Solution:**
```typescript
// Before: implicit type caused error
const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};

// After: explicit type annotation
const headers: Record<string, string> = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
```

Also removed unsupported GraphQLClient options (`timeout`, custom `fetch`).

**Lesson:**
**ALWAYS run `pnpm type-check` before committing!**
```bash
pnpm type-check  # Run before git commit
pnpm build       # Even better - catches more issues
```

Add to pre-commit workflow:
```bash
# In .git/hooks/pre-commit or husky
pnpm type-check || exit 1
```

---

### Issue 3: Browser Cache After Config Changes

**Problem:**
- Updated subgraph URL in code
- Browser still showed old error about `/latest`
- Server logs showed compilation completed

**Root Cause:**
- Next.js aggressive caching in browser
- Compiled JavaScript bundles cached

**Solution:**
1. Clear Next.js cache: `rm -rf .next`
2. Restart dev server
3. **Hard refresh in browser**: `Ctrl + Shift + R` (or `Cmd + Shift + R` on Mac)
4. Or open incognito/private window

**Lesson:**
When making config/endpoint changes:
1. Stop dev server
2. `rm -rf .next`
3. Restart: `pnpm dev`
4. Hard refresh browser
5. Check browser DevTools Console for errors

---

### Issue 4: Testing Ngrok Deployment

**Problem:**
- Testing with wrong/old ngrok URL
- Confusion about which URL to use

**Solution:**
- Ngrok fixed URL stored in shell history: `https://outgoing-rationally-weevil.ngrok-free.app`
- Found via: `cat ~/.zsh_history | grep -a ngrok | tail -20`
- Start ngrok: `ngrok http 3001 --url https://outgoing-rationally-weevil.ngrok-free.app`

**Lesson:**
Document fixed URLs in project README or `.env.example`:
```bash
# Development (ngrok)
# ngrok http 3001 --url https://outgoing-rationally-weevil.ngrok-free.app
```

---

### Issue 5: Vercel Deployment URL Confusion

**Problem:**
- Checked wrong Vercel URL (generated deployment URL)
- Thought deployment failed when it succeeded

**URLs:**
- ❌ **Deployment URL**: `https://owner-sync-safe-8rqr8icgk-felipe-novaes-rochas-projects.vercel.app` (temporary)
- ✅ **Production URL**: `https://owner-sync-safe.vercel.app` (canonical)

**Solution:**
```bash
vercel project ls  # Shows production URLs
curl -I https://owner-sync-safe.vercel.app  # Test production
```

**Lesson:**
Always check the **production URL**, not deployment-specific URLs.
- Found via: `vercel project ls`
- Look for "Latest Production URL" column

---

### Issue 6: Module Not Showing in UI

**Problem:**
- Subgraph returned data via curl
- Frontend didn't show pending setup banner

**Root Cause:**
- `usePendingSetup` hook requires:
  1. `isSafeApp === true`
  2. `safeInfo` exists
  3. `publicClient` exists
- Must be accessed via Safe App, not directly

**Debugging:**
Check browser console for logs:
```
[usePendingSetup] Effect running: { isSafeApp: true, hasSafeInfo: true, ... }
[SubgraphClient] Creating client for chain 100 with URL: ...
```

**Lesson:**
Test Safe App features IN the Safe App context:
1. Access via https://app.safe.global
2. Settings → Apps → Add custom app
3. Enter ngrok or production URL
4. Check console for hook execution logs

---

### Issue 7: Production Manifest Name

**Problem:**
- Manifest showed "DEV - Owner Sync Safe" in production

**Solution:**
- Updated `public/manifest.json`:
  ```json
  {
    "name": "Owner Sync Safe",  // Removed "DEV - "
  ```

**Lesson:**
Keep separate manifests or use environment-based naming:
```typescript
// In code
const appName = process.env.NODE_ENV === 'production'
  ? 'Owner Sync Safe'
  : 'DEV - Owner Sync Safe';
```

---

## Best Practices Going Forward

### Before Every Commit
```bash
# 1. Type check
pnpm type-check

# 2. Build test (catches more issues)
pnpm build

# 3. Check for uncommitted secrets
git status

# 4. Review staged changes
git diff --staged
```

### Subgraph Changes
```bash
# 1. Test query with curl first
curl -X POST '<SUBGRAPH_URL>' -H 'Content-Type: application/json' \
  -d '{"query":"{ _meta { block { number } } }"}'

# 2. Update frontend code
# 3. Clear cache: rm -rf .next
# 4. Test in browser with DevTools Console open
```

### Deployment Checklist
- [ ] `pnpm type-check` passes
- [ ] `pnpm build` succeeds
- [ ] Test locally with `pnpm start`
- [ ] Remove "DEV" prefixes from production configs
- [ ] Verify environment variables are set in Vercel
- [ ] Check production URL after deploy (not deployment URL)

### Debugging Flow
1. **Backend fails?** → Check `curl` requests to APIs/subgraph
2. **Frontend fails?** → Check browser DevTools Console
3. **Build fails?** → Run `pnpm type-check` and `pnpm build` locally
4. **Hooks not running?** → Check if all dependencies are met (isSafeApp, etc.)

---

## Quick Reference

### Test Subgraph
```bash
# Gnosis Chain v0.1.1
curl -s -X POST \
  'https://api.studio.thegraph.com/query/29898/owner-sync-safe-gnosis/v0.1.1' \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ managedSafeModules(first: 5) { id safe } }"}'
```

### Clear Next.js Cache
```bash
rm -rf .next
pnpm dev
```

### Check Vercel Deployments
```bash
vercel ls              # List recent deployments
vercel project ls      # Show production URLs
vercel logs <url>      # Get deployment logs
```

### Ngrok Setup
```bash
# Kill existing process on port 3001
fuser -k 3001/tcp

# Start dev server
pnpm dev

# Start ngrok with fixed URL
ngrok http 3001 --url https://outgoing-rationally-weevil.ngrok-free.app
```

---

## Files to Watch

### Never Commit (Add to .gitignore if needed)
- `.next/` - Next.js build cache
- `pkg/subgraph/build/subgraph.yaml` - Generated by mustache
- `pkg/subgraph/subgraph.yaml` - Generated, not source

### Critical Files for Deployment
- `src/lib/subgraph-client.ts` - Subgraph endpoints
- `public/manifest.json` - Safe App metadata
- `.env.example` - Document all required env vars
- `vercel.json` - Vercel build config

---

## Common Commands

```bash
# Development
pnpm dev                    # Start dev server (port 3001)
pnpm type-check            # TypeScript validation
pnpm build                 # Production build test

# Deployment
git push origin main       # Triggers Vercel auto-deploy
vercel --prod              # Manual production deploy

# Subgraph
cd pkg/subgraph
pnpm build                 # Generate manifest, codegen, build
pnpm deploy:gnosis         # Deploy to Graph Studio

# Smart Contracts
task test                  # Run Foundry tests
task deploy:registry:gnosis  # Deploy to Gnosis Chain
```
