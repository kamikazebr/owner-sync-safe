# include .env file and export its env vars
# (-include to ignore error if it does not exist)
-include .env

all: clean remove install update solc build

# Install proper solc version.
solc:; nix-env -f https://github.com/dapphub/dapptools/archive/master.tar.gz -iA solc-static-versions.solc_0_8_11

# Clean the repo
clean  :; forge clean

# Remove modules
remove :; rm -rf .gitmodules && rm -rf .git/modules/* && rm -rf lib && touch .gitmodules && git add . && git commit -m "modules"

# Install the Modules
libs-install :;
	forge install --no-git dapphub/ds-test@9310e879db8ba3ea6d5c6489a579118fd264a3f5
	forge install --no-git foundry-rs/forge-std@564510058ab3db01577b772c275e081e678373f2
	forge install --no-git rari-capital/solmate@eaaccf88ac5290299884437e1aee098a96583d54
	forge install --no-git OpenZeppelin/openzeppelin-contracts@v4.6.0
	forge install --no-git contracts-upgradeable=OpenZeppelin/openzeppelin-contracts-upgradeable@v4.6.0 
	forge install --no-git gnosis/safe-contracts@v1.3.0-libs.0 gnosis/zodiac@v1.0.10

install: libs-install fix-zeppelin


fix-zeppelin:;
	mv lib/contracts-upgradeable/contracts lib/openzeppelin-contracts/contracts-upgradeable && \
	rm -rf lib/contracts-upgradeable \
	echo "Done"

# Update Dependencies
update:; forge update

# Builds
build  :; forge clean && forge build --optimize --optimizer-runs 1000000
dappbuild :; dapp build

# chmod scripts
scripts :; chmod +x ./scripts/*

# Tests
test   :; forge clean && forge test --optimize --optimizer-runs 1000000 -v # --ffi # enable if you need the `ffi` cheat code on HEVM

# Lints
lint :; yarn prettier --write src/**/*.sol && prettier --write src/*.sol

# Generate Gas Snapshots
snapshot :; forge clean && forge snapshot --optimize --optimizer-runs 1000000

# ===== REGISTRY & UUPS DEPLOYMENT COMMANDS =====

# Deploy SyncGroupRegistry to Gnosis Chain
deploy-registry-gnosis:
	@echo "Deploying SyncGroupRegistry to Gnosis Chain..."
	@forge script script/DeployUUPSMultiChain.s.sol:DeployUUPSMultiChain \
	--rpc-url $(RPC_URL_GNOSIS) \
	--account pkf \
	--sig "deployRegistry(string)" 'gnosis' \
	--chain-id 100 \
	--with-gas-price 5gwei \
	--priority-gas-price 1gwei \
	--broadcast \
	--legacy \
	--verify \
	--etherscan-api-key $(ETHERSCAN_API_KEY) \
	-vvv
	@echo ""
	@echo "📝 Updating networks.json..."
	@./scripts/update-deployment-addresses.sh gnosis registry
	@echo ""
	@echo "🔄 Syncing configs to subgraph..."
	@pnpm sync-configs

# ===== REGISTRY UPGRADE COMMANDS =====

# Upgrade Registry proxy itself (Scenario 1)
upgrade-registry-gnosis:
	@echo "Upgrading SyncGroupRegistry on Gnosis Chain..."
	@echo "Reading Registry address from script/config/networks.json"
	@forge script script/UpgradeUUPS.s.sol:UpgradeUUPS \
	--rpc-url $(RPC_URL_GNOSIS) \
	--account pkf \
	--sig "upgradeRegistry(string)" 'gnosis' \
	--chain-id 100 \
	--with-gas-price 5gwei \
	--priority-gas-price 1gwei \
	--legacy \
	--broadcast \
	--verify \
	--etherscan-api-key $(ETHERSCAN_API_KEY) \
	-vvv
	@echo ""
	@echo "📝 Updating networks.json with new implementation..."
	@./scripts/update-deployment-addresses.sh gnosis registry-impl
	@echo ""
	@echo "🔄 Syncing configs..."
	@pnpm sync-configs

# Update SafeModuleManager template in Registry (Scenario 2)
update-registry-manager-template-gnosis:
	@echo "Updating SafeModuleManager template in Registry on Gnosis Chain..."
	@echo "Reading Registry address from script/config/networks.json"
	@forge script script/UpgradeUUPS.s.sol:UpgradeUUPS \
	--rpc-url $(RPC_URL_GNOSIS) \
	--account pkf \
	--sig "updateRegistryManagerTemplate(string)" 'gnosis' \
	--chain-id 100 \
	--with-gas-price 5gwei \
	--priority-gas-price 1gwei \
	--legacy \
	--broadcast \
	--verify \
	--etherscan-api-key $(ETHERSCAN_API_KEY) \
	-vvv
	@echo ""
	@echo "📝 Updating networks.json with new Manager template..."
	@./scripts/update-deployment-addresses.sh gnosis manager-impl
	@echo ""
	@echo "🔄 Syncing configs..."
	@pnpm sync-configs

# Update ManagedSafeModule template in Registry (Scenario 4)
update-registry-module-template-gnosis:
	@echo "Updating ManagedSafeModule template in Registry on Gnosis Chain..."
	@echo "Reading Registry address from script/config/networks.json"
	@forge script script/UpgradeUUPS.s.sol:UpgradeUUPS \
	--rpc-url $(RPC_URL_GNOSIS) \
	--account pkf \
	--sig "updateRegistryModuleTemplate(string)" 'gnosis' \
	--chain-id 100 \
	--with-gas-price 5gwei \
	--priority-gas-price 1gwei \
	--legacy \
	--broadcast \
	--verify \
	--etherscan-api-key $(ETHERSCAN_API_KEY) \
	-vvv
	@echo ""
	@echo "📝 Updating networks.json with new Module template..."
	@./scripts/update-deployment-addresses.sh gnosis module-impl
	@echo ""
	@echo "🔄 Syncing configs..."
	@pnpm sync-configs

# Check contract sizes to ensure they fit within limits
check-sizes:
	forge build --sizes
