// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.6;

import "forge-std/Script.sol";
import "forge-std/StdJson.sol";

/**
 * @title BaseMultiChain
 * @notice Base contract for multichain deployment and upgrade scripts
 * @dev Provides reusable helpers for reading network configuration from networks.json
 *
 * Pattern borrowed from gardens-v2:
 * - Single source of truth: script/config/networks.json
 * - Consistent network config reading across all scripts
 * - Easy to extend with new helper functions
 */
abstract contract BaseMultiChain is Script {
    using stdJson for string;

    // Current network name (set by child contracts)
    string public CURRENT_NETWORK = "gnosis";

    /**
     * @notice Build JSONPath key for querying network-specific config
     * @param key The config key to query (e.g., ".chainId", ".PROXIES.SyncGroupRegistry")
     * @return JSONPath query string like "$.networks[?(@.name=='gnosis')].chainId"
     */
    function getKeyNetwork(string memory key) internal view returns (string memory) {
        string memory networkSelected = CURRENT_NETWORK;
        string memory jqNetworkSelected = string.concat("$.networks[?(@.name=='", networkSelected, "')]");
        return string.concat(jqNetworkSelected, key);
    }

    /**
     * @notice Read networks.json configuration file
     * @return JSON string content of networks.json
     */
    function getNetworkJson() internal view returns (string memory) {
        string memory root = vm.projectRoot();
        string memory path = string.concat(root, "/script/config/networks.json");
        string memory json = vm.readFile(path);
        return json;
    }

    /**
     * @notice Get deployed SyncGroupRegistry address from networks.json
     * @param network Network name (e.g., "gnosis", "base")
     * @return Registry proxy address
     */
    function getRegistryAddress(string memory network) internal returns (address) {
        CURRENT_NETWORK = network;
        string memory json = getNetworkJson();

        address registryAddress = json.readAddress(getKeyNetwork(".PROXIES.SyncGroupRegistry"));

        if (registryAddress == address(0)) {
            revert("SyncGroupRegistry not found in networks.json");
        }

        return registryAddress;
    }

    /**
     * @notice Get deployer/sender address from networks.json
     * @param network Network name (e.g., "gnosis", "base")
     * @return Deployer address
     */
    function getSenderAddress(string memory network) internal returns (address) {
        CURRENT_NETWORK = network;
        string memory json = getNetworkJson();

        address sender = json.readAddress(getKeyNetwork(".ENVS.SENDER"));

        if (sender == address(0)) {
            revert("SENDER not found in networks.json");
        }

        return sender;
    }
}
