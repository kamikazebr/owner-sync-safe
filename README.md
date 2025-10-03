# Owner Sync Safe

Next.js application for Safe module management with RainbowKit and Safe Apps SDK integration.

## Features

- **Next.js 14** with App Router and TypeScript
- **RainbowKit** for wallet connectivity
- **Safe Apps SDK** integration for Safe wallet compatibility
- **Wagmi v2** for Ethereum interactions
- **Tailwind CSS** for styling
- **UUPS Upgradeable Contracts**: Both manager and modules support secure upgrades
- **Cross-Safe Operations**: Synchronize owners across multiple Safes
- **Two-Step Ownership**: Enhanced security with `Ownable2Step` pattern

## Architecture

The system consists of:

1. **Next.js Frontend**: Modern web interface with wallet connectivity
2. **SafeModuleManager**: UUPS proxy that creates and manages all modules
3. **ManagedSafeModule**: Individual UUPS modules for each Safe

## Frontend Setup

### Installation

```bash
# Install dependencies with pnpm
pnpm install
```

### Configuration

```bash
# Copy environment template
cp .env.local.example .env.local
# Add your WalletConnect Project ID from https://cloud.walletconnect.com/
```

### Development

```bash
# Run development server
pnpm dev

# Type checking
pnpm type-check

# Build for production
pnpm build
```

## Smart Contracts

### Development Commands

```bash
# Build contracts
forge build --sizes

# Run tests
forge test

# Deploy UUPS system
forge script script/DeployUUPS.s.sol --broadcast

# Upgrade existing system
forge script script/UpgradeUUPS.s.sol --broadcast
```

See `Makefile` for additional commands.

## Safe Apps Integration

This application works as:

1. **Standalone dApp** - Connect with any wallet via RainbowKit
2. **Safe App** - Auto-connects when loaded in Safe wallet iframe

The Safe Apps SDK automatically detects when running inside a Safe wallet and provides access to Safe-specific functionality.

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
├── hooks/              # Custom React hooks
└── lib/                # Utility libraries and configurations

contracts/              # Solidity smart contracts
script/                 # Deployment scripts
test/                   # Contract tests
```

## Package Management

This project uses **pnpm** instead of npm for faster, more efficient dependency management.

## Documentation

📚 **Complete documentation**: https://notes.felipenovaesrocha.xyz/s/gHyTdvBYj

## License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](LICENSE) file for details.