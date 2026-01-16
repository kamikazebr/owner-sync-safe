# Claude Code Agents for Web3 Development

This document describes the specialized agents (slash commands) created for this project to streamline web3 development workflows.

## Overview

We've created 6 specialized slash commands that automate common web3 development tasks. These agents use Claude Code's built-in tools (Bash, Read, Edit, etc.) and are designed to be:

- **Fully Automated**: Execute complex workflows with a single command
- **Reusable**: Patterns applicable to any Foundry + Next.js + Safe Apps project
- **Safe**: Include validation and error handling at every step
- **Documented**: Generate detailed reports for auditing

## Available Commands

### 1. `/deploy-gnosis` - Deploy to Gnosis Chain

**Purpose**: Complete deployment pipeline for Gnosis Chain with verification and configuration updates.

**What it does**:
- ✅ Runs tests to ensure contract quality
- ✅ Checks contract sizes against EIP-170 limit
- ✅ Deploys Registry with SafeModuleManager and ManagedSafeModule templates
- ✅ Verifies all contracts on Gnosisscan
- ✅ Updates `networks.json` with deployment addresses
- ✅ Syncs subgraph configurations
- ✅ Generates deployment report

**Usage**:
```bash
/deploy-gnosis
```

**Prerequisites**:
- `PRIVATE_KEY` environment variable set
- `GNOSIS_RPC_URL` environment variable set
- `GNOSISSCAN_API_KEY` environment variable set
- All tests passing
- Sufficient xDAI for deployment

**Time**: ~5 minutes

**Output**: Deployment report with addresses, transaction hashes, gas costs, and verification status

---

### 2. `/check-gas` - Contract Size & Gas Analysis

**Purpose**: Analyze contract sizes and gas costs to ensure optimization and prevent deployment failures.

**What it does**:
- ✅ Checks contract sizes against 24,576 byte limit
- ✅ Identifies contracts near limit (warning if <2KB headroom)
- ✅ Generates gas snapshots
- ✅ Compares with previous snapshot to detect regressions
- ✅ Identifies top 10 most expensive functions
- ✅ Suggests optimization strategies
- ✅ Validates storage layouts for UUPS contracts

**Usage**:
```bash
/check-gas
```

**Prerequisites**: None (read-only operation)

**Time**: ~30 seconds

**When to use**:
- Before every deployment
- After adding new features
- When optimizing contract performance
- To monitor gas cost trends

**Output**: Detailed report with contract sizes, gas costs, comparisons, and optimization recommendations

---

### 3. `/test-safe-app` - Safe App Integration Testing

**Purpose**: Validate that Safe App integration is working correctly and all critical features are preserved.

**What it does**:
- ✅ Verifies `useSafeApps` hook exists with retry logic
- ✅ Checks that main page uses Safe App integration
- ✅ Validates all 19 custom hooks for Safe compatibility
- ✅ Verifies Safe Apps SDK dependencies
- ✅ Tests iframe detection logic
- ✅ Validates timeout and retry configuration
- ✅ Checks transaction proposal handling
- ✅ Identifies known issues

**Usage**:
```bash
/test-safe-app
```

**Prerequisites**: None (read-only operation)

**Time**: ~1 minute

**When to use**:
- After UI refactoring
- Before major releases
- When updating Safe Apps SDK
- After modifying hooks

**Output**: Comprehensive test report with status of all integration points

**Critical for**: This project's primary use case is as a Safe App - these features are MANDATORY per `FEATURES.md`

---

### 4. `/upgrade` - Contract Upgrade Orchestration

**Purpose**: Interactive orchestration of UUPS contract upgrades across 5 different scenarios.

**What it does**:
- ✅ Presents 5 upgrade scenarios with clear explanations
- ✅ Validates storage layout compatibility
- ✅ Checks contract sizes and test results
- ✅ Executes appropriate upgrade commands
- ✅ Validates upgrade success
- ✅ Updates configuration files
- ✅ Generates upgrade report
- ✅ Provides next steps and documentation reminders

**Upgrade Scenarios**:
1. **Upgrade Registry** - Registry proxy only, affects future groups
2. **Update Manager Template** - Registry's Manager template, affects future groups
3. **Upgrade Group Manager** - Specific group's Manager, requires governance Safe
4. **Update Module Template** - Manager's Module template, affects future Safes
5. **Upgrade Safe Module** - Individual Safe's Module, requires Safe multisig

**Usage**:
```bash
/upgrade
```

**Prerequisites**:
- Tests passing for new implementation
- Appropriate permissions/ownership for selected scenario
- `PRIVATE_KEY` environment variable set

**Time**: ~3-5 minutes per upgrade

**When to use**:
- When deploying new contract features
- When fixing bugs in deployed contracts
- When optimizing deployed contracts

**Output**: Detailed upgrade report with before/after comparison, transaction details, and validation results

**See also**: `docs/UPGRADE_PROCESS.md` for detailed explanation of each scenario

