// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IMessagingReceiver
 * @notice Interface for contracts that receive cross-chain messages
 * @dev Implement this in CrossChainExecutor on spoke chains
 */
interface IMessagingReceiver {
    /**
     * @notice Handle incoming cross-chain message
     * @param sourceChainId Origin chain ID (EVM standard)
     * @param sourceContract Origin contract address
     * @param payload Message data
     */
    function receiveMessage(
        uint256 sourceChainId,
        address sourceContract,
        bytes calldata payload
    ) external;
}
