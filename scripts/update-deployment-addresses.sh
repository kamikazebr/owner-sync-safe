#!/bin/bash

# Update networks.json with deployed/upgraded contract addresses
# Usage: ./scripts/update-deployment-addresses.sh <network> <contract-type> [address]
#
# Examples:
#   ./scripts/update-deployment-addresses.sh gnosis registry
#   ./scripts/update-deployment-addresses.sh gnosis registry-impl 0x123...
#   ./scripts/update-deployment-addresses.sh gnosis manager-impl --from-broadcast

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Validate inputs
if [ $# -lt 2 ]; then
    echo -e "${RED}Error: Missing required arguments${NC}"
    echo "Usage: $0 <network> <contract-type> [address]"
    echo ""
    echo "Contract types:"
    echo "  registry         - Update PROXIES.SyncGroupRegistry"
    echo "  registry-impl    - Update IMPLEMENTATIONS.SyncGroupRegistry"
    echo "  manager-impl     - Update IMPLEMENTATIONS.SafeModuleManager"
    echo "  module-impl      - Update IMPLEMENTATIONS.ManagedSafeModule"
    echo ""
    echo "Examples:"
    echo "  $0 gnosis registry"
    echo "  $0 gnosis registry-impl 0x123..."
    exit 1
fi

NETWORK=$1
CONTRACT_TYPE=$2
MANUAL_ADDRESS=$3

# File paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NETWORKS_JSON="$PROJECT_ROOT/script/config/networks.json"
BACKUP_FILE="$NETWORKS_JSON.backup"

# Validate jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed${NC}"
    echo "Install with: sudo apt-get install jq"
    exit 1
fi

# Validate networks.json exists
if [ ! -f "$NETWORKS_JSON" ]; then
    echo -e "${RED}Error: $NETWORKS_JSON not found${NC}"
    exit 1
fi

# Get chain ID from network name
get_chain_id() {
    case $1 in
        gnosis) echo "100" ;;
        base) echo "8453" ;;
        sepolia) echo "11155111" ;;
        basesepolia) echo "84532" ;;
        *) echo -e "${RED}Error: Unknown network $1${NC}" >&2; exit 1 ;;
    esac
}

CHAIN_ID=$(get_chain_id "$NETWORK")

# Extract address from broadcast JSON
extract_from_broadcast() {
    local contract_name=$1
    local script_name=$2

    BROADCAST_DIR="$PROJECT_ROOT/broadcast/$script_name/$CHAIN_ID"
    LATEST_RUN="$BROADCAST_DIR/run-latest.json"

    if [ ! -f "$LATEST_RUN" ]; then
        echo -e "${RED}Error: Broadcast file not found: $LATEST_RUN${NC}" >&2
        echo -e "${YELLOW}Hint: Run the deployment/upgrade command first${NC}" >&2
        exit 1
    fi

    # Extract address based on contract name
    ADDRESS=$(jq -r ".transactions[] | select(.contractName == \"$contract_name\") | .contractAddress" "$LATEST_RUN" | head -1)

    if [ -z "$ADDRESS" ] || [ "$ADDRESS" == "null" ]; then
        echo -e "${RED}Error: Could not extract $contract_name address from broadcast${NC}" >&2
        echo -e "${YELLOW}Broadcast file: $LATEST_RUN${NC}" >&2
        exit 1
    fi

    echo "$ADDRESS"
}

