# Contract Upgrade Orchestration

Orchestrate UUPS contract upgrades across 5 different upgrade scenarios per `docs/UPGRADE_PROCESS.md`.

## Your Task

Provide interactive upgrade orchestration with validation and safety checks.

### 1. Upgrade Scenario Selection
Present the user with 5 upgrade scenarios:

**1. Upgrade Registry Contract**
   - Scope: Registry proxy only
   - Impact: Future groups will use new Registry logic
   - Command: `make upgrade-registry-gnosis`
   - Who can execute: Registry owner (deployer)

**2. Update Manager Implementation Template**
   - Scope: Registry's stored Manager template address
   - Impact: Future groups created will use new Manager implementation
   - Command: `make update-registry-manager-template-gnosis`
   - Who can execute: Registry owner (deployer)

**3. Upgrade Specific Group's Manager**
   - Scope: One group's Manager proxy
   - Impact: That group only, all Safes in group
   - Command: `make upgrade-manager-gnosis GROUP=<address>`
   - Who can execute: Group's governance Safe (multisig)

**4. Update Module Template in Manager**
   - Scope: Manager's stored Module template address
   - Impact: Future Safes joining this group will use new Module
   - Command: `make update-manager-module-template-gnosis MANAGER=<address>`
   - Who can execute: Group's governance Safe (multisig)

**5. Upgrade Individual Safe's Module**
   - Scope: One Safe's Module proxy
   - Impact: That specific Safe only
   - Command: `make upgrade-module-gnosis MODULE=<address>`
   - Who can execute: Safe owners (multisig)

Ask user which scenario they want to execute.

### 2. Pre-Upgrade Validation

**For ALL scenarios:**
- Run `forge test` to ensure new implementation passes all tests
- Run `forge build --sizes` to check new contract sizes
- Verify caller has proper ownership/permissions
- Check that required env vars are set (PRIVATE_KEY, GNOSIS_RPC_URL)

**For proxy upgrades (scenarios 1, 3, 5):**
- Check storage layout compatibility:
  ```bash
  forge inspect <OldContract> storage --pretty > old-storage.txt
  forge inspect <NewContract> storage --pretty > new-storage.txt
  diff old-storage.txt new-storage.txt
  ```
- If storage layout changed: CRITICAL ERROR - will break upgrades
- If new storage slots added at end: OK
- If existing slots modified: DANGEROUS - warn user

**For template updates (scenarios 2, 4):**
- Verify new implementation contract is already deployed
- Check implementation address is valid contract (not EOA)
- Verify implementation is not 0x0

### 3. Execute Upgrade
Based on selected scenario:

**Scenario 1 & 3 & 5 (Proxy Upgrades):**
- Execute appropriate Makefile target
- Wait for transaction confirmation
- Verify upgrade succeeded by querying implementation()
- Check version() increased (if version management implemented)

**Scenario 2 & 4 (Template Updates):**
- Execute appropriate Makefile target
- Wait for transaction confirmation
- Verify template address updated in Registry/Manager

### 4. Post-Upgrade Validation
- Query the upgraded contract to verify it's using new implementation
- Run a simple read operation to ensure contract is functional
- Check contract version matches expected version
- For Manager upgrades: Query a sample Safe to verify connectivity
- For Module upgrades: Check Safe still recognizes module as enabled

### 5. Update Configuration
- Read `script/config/networks.json`
- Update implementation addresses for upgraded contracts
- Add upgrade timestamp and version notes
- Preserve all other configuration
- Run `pnpm sync-configs` if subgraph is affected

### 6. Generate Upgrade Report
Create detailed report with:
- Upgrade scenario executed
- Contracts affected (addresses)
- Old implementation → New implementation
- Transaction hash
- Gas cost
- Upgrade timestamp
- Who executed (address)
- Storage layout changes (if any)
- Version number changes

### 7. Documentation Update
- Remind user to update `docs/UPGRADE_PROCESS.md` with:
  - New version number
  - Upgrade date
  - What changed
  - Any migration notes

## Safety Checklist
Before executing any upgrade:
- ✅ Tests pass with new implementation
- ✅ Contract size within limits
- ✅ Storage layout compatible
- ✅ Correct permissions/ownership
- ✅ Implementation address valid
- ✅ Backup of current state (contract addresses recorded)

## Output Format
```
🔄 Contract Upgrade Orchestration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Selected Scenario: [3] Upgrade Specific Group's Manager

Pre-Upgrade Validation:
  ✅ All tests pass (15/15)
  ✅ Contract size: 21,543 bytes (3KB headroom)
  ✅ Storage layout: Compatible (no changes to existing slots)
  ✅ Caller permissions: Verified (governance Safe owner)
  ✅ Environment: Ready

Executing Upgrade:
  → Deploying new implementation...
  → Transaction: 0xabc...123
  → Calling upgradeTo(0x...)...
  → Transaction: 0xdef...456
  ✅ Upgrade completed successfully

Post-Upgrade Validation:
  ✅ Implementation updated: 0xOLD... → 0xNEW...
  ✅ Contract functional (test read successful)
  ✅ Version updated: v1.0.0 → v1.1.0
  ✅ Safe connectivity verified

Configuration Updated:
  ✅ networks.json updated
  ✅ Subgraph configs synced
  ✅ Timestamp recorded: 2025-10-28T14:30:00Z

📊 Upgrade Report:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Scenario: Upgrade Specific Group's Manager
Manager: 0x...
Old Implementation: 0x...
New Implementation: 0x...
Transaction Hash: 0x...
Gas Cost: 0.0015 ETH
Executed By: 0x... (governance Safe)
Storage Changes: None (compatible)
Version: v1.0.0 → v1.1.0

✅ UPGRADE SUCCESSFUL

Next Steps:
  • Update docs/UPGRADE_PROCESS.md with version history
  • Commit networks.json changes
  • Notify group members of upgrade
  • Monitor for any issues in next 24h
```

## Error Handling
- If tests fail: STOP - do not proceed with upgrade
- If storage incompatible: STOP - refactor needed
- If wrong permissions: Show who should execute
- If transaction fails: Show revert reason
- If validation fails: Roll back if possible or alert user

## Notes
- This command is FULLY AUTOMATED once scenario selected
- User must manually commit configuration changes
- For scenarios 3-5, requires multisig approval (propose transactions)
- Always test upgrades on testnet first
- Keep old implementation addresses for rollback if needed
- See `docs/UPGRADE_PROCESS.md` for detailed explanation of each scenario