---

### 5. `/health-check` - System-Wide Validation

**Purpose**: Comprehensive validation of all system components to detect configuration issues and integration problems.

**What it does**:
- ✅ Validates `networks.json` against on-chain state
- ✅ Verifies subgraph configs are synced
- ✅ Checks environment variables
- ✅ Tests smart contract operations
- ✅ Validates frontend build and dependencies
- ✅ Checks all 19 hooks are importable
- ✅ Verifies contract version consistency
- ✅ Identifies known issues
- ✅ Tests development server
- ✅ Runs security checks

**Usage**:
```bash
/health-check
```

**Prerequisites**: None (read-only operation)

**Time**: ~2 minutes

**When to use**:
- Before every deployment
- After configuration changes
- After contract upgrades
- When debugging integration issues
- After pulling latest code

**Output**: Detailed health report with status of all components and actionable recommendations

**Benefits**:
- Catch configuration drift early
- Verify deployments succeeded correctly
- Identify missing dependencies
- Detect known security issues

---

### 6. `/deploy-multi` - Multi-Chain Deployment

**Purpose**: Deploy and verify contracts across multiple EVM chains (Gnosis, Ethereum, Base) with coordination.

**What it does**:
- ✅ Validates prerequisites for all target chains
- ✅ Deploys Registry + templates to each chain sequentially
- ✅ Verifies contracts on all block explorers
- ✅ Validates cross-chain consistency (identical implementations)
- ✅ Updates `networks.json` for all chains
- ✅ Syncs subgraph configurations
- ✅ Generates comprehensive multi-chain report
- ✅ Provides post-deployment checklist

**Usage**:
```bash
/deploy-multi
```

**Prerequisites**:
- Environment variables for ALL target chains:
  - `GNOSIS_RPC_URL` + `GNOSISSCAN_API_KEY`
  - `ETHEREUM_RPC_URL` + `ETHERSCAN_API_KEY`
  - `BASE_RPC_URL` + `BASESCAN_API_KEY`
- `PRIVATE_KEY` for deployments
- Sufficient native tokens on all chains

**Time**: ~15-20 minutes (5 min per chain)

**When to use**:
- Initial multi-chain deployment
- Adding new chains to existing deployment
- Deploying major version upgrades across all chains

**Output**: Multi-chain deployment report with addresses, gas costs, verification status for each chain

**Note**: Deployments are sequential (not parallel) to avoid nonce issues

---

## Command Patterns & Best Practices

### Typical Development Workflow

**Before Deployment:**
```bash
/check-gas           # Verify contracts optimized
/test-safe-app      # Verify Safe integration intact
/health-check       # Verify system state
/deploy-gnosis      # Deploy to Gnosis
/health-check       # Validate deployment
```

**After Feature Development:**
```bash
/test-safe-app      # Ensure Safe features work
/check-gas          # Check for size/gas regressions
```

**For Upgrades:**
```bash
/check-gas          # Verify new implementation size
/upgrade            # Interactive upgrade wizard
/health-check       # Validate upgrade success
```

**Multi-Chain Launch:**
```bash
/check-gas          # One-time validation
/deploy-multi       # Deploy all chains
/health-check       # Validate all deployments
```

### Error Handling Philosophy

All commands follow these principles:
- **Fail Early**: Validate prerequisites before starting
- **Fail Loudly**: Show clear error messages with context
- **Fail Safely**: Never leave system in inconsistent state
- **Provide Guidance**: Always suggest next steps on failure

### Automation Level

All commands are **fully automated** once invoked:
- No mid-workflow confirmations
- No manual verification steps
- Complete end-to-end execution

Exception: `/upgrade` asks which scenario to execute at the start

### Configuration Management

Commands that modify configuration:
- **Read** current state first
- **Preserve** data for other chains/environments
- **Validate** changes before writing
- **Never commit** automatically (user commits when ready)

Modified files:
- `script/config/networks.json` - Deployment addresses
- `pkg/subgraph/configs/*.json` - Generated from networks.json

### Reporting

All commands generate detailed reports including:
- What was done
- Transaction hashes (where applicable)
- Gas costs
- Verification status
- Next steps

Reports use emoji and tables for clarity:
- ✅ Success
- ⚠️ Warning
- ❌ Error
- 🚨 Critical issue

---

## Extending to Other Web3 Projects

These commands are designed with reusability in mind. To adapt to another project:

### Generic Patterns (Work Anywhere)
- `/check-gas` - Works with any Foundry project
- `/health-check` (partial) - Configuration validation, dependency checks

### Project-Specific Patterns (Require Customization)
- `/deploy-gnosis` - Adapt to your deployment targets
- `/test-safe-app` - Adapt to your integration type (Safe, WalletConnect, etc.)
- `/upgrade` - Adapt to your upgrade scenarios
- `/deploy-multi` - Adapt to your target chains

### Customization Checklist

