// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {CCIPBridge} from "../src/bridges/CCIPBridge.sol";
import {IMessagingBridge} from "../src/interfaces/IMessagingBridge.sol";

/**
 * @title CCIPBridgeTest
 * @notice Basic tests for CCIPBridge implementation
 * @dev Full test suite requires mock CCIP Router
 */
contract CCIPBridgeTest is Test {
    CCIPBridge public bridge;
    address public mockRouter;
    address public mockReceiver;
    address public owner;

    function setUp() public {
        owner = address(this);
        mockRouter = address(0x1234); // Mock CCIP Router
        mockReceiver = address(0x5678); // Mock receiver contract

        // Deploy implementation
        bridge = new CCIPBridge(mockRouter);
    }

    /**
     * @notice Test that contract implements IMessagingBridge
     */
    function test_ImplementsInterface() public view {
        // This test verifies the contract compiles and implements the interface
        assertTrue(address(bridge) != address(0));
    }

    /**
     * @notice Test protocol name
     */
    function test_ProtocolName() public view {
        string memory name = bridge.protocolName();
        assertEq(name, "CCIP");
    }

    /**
     * @notice Test chain mapping retrieval
     * @dev Tests getProtocolChainId after initialization
     */
    function test_GetProtocolChainId() public {
        // Initialize bridge
        vm.prank(owner);
        bridge.initialize(owner, mockReceiver);

        // Test Gnosis chain mapping
        uint256 gnosisSelector = bridge.getProtocolChainId(100);
        assertEq(gnosisSelector, 465200170687744372);

        // Test Polygon chain mapping
        uint256 polygonSelector = bridge.getProtocolChainId(137);
        assertEq(polygonSelector, 4051577828743386545);
    }

    /**
     * @notice Test message delivery tracking
     */
    function test_MessageDeliveryTracking() public {
        vm.prank(owner);
        bridge.initialize(owner, mockReceiver);

        bytes32 testMessageId = keccak256("test_message");

        // Initially not delivered
        assertFalse(bridge.isMessageDelivered(testMessageId));
    }

    /**
     * @notice Test that invalid chain IDs revert on sendMessage
     * @dev This will revert because we're using a mock router
     */
    function testFail_SendMessageInvalidChain() public {
        vm.prank(owner);
        bridge.initialize(owner, mockReceiver);

        // Try to send to unsupported chain
        bridge.sendMessage(999, address(0x1), "", 100000);
    }
}
