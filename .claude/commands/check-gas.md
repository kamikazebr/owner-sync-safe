# Check Gas & Contract Sizes

Analyze contract sizes and gas costs to ensure contracts fit within EIP-170 limit and optimize gas usage.

## Your Task

Perform comprehensive gas and size analysis:

### 1. Contract Size Analysis
- Run `forge build --sizes` to get contract sizes
- Identify contracts approaching or exceeding the EIP-170 limit (24,576 bytes / 24KB)
- Calculate headroom for each contract (24,576 - actual_size)
- Flag contracts with <2KB headroom as "NEAR LIMIT"
- Flag contracts exceeding limit as "EXCEEDS LIMIT"

### 2. Gas Snapshot Generation
- Check if `.gas-snapshot` file exists
- If exists, copy it to `.gas-snapshot.old` for comparison
- Run `forge snapshot` to generate new snapshot
- Compare new vs old snapshots to detect changes

### 3. Gas Cost Analysis
- Parse `.gas-snapshot` file
- Identify the top 10 most expensive functions by gas cost
- Calculate average gas cost per contract
- Identify functions with gas cost >1M (very expensive)

### 4. Historical Comparison (if .gas-snapshot.old exists)
- Compare gas costs between old and new snapshots
- Calculate percentage change for each function
- Identify functions with >10% gas increase (regressions)
- Identify functions with >10% gas decrease (optimizations)
- Show top 5 biggest gas changes (both increases and decreases)

### 5. Optimization Recommendations
Based on analysis, suggest optimizations for:
- **Contracts near size limit**: Suggest removing unused code, using libraries, smaller error messages
- **High gas functions**: Suggest storage optimization, loop unrolling, batching
- **Gas regressions**: Alert user to investigate why gas increased

### 6. Storage Layout Check (Optional)
- For UUPS contracts (Registry, Manager, Module), check storage layout
- Run `forge inspect <contract> storage --pretty` for each
- Verify no storage layout changes that could break upgrades
- Show storage slots used vs available

## Output Format
```
📊 Contract Size Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contract                     Size      Headroom   Status
SyncGroupRegistry           XX,XXX    X,XXX      ✅ OK
SafeModuleManager           XX,XXX    X,XXX      ⚠️ NEAR LIMIT
ManagedSafeModule           XX,XXX    X,XXX      ✅ OK

⛽ Gas Cost Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Top 5 Most Expensive Functions:
1. SafeModuleManager::syncOwnersAcrossNetwork - XXX,XXX gas
2. ManagedSafeModule::swapOwner - XXX,XXX gas
3. ...

📈 Gas Changes vs Previous Snapshot
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Function                              Old Gas   New Gas   Change
SafeModuleManager::addSafeToNetwork   XXX,XXX   XXX,XXX   +5.2% ⚠️
ManagedSafeModule::removeOwner        XXX,XXX   XXX,XXX   -3.1% ✅

💡 Optimization Recommendations
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• SafeModuleManager is 1.2KB from limit - consider removing batch operations
• syncOwnersAcrossNetwork has high gas cost - consider batching in smaller chunks
• Gas regression detected in addSafeToNetwork - investigate recent changes
```

## Error Handling
- If forge build fails, show compilation errors
- If forge snapshot fails, show detailed error
- If no previous snapshot exists, skip comparison section

## Notes
- This command is READ-ONLY - no modifications to contracts
- Safe to run frequently during development
- Should be run before every deployment
- Gas snapshots are gitignored but useful for local comparison
