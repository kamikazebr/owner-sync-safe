// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IMessagingBridge
 * @notice Unified interface for cross-chain messaging protocols
 * @dev Implementations must handle protocol-specific encoding/decoding
 */
interface IMessagingBridge {
    /// @notice Emitted when a cross-chain message is sent
    /// @param messageId Unique identifier for tracking
    /// @param destChainId Destination chain identifier (EVM chain ID)
    /// @param destContract Target contract address on destination
    /// @param payload Encoded message data
    event MessageSent(
        bytes32 indexed messageId,
        uint256 indexed destChainId,
        address indexed destContract,
        bytes payload
    );

    /// @notice Emitted when a cross-chain message is received
    /// @param messageId Unique identifier for tracking
    /// @param sourceChainId Origin chain identifier
    /// @param sourceContract Origin contract address
    /// @param payload Decoded message data
    event MessageReceived(
        bytes32 indexed messageId,
        uint256 indexed sourceChainId,
        address indexed sourceContract,
        bytes payload
    );

    /**
     * @notice Send cross-chain message
     * @param destChainId Destination chain ID (EVM standard)
     * @param destContract Target contract on destination chain
     * @param payload Encoded message data
     * @param gasLimit Gas limit for execution on destination
     * @return messageId Unique identifier for tracking delivery status
     */
    function sendMessage(
        uint256 destChainId,
        address destContract,
        bytes calldata payload,
        uint256 gasLimit
    ) external payable returns (bytes32 messageId);

    /**
     * @notice Estimate fees for cross-chain message
     * @param destChainId Destination chain ID
     * @param payload Message payload (affects size-based fees)
     * @param gasLimit Gas limit on destination
     * @return fee Total fee in native token (wei)
     */
    function estimateFees(
        uint256 destChainId,
        bytes calldata payload,
        uint256 gasLimit
    ) external view returns (uint256 fee);

    /**
     * @notice Check if message was delivered
     * @param messageId Message identifier from sendMessage()
     * @return delivered True if message executed on destination
     */
    function isMessageDelivered(bytes32 messageId)
        external
        view
        returns (bool delivered);

    /**
     * @notice Get protocol-specific chain ID from EVM chain ID
     * @dev CCIP uses chain selectors, LayerZero uses endpoint IDs
     * @param evmChainId Standard EVM chain ID
     * @return protocolChainId Protocol-specific identifier
     */
    function getProtocolChainId(uint256 evmChainId)
        external
        view
        returns (uint256 protocolChainId);

    /**
     * @notice Get protocol name
     * @return name "CCIP" or "LayerZero"
     */
    function protocolName() external pure returns (string memory name);
}