# Determine address to use
ADDRESS=""
case $CONTRACT_TYPE in
    registry)
        if [ -n "$MANUAL_ADDRESS" ]; then
            ADDRESS=$MANUAL_ADDRESS
        else
            echo -e "${YELLOW}Extracting Registry proxy address from broadcast...${NC}"
            ADDRESS=$(extract_from_broadcast "ERC1967Proxy" "DeployUUPSMultiChain.s.sol")
        fi
        JSON_PATH=".PROXIES.SyncGroupRegistry"
        DESCRIPTION="SyncGroupRegistry Proxy"
        ;;
    registry-impl)
        if [ -n "$MANUAL_ADDRESS" ]; then
            ADDRESS=$MANUAL_ADDRESS
        else
            echo -e "${YELLOW}Extracting Registry implementation from broadcast...${NC}"
            ADDRESS=$(extract_from_broadcast "SyncGroupRegistry" "UpgradeUUPS.s.sol")
        fi
        JSON_PATH=".IMPLEMENTATIONS.SyncGroupRegistry"
        DESCRIPTION="SyncGroupRegistry Implementation"
        ;;
    manager-impl)
        if [ -n "$MANUAL_ADDRESS" ]; then
            ADDRESS=$MANUAL_ADDRESS
        else
            echo -e "${YELLOW}Extracting SafeModuleManager implementation from broadcast...${NC}"
            ADDRESS=$(extract_from_broadcast "SafeModuleManager" "UpgradeUUPS.s.sol")
        fi
        JSON_PATH=".IMPLEMENTATIONS.SafeModuleManager"
        DESCRIPTION="SafeModuleManager Implementation"
        ;;
    module-impl)
        if [ -n "$MANUAL_ADDRESS" ]; then
            ADDRESS=$MANUAL_ADDRESS
        else
            echo -e "${YELLOW}Extracting ManagedSafeModule implementation from broadcast...${NC}"
            ADDRESS=$(extract_from_broadcast "ManagedSafeModule" "UpgradeUUPS.s.sol")
        fi
        JSON_PATH=".IMPLEMENTATIONS.ManagedSafeModule"
        DESCRIPTION="ManagedSafeModule Implementation"
        ;;
    *)
        echo -e "${RED}Error: Unknown contract type: $CONTRACT_TYPE${NC}"
        exit 1
        ;;
esac

# Validate address format
if [[ ! $ADDRESS =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo -e "${RED}Error: Invalid address format: $ADDRESS${NC}"
    exit 1
fi

echo -e "${GREEN}Found address: $ADDRESS${NC}"

# Backup networks.json
cp "$NETWORKS_JSON" "$BACKUP_FILE"
echo -e "${YELLOW}Backup created: $BACKUP_FILE${NC}"

# Get old address (if exists)
OLD_ADDRESS=$(jq -r ".networks[] | select(.name == \"$NETWORK\") | $JSON_PATH // \"not set\"" "$NETWORKS_JSON")

# Update networks.json using jq
# If IMPLEMENTATIONS doesn't exist, create it
if [[ $JSON_PATH == .IMPLEMENTATIONS.* ]]; then
    # Ensure IMPLEMENTATIONS object exists
    jq "(.networks[] | select(.name == \"$NETWORK\") | .IMPLEMENTATIONS) |= (. // {})" "$NETWORKS_JSON" > "${NETWORKS_JSON}.tmp" && \
    mv "${NETWORKS_JSON}.tmp" "$NETWORKS_JSON"
fi

# Update the address
jq "(.networks[] | select(.name == \"$NETWORK\") | $JSON_PATH) = \"$ADDRESS\"" "$NETWORKS_JSON" > "${NETWORKS_JSON}.tmp" && \
mv "${NETWORKS_JSON}.tmp" "$NETWORKS_JSON"

# Verify update
NEW_ADDRESS=$(jq -r ".networks[] | select(.name == \"$NETWORK\") | $JSON_PATH" "$NETWORKS_JSON")

if [ "$NEW_ADDRESS" == "$ADDRESS" ]; then
    echo -e "${GREEN}✅ Successfully updated networks.json${NC}"
    echo ""
    echo "Network: $NETWORK"
    echo "Contract: $DESCRIPTION"
    echo "Old Address: $OLD_ADDRESS"
    echo "New Address: $NEW_ADDRESS"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Review the changes: git diff $NETWORKS_JSON"
    echo "2. Commit: git add $NETWORKS_JSON && git commit -m 'Update $DESCRIPTION for $NETWORK'"
else
    echo -e "${RED}Error: Update failed${NC}"
    echo "Restoring backup..."
    mv "$BACKUP_FILE" "$NETWORKS_JSON"
    exit 1
fi
