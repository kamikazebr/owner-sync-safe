# Owner Sync Safe

UUPS upgradeable system for synchronizing Safe owners across multiple chains and Safes.

## Overview

Owner Sync Safe provides a secure, upgradeable infrastructure for managing Safe owners across multiple chains. The system uses the UUPS (Universal Upgradeable Proxy Standard) pattern to enable future upgrades while maintaining state consistency.

## Key Features

- **UUPS Upgradeable**: Both manager and modules support secure upgrades
- **Cross-Safe Operations**: Synchronize owners across multiple Safes
- **Two-Step Ownership**: Enhanced security with `Ownable2Step` pattern
- **Storage Gaps**: Future-proof storage layout for upgrades
- **Comprehensive Testing**: Full test coverage for UUPS functionality

## Architecture

The system consists of two main components:

1. **SafeModuleManager**: UUPS proxy that creates and manages all modules
2. **ManagedSafeModule**: Individual UUPS modules for each Safe

For detailed architecture information, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Documentation

📚 **Complete documentation**: https://notes.felipenovaesrocha.xyz/s/gHyTdvBYj

## Quick Start

### Installation

```bash
# Install dependencies
make install
forge install
```

### Testing

```bash
# Run all tests
forge test

# Run specific UUPS tests
forge test --match-contract "UUPS"
```

### Deployment

```bash
# Deploy UUPS system
forge script script/DeployUUPS.s.sol --broadcast

# Upgrade existing system
forge script script/UpgradeUUPS.s.sol --broadcast
```

## Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Fill in your API keys and RPC URLs in `.env`

## Development Commands

See `Makefile` for all available commands:

```bash
make install     # Install dependencies
make build       # Build contracts
make test        # Run tests
make deploy      # Deploy contracts
make lint        # Run linter
```

## License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## Security

- All sensitive keys are excluded from version control
- UUPS upgrade authorization prevents unauthorized upgrades
- Two-step ownership transfer reduces ownership risks
- Storage gaps protect against storage collision in upgrades