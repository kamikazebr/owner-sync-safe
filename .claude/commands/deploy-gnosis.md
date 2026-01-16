# Deploy to Gnosis Chain

Deploy and verify all contracts to Gnosis Chain with full automation.

## Your Task

Execute a complete deployment pipeline for Gnosis Chain:

### 1. Pre-Deployment Validation
- Run `forge test` to ensure all tests pass with 1M optimizer runs
- Run `forge build --sizes` to check contract sizes against EIP-170 limit (24,576 bytes)
- If any contract exceeds 24KB, alert the user and stop
- Verify that `PRIVATE_KEY`, `GNOSIS_RPC_URL`, and `GNOSISSCAN_API_KEY` env vars are set

### 2. Deploy Contracts
- Execute `make deploy-registry-gnosis` to deploy SyncGroupRegistry with templates
- Capture deployment transaction hashes and deployed addresses from output
- Wait for transaction confirmations (at least 5 blocks on Gnosis)

### 3. Verify Contracts on Gnosisscan
- Verify all deployed contracts (Registry proxy, Registry implementation, SafeModuleManager implementation, ManagedSafeModule implementation)
- Use `forge verify-contract` with appropriate constructor args
- Confirm all verifications succeeded on Gnosisscan

### 4. Update Configuration
- Read current `script/config/networks.json`
- Update the `gnosis` section with new deployment addresses and block numbers
- Use the Edit tool to update networks.json (preserve all other chains)
- Run `pnpm sync-configs` to propagate changes to subgraph configs

### 5. Validation & Reporting
- Use `cast` to verify deployed contracts match expected addresses
- Check contract versions using `cast call` to query version()
- Generate a deployment report with:
  - Deployment timestamp
  - Transaction hashes
  - Contract addresses
  - Verification status
  - Gas costs

### 6. Final Checks
- Verify subgraph configs were updated in `pkg/subgraph/configs/`
- Check that deployment block numbers are correct
- Confirm no uncommitted changes to networks.json (user will commit separately)

## Error Handling
- If tests fail, stop and show test output
- If contract size exceeds limit, suggest optimizations
- If deployment fails, show transaction error and revert reason
- If verification fails, provide manual verification instructions
- If env vars missing, show how to set them

## Output Format
Provide a concise summary at the end:
```
✅ Deployment Complete

Registry Proxy: 0x...
Registry Implementation: 0x...
Manager Implementation: 0x...
Module Implementation: 0x...

Verified on Gnosisscan: ✅
Updated networks.json: ✅
Synced subgraph configs: ✅

Total Gas Used: X.XX ETH
```

## Notes
- This command is FULLY AUTOMATED - no user confirmation required
- The user must manually commit networks.json changes when ready
- Deployment requires password for PRIVATE_KEY, so command will prompt user
- Always preserve existing networks.json data for other chains
