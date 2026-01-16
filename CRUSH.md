# CRUSH.md

## Build/Test/Lint Commands

### Frontend (Next.js/TypeScript)
- **Install dependencies:** `pnpm install --frozen-lockfile`
- **Type check:** `pnpm type-check`
- **Build:** `pnpm build`
- **Lint:** `pnpm lint`
- **Development server:** `pnpm dev`
- **Wagmi generation:** `pnpm generate`

### Backend (Foundry/Solidity)
- **Install dependencies:** `forge install --no-commit`
- **Build & check sizes:** `forge build --sizes`
- **Run all tests:** `forge test -vvv`
- **Run single test file:** `forge test --match-path <path/to/TestFile.t.sol> -vvv`
- **Run specific test:** `forge test --match-test "testFunction_Name" -vvv`

## Code Style Guidelines

### Solidity
- **Error Handling:** Use custom `Errors` instead of `require` statements.
- **Imports:** Prefer named imports `{A, B}` over wildcard imports.

### TypeScript/React
- Adhere to `eslint` and `typescript` configurations (`pnpm lint`, `pnpm type-check`).
- **Safe App Integration:** Always verify `useSafeApps` is correctly used in main components and re-test Safe App functionality after UI changes.
- **Hooks:** Do not remove hooks without consulting `docs/FEATURES.md`.

## Agent-Specific Guidelines
- Refer to `CLAUDE.md` for critical features, refactoring rules, contract architecture, deployment processes, and known security issues.
