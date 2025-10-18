import { Address, encodeFunctionData, encodePacked, keccak256 } from 'viem';

/**
 * Safe MultiSend contract addresses (same across all networks)
 */
export const MULTI_SEND_ADDRESSES = {
  multiSend: '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D' as Address,
  multiSendCallOnly: '0x9641d764fc13c8B624c04430C7356C1C7C8102e2' as Address,
};

/**
 * Sentinel address used in Safe's linked list
 */
export const SENTINEL_ADDRESS = '0x0000000000000000000000000000000000000001' as Address;

/**
 * Operation types for Safe transactions
 */
export enum OperationType {
  Call = 0,
  DelegateCall = 1,
}

/**
 * Individual transaction for batching
 */
export interface MetaTransaction {
  to: Address;
  value: bigint;
  data: `0x${string}`;
  operation?: OperationType;
}

/**
 * Encode a single transaction for MultiSend
 */
function encodeMetaTransaction(tx: MetaTransaction): `0x${string}` {
  const operation = tx.operation ?? OperationType.Call;
  const data = tx.data;
  const dataLength = BigInt((data.length - 2) / 2); // Remove 0x and divide by 2 for byte length

  return encodePacked(
    ['uint8', 'address', 'uint256', 'uint256', 'bytes'],
    [operation, tx.to, tx.value, dataLength, data]
  );
}

/**
 * Encode multiple transactions for Safe's MultiSend contract
 * @param transactions Array of transactions to batch
 * @returns Encoded data for MultiSend.multiSend()
 */
export function encodeMultiSend(transactions: MetaTransaction[]): `0x${string}` {
  const encodedTransactions = transactions.map(encodeMetaTransaction);
  const concatenated = encodePacked(
    Array(encodedTransactions.length).fill('bytes'),
    encodedTransactions
  );

  // multiSend(bytes memory transactions)
  return encodeFunctionData({
    abi: [{
      name: 'multiSend',
      type: 'function',
      inputs: [{ name: 'transactions', type: 'bytes' }],
      outputs: [],
      stateMutability: 'payable',
    }],
    functionName: 'multiSend',
    args: [concatenated],
  });
}

/**
 * Build a Safe transaction that executes multiple calls via MultiSend
 * @param transactions Array of transactions to batch
 * @param useCallOnly If true, uses MultiSendCallOnly (no delegatecalls allowed)
 * @returns Transaction to send to Safe
 */
export function buildMultiSendTransaction(
  transactions: MetaTransaction[],
  useCallOnly: boolean = true
): MetaTransaction {
  const multiSendAddress = useCallOnly
    ? MULTI_SEND_ADDRESSES.multiSendCallOnly
    : MULTI_SEND_ADDRESSES.multiSend;

  return {
    to: multiSendAddress,
    value: 0n,
    data: encodeMultiSend(transactions),
    operation: OperationType.DelegateCall, // MultiSend must be delegatecalled
  };
}

/**
 * Encode a Safe.disableModule() call
 */
export function encodeDisableModule(
  safeAddress: Address,
  moduleAddress: Address,
  prevModule: Address = SENTINEL_ADDRESS
): MetaTransaction {
  return {
    to: safeAddress,
    value: 0n,
    data: encodeFunctionData({
      abi: [{
        name: 'disableModule',
        type: 'function',
        inputs: [
          { name: 'prevModule', type: 'address' },
          { name: 'module', type: 'address' }
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      }],
      functionName: 'disableModule',
      args: [prevModule, moduleAddress],
    }),
  };
}

/**
 * Encode a Safe.enableModule() call
 */
export function encodeEnableModule(
  safeAddress: Address,
  moduleAddress: Address
): MetaTransaction {
  return {
    to: safeAddress,
    value: 0n,
    data: encodeFunctionData({
      abi: [{
        name: 'enableModule',
        type: 'function',
        inputs: [{ name: 'module', type: 'address' }],
        outputs: [],
        stateMutability: 'nonpayable',
      }],
      functionName: 'enableModule',
      args: [moduleAddress],
    }),
  };
}

/**
 * Build URL to Safe Transaction Builder with pre-filled transaction
 */
export function buildSafeTransactionBuilderUrl(
  chainId: number,
  safeAddress: Address,
  transaction: MetaTransaction
): string {
  const chainPrefix = chainId === 100 ? 'gno' : 'eth';

  // Transaction Builder expects JSON with transaction details
  const txData = {
    to: transaction.to,
    value: transaction.value.toString(),
    data: transaction.data,
    operation: transaction.operation ?? OperationType.Call,
  };

  // Encode as base64 for URL
  const encoded = btoa(JSON.stringify(txData));

  return `https://app.safe.global/apps/open?safe=${chainPrefix}:${safeAddress}&appUrl=https://apps-portal.safe.global/tx-builder&data=${encoded}`;
}

/**
 * Build URL to Safe home page for a specific Safe address
 */
export function buildSafeHomeUrl(
  chainId: number,
  safeAddress: Address
): string {
  const chainPrefix = chainId === 100 ? 'gno' : 'eth';
  return `https://app.safe.global/home?safe=${chainPrefix}:${safeAddress}`;
}

/**
 * Build URL to open app in Safe with custom app URL
 */
export function buildSafeAppUrl(
  chainId: number,
  safeAddress: Address,
  appUrl: string
): string {
  const chainPrefix = chainId === 100 ? 'gno' : 'eth';
  return `https://app.safe.global/apps/open?safe=${chainPrefix}:${safeAddress}&appUrl=${encodeURIComponent(appUrl)}`;
}

/**
 * Build URL to Safe modules settings page
 */
export function buildSafeModulesUrl(
  chainId: number,
  safeAddress: Address
): string {
  const chainPrefix = chainId === 100 ? 'gno' : 'eth';
  return `https://app.safe.global/settings/modules?safe=${chainPrefix}:${safeAddress}`;
}

/**
 * Encode a SyncGroupRegistry.deactivateGroup() call
 */
export function encodeDeactivateGroup(
  registryAddress: Address,
  groupId: bigint
): MetaTransaction {
  return {
    to: registryAddress,
    value: 0n,
    data: encodeFunctionData({
      abi: [{
        name: 'deactivateGroup',
        type: 'function',
        inputs: [{ name: 'groupId', type: 'uint256' }],
        outputs: [],
        stateMutability: 'nonpayable',
      }],
      functionName: 'deactivateGroup',
      args: [groupId],
    }),
  };
}
