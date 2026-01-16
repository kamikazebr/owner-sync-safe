# Multi-Chain Deployment

Deploy and verify contracts across multiple EVM chains (Gnosis, Ethereum, Base) with parallel execution.

## Your Task

Execute coordinated multi-chain deployment with validation and synchronization.

### 1. Pre-Deployment Validation (All Chains)
Before deploying to any chain:

**Smart Contract Validation:**
- Run `forge test` to ensure all tests pass
- Run `forge build --sizes` to check contract sizes
- Verify all contracts within EIP-170 limit (24,576 bytes)
- Check that implementations are identical for all chains

**Environment Validation:**
Check that required env vars are set for ALL target chains:
- `PRIVATE_KEY` (same deployer for all chains)
- Chain-specific RPC URLs:
  - `GNOSIS_RPC_URL`
  - `ETHEREUM_RPC_URL` or `MAINNET_RPC_URL`
  - `BASE_RPC_URL`
- Chain-specific API keys for verification:
  - `GNOSISSCAN_API_KEY`
  - `ETHERSCAN_API_KEY`
  - `BASESCAN_API_KEY`

**Configuration Validation:**
- Read `script/config/networks.json`
- Verify structure supports all target chains
- Check that chain IDs are correct:
  - Gnosis: 100
  - Ethereum: 1
  - Base: 8453
- Ensure no existing deployment addresses (or ask user if overwriting)

### 2. Chain Selection
Ask user which chains to deploy to:
- [ ] Gnosis Chain (testnet or mainnet)
- [ ] Ethereum Mainnet
- [ ] Base
- [ ] All of the above

Confirm gas costs and estimated time:
- Deployment takes ~5 minutes per chain
- Gas costs vary by chain (estimate and show to user)
- Total estimated cost: X ETH across all chains

### 3. Sequential Deployment with Validation
Deploy to chains one at a time (not parallel) to avoid nonce issues:

**For Each Chain:**

**Step 1: Deploy Registry with Templates**
- Execute `make deploy-registry-<chain>` (e.g., `deploy-registry-gnosis`)
- Capture deployment addresses:
  - Registry proxy address
  - Registry implementation address
  - SafeModuleManager implementation address
  - ManagedSafeModule implementation address
- Capture deployment block number
- Wait for transaction confirmations (5+ blocks)

**Step 2: Verify Contracts**
- Verify all 4 contracts on chain's block explorer
- Use `forge verify-contract` with appropriate args
- Retry verification if it fails (explorers can be slow)
- Confirm verification succeeded via block explorer URL

**Step 3: Validate Deployment**
- Query Registry proxy to confirm it's working:
  ```bash
  cast call <registry> "managerImplementation()(address)" --rpc-url <rpc>
  cast call <registry> "moduleImplementation()(address)" --rpc-url <rpc>
  cast call <registry> "owner()(address)" --rpc-url <rpc>
  ```
- Verify returned addresses match expected values
- Check that proxy points to correct implementation

**Step 4: Record Results**
- Store deployment info for this chain:
  - All contract addresses
  - Block number
  - Transaction hashes
  - Gas costs
  - Verification URLs

### 4. Update Configuration (After All Deployments)
Once all chains are deployed:

**Update networks.json:**
- Read current `script/config/networks.json`
- For each deployed chain, update:
  ```json
  {
    "gnosis": {
      "PROXIES": {
        "SyncGroupRegistry": "0x..."
      },
      "IMPLEMENTATIONS": {
        "SyncGroupRegistry": "0x...",
        "SafeModuleManager": "0x...",
        "ManagedSafeModule": "0x..."
      },
      "METADATA": {
        "deployer": "0x...",
        "deploymentBlock": 12345678,
        "deploymentDate": "2025-10-28T14:30:00Z"
      }
    }
  }
  ```
- Preserve any existing data for other chains
- Use Edit tool to update networks.json

**Sync Subgraph Configs:**
- Run `pnpm sync-configs` to propagate changes
- Verify configs created for each chain in `pkg/subgraph/configs/`
- Check that startBlock matches deployment block
- Verify contract addresses match

