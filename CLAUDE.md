- use Errors instead require in Solidity code

# Contract Size Management
- Ethereum contract size limit: 24,576 bytes (EIP-170)
- Monitor contract sizes with `forge build --sizes`
- When contracts exceed limit, prioritize core functionality over convenience features
- Manager contracts should focus on creation/management, avoid complex cross-module operations
- Remove manager-as-module patterns if they cause size bloat
- Use named imports `{A, B}` instead of wildcard imports to reduce compilation warnings

# Contract Architecture Best Practices
- Keep managers simple and focused on their primary responsibility
- Separate complex network management into dedicated contracts if needed
- Avoid inheritance from heavy base contracts (like Module) unless essential
- Remove unused functions like batch operations, version management if not critical
- Test core functionality after optimization to ensure nothing essential was broken

# Current Architecture
- **SafeModuleManager**: Creates ManagedSafeModule instances for cross-module operations
- **ManagedSafeModule**: Individual modules installed in Safes, owned by their respective Safe
- **Ownership Model**: Each Safe owns its own module → Safe controls its module operations and upgrades
- **Module Enablement**: Each ManagedSafeModule must be individually enabled on its respective Safe
- **Cross-Module Operations**: Only manager owner can execute operations across all managed modules
- **Individual Module Control**: Each Safe can upgrade its own module independently via multisig approval

# Foundry Version Management
- Current: 1.3.2-nightly (8cd97db, Sept 3, 2025)  
- Previous: 1.3.0-nightly (cb8f3bf, July 23, 2025)
- Rollback command: `foundryup -C cb8f3bf2c4047f17310b84a685fcc12b61c98891`
- Upgrade command: `foundryup -C 8cd97db7281d1bf64617699359596f553bbf88c4`
- to deploy use makefile example, also account require password, so let command to the user run.
- always run forge test before suggest deploy
- always check server is up after some modifications, run it in dev mode and also check logs after some changes