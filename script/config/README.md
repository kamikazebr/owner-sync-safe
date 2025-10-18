# Network Configuration

This directory contains deployment addresses for all networks.

## networks.json

The `networks.json` file stores deployed contract addresses for each network. This is the **single source of truth** for contract addresses used by upgrade scripts.

### Structure

```json
{
  "networks": [
    {
      "name": "gnosis",
      "chainId": 100,
      "testnet": false,
      "ENVS": {
        "SENDER": "0x..."  // Default deployer address
      },
      "PROXIES": {
        "SyncGroupRegistry": "0x..."  // Registry proxy address
      }
    }
  ]
}
```

### Updating After Deployments

After deploying contracts, **manually update** this file with the new addresses:

1. **Deploy Registry** (first time):
   ```bash
   make deploy-registry-gnosis
   ```

2. **Find deployed addresses** in the broadcast output or run:
   ```bash
   cat broadcast/DeployRegistry.s.sol/100/run-latest.json | jq '.transactions[] | select(.contractName) | {contractName, contractAddress}'
   ```

3. **Update `networks.json`** with the ERC1967Proxy address (this is the Registry proxy):
   ```json
   {
     "PROXIES": {
       "SyncGroupRegistry": "0xa74c4551f0b32e0754dfecff5dc0239f23cc7844"
     }
   }
   ```

4. **Commit the changes**:
   ```bash
   git add script/config/networks.json
   git commit -m "Update Registry address for Gnosis"
   ```

### Usage in Scripts

Scripts read from this file using the `getNetworkJson()` and `getRegistryAddress()` helper functions:

```solidity
// UpgradeUUPS.s.sol
function getRegistryAddress(string memory network) internal returns (address) {
    CURRENT_NETWORK = network;
    string memory json = getNetworkJson();
    address registryAddress = json.readAddress(getKeyNetwork(".PROXIES.SyncGroupRegistry"));
    return registryAddress;
}
```

### Benefits

- ✅ **Single source of truth** - All addresses in one place
- ✅ **Version controlled** - Changes tracked in git
- ✅ **Simple** - No complex JSON parsing from broadcast files
- ✅ **Explicit** - Clear what addresses are deployed where
- ✅ **Gardens-v2 pattern** - Follows established multichain practices

### Adding New Networks

To add support for a new network (e.g., Base):

1. Deploy contracts to the new network
2. Add network config to `networks.json`:
   ```json
   {
     "name": "base",
     "chainId": 8453,
     "testnet": false,
     "ENVS": {
       "SENDER": "0x..."
     },
     "PROXIES": {
       "SyncGroupRegistry": "0x..."
     }
   }
   ```
3. Create Makefile commands for the new network (copy gnosis commands and update RPC/chain-id)