1. **Update contract names** in deployment commands
2. **Adjust Makefile targets** to match your project
3. **Modify configuration paths** (if not using networks.json pattern)
4. **Update chain list** for multi-chain deployment
5. **Adapt hook checks** to your frontend architecture
6. **Customize health checks** for your specific components

---

## Technical Details

### How Slash Commands Work

Slash commands are simple markdown files in `.claude/commands/` that contain:
- Clear instructions for Claude Code's agent
- Step-by-step workflow
- Error handling guidelines
- Output format specifications

When you type `/command-name`, Claude Code:
1. Reads the markdown file
2. Executes the instructions using built-in tools
3. Follows the workflow autonomously
4. Generates the specified output

### Tools Used by Agents

Agents use these Claude Code built-in tools:
- **Bash** - Run forge, make, cast, pnpm commands
- **Read** - Read configuration files, contracts, docs
- **Edit** - Update networks.json, configuration files
- **Grep** - Search for patterns in code
- **Glob** - Find files matching patterns

No custom MCP servers or external dependencies required!

### Why This Approach?

**Advantages**:
- ✅ Simple markdown files (easy to edit)
- ✅ Uses existing tools (no new dependencies)
- ✅ Version controlled with project
- ✅ Clear documentation of workflows
- ✅ Easy to customize and extend

**vs. Custom Scripts**:
- More flexible - can handle edge cases intelligently
- Self-documenting - instructions are readable
- Adaptive - can adjust to unexpected situations
- Interactive - can ask clarifying questions

**vs. MCP Servers**:
- Much simpler - no TypeScript project needed
- No dependencies - works out of the box
- Easier to maintain - just edit markdown
- Project-specific - tailored to exact needs

---

## Troubleshooting

### Command Not Found
**Issue**: Typing `/command` doesn't work

**Solution**:
```bash
# Verify command file exists
ls .claude/commands/

# Check file has .md extension
ls .claude/commands/deploy-gnosis.md

# Restart Claude Code if needed
```

### Command Fails with Permission Error
**Issue**: Bash commands fail with permission denied

**Solution**:
```bash
# Check environment variables set
echo $PRIVATE_KEY
echo $GNOSIS_RPC_URL

# Ensure Makefile is executable
chmod +x Makefile
```

### Command Produces Unexpected Output
**Issue**: Command output differs from documentation

**Solution**:
- Read the command's markdown file: `.claude/commands/<name>.md`
- Check if your project structure differs from expected
- Customize the command for your specific setup
- Report issue if it's a bug in the command

### Networks.json Not Updating
**Issue**: Configuration not synced after deployment

**Solution**:
```bash
# Manually sync configs
pnpm sync-configs

# Verify networks.json structure
cat script/config/networks.json | jq

# Check sync-configs script
cat scripts/sync-configs.ts
```

---

## Future Enhancements

Potential additions for future versions:

### Additional Commands
- `/deploy-testnet` - Deploy to testnets (Goerli, Chiado, Base Goerli)
- `/simulate-upgrade` - Test upgrade in forked environment
- `/analyze-security` - Run Slither, Mythril, Aderyn
- `/benchmark-gas` - Compare gas costs across implementations
- `/generate-docs` - Auto-generate NatSpec documentation
- `/deploy-subgraph` - Deploy subgraph after contract deployment

### Enhanced Features
- Automatic rollback on deployment failure
- Gas price optimization (wait for low gas)
- Parallel verification (multiple explorers simultaneously)
- Interactive contract interaction CLI
- Automated integration testing in Safe iframe

### Integration Ideas
- GitHub Actions integration (run commands in CI)
- Discord/Slack notifications for deployments
- Multi-signature coordination for upgrades
- Deployment approval workflows

---

## Contributing

To add new commands:

1. Create `.claude/commands/your-command.md`
2. Follow existing command structure:
   - Clear task description
   - Step-by-step workflow
   - Error handling
   - Output format
   - Prerequisites and notes
3. Test thoroughly
4. Document in this file
5. Submit PR

For questions or suggestions, open an issue on GitHub.

---

## Summary

These 6 slash commands transform complex web3 development workflows into single-command operations:

| Command | Purpose | Time | When to Use |
|---------|---------|------|-------------|
| `/deploy-gnosis` | Deploy to Gnosis Chain | 5 min | Production deployments |
| `/check-gas` | Analyze sizes and gas | 30s | Before deployment, after changes |
| `/test-safe-app` | Validate Safe integration | 1 min | After refactoring, before release |
| `/upgrade` | Orchestrate upgrades | 3-5 min | Deploying new versions |
| `/health-check` | Validate system state | 2 min | Before deployment, debugging |
| `/deploy-multi` | Multi-chain deployment | 15-20 min | Multi-chain launches |

All commands are fully automated, generate detailed reports, and include comprehensive error handling. They're designed to be reusable across web3 projects with minimal customization.

**Happy building! 🚀**
