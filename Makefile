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

# Fork Mainnet With Hardhat
mainnet-fork :; npx hardhat node --fork ${ETH_MAINNET_RPC_URL}

# Deploy Factory

# Localhost
deploy-factory-local: 
	-forge script script/DeployFactory.s.sol:DeployFactoryScript \
	--rpc-url http://127.0.0.1:8545 \
	--sender 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 \
	--unlocked \
	--broadcast \
	-vvvv

deploy-factory-anvil: 
	-forge script script/DeployFactory.s.sol:DeployFactoryScript \
	--rpc-url http://127.0.0.1:8545 \
	--private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
	--broadcast \
	-vvvv

# Deploy Factory Multichain

# Base
deploy-factory-multi-base: 
	-forge script script/DeployFactoryMultiChain.s.sol:DeployFactoryMultiChain \
	--rpc-url $(RPC_URL_BASE) \
	--account pkf \
	--sig "run(string)" 'base' \
	--etherscan-api-key $(BASESCAN_API_KEY) \
	--chain-id 8453 \
	--broadcast \
	--legacy \
	--verify \
	-vvv

# Deploy Factory v1.1.0 on Base (New Version)
deploy-factory-v110-base: 
	@echo "Deploying OwnerModuleFactory v1.1.0 to Base..."
	-forge script script/DeployFactoryMultiChain.s.sol:DeployFactoryMultiChain \
	--rpc-url $(RPC_URL_BASE) \
	--account pkf \
	--sig "run(string)" 'base-v1.1.0' \
	--etherscan-api-key $(BASESCAN_API_KEY) \
	--chain-id 8453 \
	--broadcast \
	--legacy \
	--verify \
	-vvv

verify-factory-base: 
	-forge verify-contract \
  --rpc-url $(RPC_URL_BASE) \
  0xc42e4af82969e757602E657D92829E9e2F06f6B3 \
  /home/felipenovaesrocha/Projects/1Hive/gardens-zodiac/src
OwnerModuleFactory.sol:OwnerModuleFactory \
	--etherscan-api-key $(ETHERSCAN_API_KEY)

verify-blockscout-base: 
	-forge script script/DeployFactoryMultiChain.s.sol:DeployFactoryMultiChain \
	--rpc-url $(RPC_URL_BASE) \
	--sig "run(string)" 'base' \
	--chain-id 8453 \
	--account pkf \
	--verifier blockscout \
	--verifier-url https://base.blockscout.com/api/ \
	--ffi \
	--legacy \
	--verify \
	--via-ir \
	-vvv \
	--broadcast \
	--slow

# Add owner to all modules in Base
addOwner: #make addOwner owner=0x1234 threshold=2
	-forge script script/FactoryInteraction.s.sol:FactoryInteractionScript \
	--rpc-url $(RPC_URL_BASE) \
	--account pkf \
	--sig "addSafeOwnerToAll(address,uint256)" $(owner) $(threshold) \
	--chain-id 8453 \
	--broadcast \
	-vvvv

# Get module for safe
getModuleForSafe: #make getModuleForSafe safe=0x1234
	-forge script script/FactoryInteraction.s.sol:FactoryInteractionScript \
	--rpc-url $(RPC_URL_BASE) \
	--account pkf \
	--sig "getModuleForSafe(address)" $(safe) \
	--chain-id 8453 \
	--broadcast \
	-vvvv

# Get factory info
getFactoryInfo: 
	-forge script script/FactoryInteraction.s.sol:FactoryInteractionScript \
	--rpc-url $(RPC_URL_BASE) \
	--account pkf \
	--sig "getFactoryInfo()" \
	--chain-id 8453 \
	--broadcast \
	-vvvv

# Base Sepolia
deploy-factory-multi-basesep: 
	-forge script script/DeployFactoryMultiChain.s.sol:DeployFactoryMultiChain \
	--rpc-url $(RPC_URL_BASE_TESTNET) \
	--account pkf \
	--sig "run(string)" 'basesepolia' \
	--etherscan-api-key $(BASESCAN_API_KEY) \
	--chain-id 84532 \
	--broadcast \
	--legacy \
	--verify \
	-vvv


# Rename all instances of this repo with the new repo name
rename :; chmod +x ./scripts/* && ./scripts/rename.sh
