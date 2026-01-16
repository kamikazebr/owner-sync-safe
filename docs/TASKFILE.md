# Taskfile Documentation

This project uses [Task](https://taskfile.dev) for build automation instead of Make. Task is a modern, cross-platform task runner with better syntax and features.

## Installation

### Linux/macOS
```bash
sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b ~/.local/bin
```

### macOS (Homebrew)
```bash
brew install go-task/tap/go-task
```

### Ubuntu/Debian
```bash
sudo snap install task --classic
```

### Windows
```powershell
choco install go-task
```

Verify installation:
```bash
task --version
```

## Quick Start

```bash
# Show all available tasks
task --list-all

# Show help with common commands
task help

# Complete project setup (install deps + build)
task setup

# Check your environment
task doctor
```

## Common Tasks

### Development

```bash
# Build contracts
task build

# Run all tests
task test

# Run specific test file
task test:file FILE=SafeModuleManagerTest.t.sol

# Run specific test function
task test:function FUNC=testCreateModuleForSafe

# Check contract sizes
task check-sizes

# Generate gas snapshots
task snapshot

# Frontend development server
task dev

# TypeScript type checking
task type-check

# Watch contracts and rebuild on changes
task dev:contracts
```

### Deployment

#### Gnosis Chain
```bash
# Deploy SyncGroupRegistry to Gnosis Chain
task deploy:registry:gnosis

# Upgrade Registry
task upgrade:registry:gnosis

# Update Manager template (affects future groups)
task upgrade:manager-template:gnosis

# Update Module template (affects future Safes)
task upgrade:module-template:gnosis
```

#### Base
```bash
# Deploy to Base
task deploy:registry:base
```

#### Arbitrum
```bash
# Deploy to Arbitrum One
task deploy:registry:arbitrum
```

#### Optimism
```bash
# Deploy to Optimism
task deploy:registry:optimism
```

#### Polygon
```bash
# Deploy to Polygon
task deploy:registry:polygon
```

### Subgraph

```bash
# Build subgraph
task subgraph:build

# Deploy to Graph Studio (Gnosis)
task subgraph:deploy:gnosis

# Generate manifest
task subgraph:manifest:gnosis
```

### Utilities

```bash
# Install forge libraries
task install

# Sync deployment configs to subgraph
task sync-configs

# Update frontend deployment addresses
task update-deployments

# Generate Wagmi types
task generate

# Clean build artifacts
task clean
```

## Environment Setup

1. **Copy environment template**:
   ```bash
   cp .env.example .env
   ```

2. **Configure RPC endpoints** (choose one per network):

   **Gnosis Chain** (required):
   ```bash
   RPC_URL_GNOSIS=https://rpc.gnosischain.com
   # Or Alchemy (recommended):
   RPC_URL_GNOSIS=https://gnosis-mainnet.g.alchemy.com/v2/YOUR_KEY
   ```

   **Base** (optional):
   ```bash
   RPC_URL_BASE=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
   # Or public:
   RPC_URL_BASE=https://mainnet.base.org
   ```

   **Arbitrum** (optional):
   ```bash
   RPC_URL_ARBITRUM=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
   ```

   **Optimism** (optional):
   ```bash
   RPC_URL_OPTIMISM=https://opt-mainnet.g.alchemy.com/v2/YOUR_KEY
   ```

   **Polygon** (optional):
   ```bash
   RPC_URL_POLYGON=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
   ```

3. **Configure block explorer API keys** (for verification):
   ```bash
   ETHERSCAN_API_KEY=your_key_here         # Gnosis
   BASESCAN_API_KEY=your_key_here          # Base
   ARBISCAN_API_KEY=your_key_here          # Arbitrum
   OPTIMISTIC_ETHERSCAN_API_KEY=your_key   # Optimism
   POLYGONSCAN_API_KEY=your_key_here       # Polygon
   ```

4. **Run setup**:
   ```bash
   task setup
   ```

## Deployment Workflow

### Prerequisites

1. **Environment configured** (.env file with RPC URLs and API keys)
2. **Account setup**: Deployment uses `pkf` account (requires password)
3. **Network entry in networks.json**: Add network config before deploying

### Example: Deploy to New Network

**1. Add network to `script/config/networks.json`**:
```json
{
  "name": "base",
  "chainId": 8453,
  "testnet": false,
  "ENVS": {
    "SENDER": "0xYourDeployerAddress"
  },
  "PROXIES": {},
  "IMPLEMENTATIONS": {}
}
```

**2. Configure .env**:
```bash
RPC_URL_BASE=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
BASESCAN_API_KEY=your_basescan_key
```

**3. Run tests first**:
```bash
task test
```

**4. Deploy**:
```bash
task deploy:registry:base
```

**5. Verify deployment**:
- Check `script/config/networks.json` for deployed addresses
- Verify contracts on block explorer
- Test frontend integration

## Task Features

### Preconditions

Tasks with `preconditions` will check requirements before running:

```bash
task deploy:registry:gnosis
# ✅ Checks:
# - .env file exists
# - RPC_URL_GNOSIS is set
# - ETHERSCAN_API_KEY is set
```

### Dependencies

Tasks with `deps` automatically run dependent tasks:

```bash
task deploy:registry:gnosis
# ✅ Automatically runs 'test' first
```

### Watch Mode

Some tasks support automatic rebuilding:

```bash
task dev:contracts
# Watches src/**/*.sol and rebuilds on changes
```

## Comparison: Make vs Task

### Before (Make)
```makefile
deploy-registry-gnosis:
	@echo "Deploying..."
	@forge script ... \
		--rpc-url $(RPC_URL_GNOSIS) \
		--chain-id 100 \
		-vvv
	@./scripts/update-deployment-addresses.sh gnosis registry
```

### After (Task)
```yaml
deploy:registry:gnosis:
  desc: Deploy SyncGroupRegistry to Gnosis Chain
  deps: [test]
  preconditions:
    - test -f .env
    - sh: test -n "{{.RPC_URL_GNOSIS}}"
      msg: "RPC_URL_GNOSIS not set in .env"
  cmds:
    - echo "Deploying..."
    - |
      forge script ... \
        --rpc-url {{.RPC_URL_GNOSIS}} \
        --chain-id {{.GNOSIS_CHAIN_ID}} \
        -vvv
    - ./scripts/update-deployment-addresses.sh gnosis registry
```

**Benefits**:
- ✅ Readable YAML syntax
- ✅ Built-in precondition checks
- ✅ Automatic dependency management
- ✅ Better error messages
- ✅ Cross-platform (Windows, macOS, Linux)
- ✅ Variable interpolation with `{{.VAR}}`

## Multi-Network Architecture

The Taskfile makes it easy to deploy to multiple networks:

| Network | Task Command | Chain ID | Status |
|---------|-------------|----------|--------|
| Gnosis | `task deploy:registry:gnosis` | 100 | ✅ Deployed |
| Base | `task deploy:registry:base` | 8453 | 🟡 Ready |
| Arbitrum | `task deploy:registry:arbitrum` | 42161 | 🟡 Ready |
| Optimism | `task deploy:registry:optimism` | 10 | 🟡 Ready |
| Polygon | `task deploy:registry:polygon` | 137 | 🟡 Ready |

## Troubleshooting

### Task not found
```bash
# Install Task (see Installation section above)
task --version
```

### RPC URL not set error
```bash
# Check your .env file
cat .env | grep RPC_URL_GNOSIS

# Make sure .env is in project root
ls -la .env
```

### Account password required
```bash
# Deployment requires password for 'pkf' account
# This is by design for security - password cannot be automated
```

### Precondition failed
```bash
# Task will show which precondition failed:
# Example: "RPC_URL_GNOSIS not set in .env"
# Fix the issue and run again
```

## Advanced Usage

### Custom Variables

Override variables at runtime:
```bash
task build OPTIMIZER_RUNS=999999
```

### Parallel Execution

Run multiple tasks in parallel:
```bash
task build & task type-check & wait
```

### Silent Mode

Suppress task output:
```bash
task build --silent
```

### Dry Run

See what would be executed without running:
```bash
task deploy:registry:gnosis --dry
```

## Migration from Make

If you were using the old Makefile:

| Old (Make) | New (Task) |
|------------|------------|
| `make build` | `task build` |
| `make test` | `task test` |
| `make deploy-registry-gnosis` | `task deploy:registry:gnosis` |
| `make upgrade-registry-gnosis` | `task upgrade:registry:gnosis` |
| `make snapshot` | `task snapshot` |
| `make check-sizes` | `task check-sizes` |

The Makefile is still available but deprecated. Use `task` for all new development.

## Additional Resources

- [Task Documentation](https://taskfile.dev)
- [Task GitHub](https://github.com/go-task/task)
- [Taskfile Schema](https://taskfile.dev/api/)
- Project CLAUDE.md for development guidelines
