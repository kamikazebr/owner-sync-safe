// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IMessagingBridge} from "../interfaces/IMessagingBridge.sol";
import {IMessagingReceiver} from "../interfaces/IMessagingReceiver.sol";
import {IRouterClient} from "../../lib/ccip/contracts/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "../../lib/ccip/contracts/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "../../lib/ccip/contracts/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title CCIPBridge
 * @notice Adapter for Chainlink CCIP messaging protocol
 * @dev UUPS upgradeable, inherits CCIPReceiver for incoming messages
 */
contract CCIPBridge is
    Initializable,
    IMessagingBridge,
    CCIPReceiver,
    UUPSUpgradeable,
    OwnableUpgradeable
{
    /// @notice Mapping EVM chain ID => CCIP chain selector
    mapping(uint256 => uint64) public chainIdToSelector;

    /// @notice Mapping CCIP chain selector => EVM chain ID
    mapping(uint64 => uint256) public selectorToChainId;

    /// @notice Mapping message ID => delivery status
    mapping(bytes32 => bool) public messageDelivered;

    /// @notice Target contract that receives messages on this chain
    address public receiver;

    /// @notice CCIP Router contract
    IRouterClient public router;

    error InvalidChainId(uint256 chainId);
    error InvalidReceiver(address receiver);
    error UnauthorizedCaller(address caller);
    error InsufficientFee(uint256 provided, uint256 required);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address _router) CCIPReceiver(_router) {
        _disableInitializers();
    }

    /**
     * @notice Initialize adapter
     * @param _owner Contract owner address
     * @param _receiver Contract that handles incoming messages
     */
    function initialize(
        address _owner,
        address _receiver
    ) external initializer {
        __Ownable_init(_owner);
        __UUPSUpgradeable_init();

        if (_receiver == address(0)) revert InvalidReceiver(_receiver);

        router = IRouterClient(i_ccipRouter);
        receiver = _receiver;

        // Initialize chain ID mappings (Mainnet - January 2026)
        _setChainMapping(100, 465200170687744372);  // Gnosis
        _setChainMapping(42220, 1346049177634351622); // Celo
        _setChainMapping(137, 4051577828743386545);   // Polygon
        _setChainMapping(8453, 15971525489660198786);  // Base
        _setChainMapping(10, 3734403246176062136);    // Optimism
        _setChainMapping(42161, 4949039107694359620); // Arbitrum One
    }

    /**
     * @notice Send cross-chain message via CCIP
     */
    function sendMessage(
        uint256 destChainId,
        address destContract,
        bytes calldata payload,
        uint256 gasLimit
    ) external payable override returns (bytes32 messageId) {
        uint64 destSelector = chainIdToSelector[destChainId];
        if (destSelector == 0) revert InvalidChainId(destChainId);

        // Build CCIP message
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(destContract),
            data: payload,
            tokenAmounts: new Client.EVMTokenAmount[](0), // No tokens
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: gasLimit})
            ),
            feeToken: address(0) // Pay in native token
        });

        // Calculate fee
        uint256 fee = router.getFee(destSelector, message);
        if (msg.value < fee) {
            revert InsufficientFee(msg.value, fee);
        }

        // Send message
        messageId = router.ccipSend{value: fee}(destSelector, message);

        emit MessageSent(messageId, destChainId, destContract, payload);
    }

    /**
     * @notice Estimate CCIP fees
     */
    function estimateFees(
        uint256 destChainId,
        bytes calldata payload,
        uint256 gasLimit
    ) external view override returns (uint256 fee) {
        uint64 destSelector = chainIdToSelector[destChainId];
        if (destSelector == 0) revert InvalidChainId(destChainId);

        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(address(0)), // Placeholder
            data: payload,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: gasLimit})
            ),
            feeToken: address(0)
        });

        return router.getFee(destSelector, message);
    }

    /**
     * @notice Check message delivery status
     * @dev CCIP doesn't provide direct status query; we track internally
     */
    function isMessageDelivered(bytes32 messageId)
        external
        view
        override
        returns (bool)
    {
        return messageDelivered[messageId];
    }

    /**
     * @notice Get CCIP chain selector from EVM chain ID
     */
    function getProtocolChainId(uint256 evmChainId)
        external
        view
        override
        returns (uint256)
    {
        return uint256(chainIdToSelector[evmChainId]);
    }

    /**
     * @notice Return protocol name
     */
    function protocolName() external pure override returns (string memory) {
        return "CCIP";
    }

    /**
     * @notice Handle incoming CCIP message
     * @dev Called by CCIP Router, restricted by CCIPReceiver
     */
    function _ccipReceive(
        Client.Any2EVMMessage memory message
    ) internal override {
        uint64 sourceSelector = message.sourceChainSelector;
        uint256 sourceChainId = selectorToChainId[sourceSelector];
        address sourceContract = abi.decode(message.sender, (address));

        // Mark as delivered
        messageDelivered[message.messageId] = true;

        // Forward to receiver contract
        IMessagingReceiver(receiver).receiveMessage(
            sourceChainId,
            sourceContract,
            message.data
        );

        emit MessageReceived(
            message.messageId,
            sourceChainId,
            sourceContract,
            message.data
        );
    }

    /**
     * @notice Set chain ID mapping (owner only)
     */
    function setChainMapping(uint256 evmChainId, uint64 ccipSelector)
        external
        onlyOwner
    {
        _setChainMapping(evmChainId, ccipSelector);
    }

    /**
     * @notice Internal function to set chain mapping
     */
    function _setChainMapping(uint256 evmChainId, uint64 ccipSelector)
        internal
    {
        chainIdToSelector[evmChainId] = ccipSelector;
        selectorToChainId[ccipSelector] = evmChainId;
    }

    /**
     * @notice Authorize UUPS upgrades (owner only)
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}
}