### 5. Cross-Chain Validation
Verify consistency across all deployments:

**Implementation Addresses:**
- Compare implementation bytecode across chains
- Implementations should be identical (same bytecode hash)
- Proxy addresses will differ (different nonces/addresses)

**Ownership:**
- Verify owner() returns same deployer address on all chains
- Check that templates are configured identically

**Functionality:**
- Test a read operation on each chain (e.g., query implementations)
- Verify all contracts respond correctly

### 6. Generate Multi-Chain Report
Create comprehensive deployment report:

```
🌐 Multi-Chain Deployment Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Deployment Date: 2025-10-28T14:30:00Z
Deployer: 0x2F9e...
Total Chains: 3

┌─────────────────────────────────────────┐
│ Gnosis Chain (100)                      │
├─────────────────────────────────────────┤
│ Registry Proxy:     0xa74c...           │
│ Registry Impl:      0x...               │
│ Manager Impl:       0x...               │
│ Module Impl:        0x...               │
│ Block Number:       12345678            │
│ Gas Cost:           0.015 ETH           │
│ Verification:       ✅ All verified     │
│ Explorer:           gnosisscan.io       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Ethereum Mainnet (1)                    │
├─────────────────────────────────────────┤
│ Registry Proxy:     0x...               │
│ Registry Impl:      0x...               │
│ Manager Impl:       0x...               │
│ Module Impl:        0x...               │
│ Block Number:       19876543            │
│ Gas Cost:           0.145 ETH           │
│ Verification:       ✅ All verified     │
│ Explorer:           etherscan.io        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Base (8453)                             │
├─────────────────────────────────────────┤
│ Registry Proxy:     0x...               │
│ Registry Impl:      0x...               │
│ Manager Impl:       0x...               │
│ Module Impl:        0x...               │
│ Block Number:       8765432             │
│ Gas Cost:           0.008 ETH           │
│ Verification:       ✅ All verified     │
│ Explorer:           basescan.org        │
└─────────────────────────────────────────┘

Cross-Chain Validation:
  ✅ Implementation bytecode identical across all chains
  ✅ Ownership consistent (same deployer)
  ✅ Template configurations identical
  ✅ All contracts functional

Configuration Updated:
  ✅ networks.json updated for all chains
  ✅ Subgraph configs synced
  ✅ Deployment metadata recorded

Total Gas Cost: 0.168 ETH
Total Time: 15 minutes

✅ MULTI-CHAIN DEPLOYMENT SUCCESSFUL

Next Steps:
  • Commit networks.json changes
  • Deploy subgraphs for each chain
  • Update frontend to support all chains in network selector
  • Announce multi-chain availability
  • Monitor contracts on all chains for 24h
```

### 7. Post-Deployment Checklist
After successful deployment:

- [ ] Run `/health-check` to validate all chains
- [ ] Test creating a group on each chain
- [ ] Verify Safe module creation works on each chain
- [ ] Update documentation with new chain deployments
- [ ] Update frontend network config to include all chains
- [ ] Test wallet switching between chains
- [ ] Verify block explorers show correct contract verification

## Error Handling

**If deployment fails on any chain:**
- Continue with remaining chains (don't fail entire process)
- Record which chain failed and why
- Suggest retry for failed chain
- Don't update networks.json for failed chains

**If verification fails:**
- Deployment still succeeded, just verification failed
- Provide manual verification instructions
- Include constructor args and compiler settings
- User can verify manually later

**If cross-chain validation fails:**
- CRITICAL - implementations should be identical
- May indicate compiler settings differ
- Rebuild and redeploy to ensure consistency

**If env vars missing:**
- Stop before any deployment
- Show which env vars are missing for which chains
- Don't deploy to any chain if any are missing

## Notes
- This command is FULLY AUTOMATED once confirmed
- Deployments are sequential (not parallel) to avoid nonce issues
- User must manually commit networks.json after deployment
- Gas costs are estimates - actual may vary with network congestion
- Consider deploying to testnets first (Goerli, Base Goerli, Chiado)
- Keep deployment report for records and auditing
- Deployment to mainnet requires real ETH - confirm user has sufficient balance
