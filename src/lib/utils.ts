import { type ClassValue, clsx } from 'clsx';
import { Address } from 'viem';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Address validation
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Truncate address for display
export function truncateAddress(address: Address, length = 6): string {
  if (!address) return '';
  return `${address.slice(0, length)}...${address.slice(-4)}`;
}

// Format threshold display
export function formatThreshold(threshold: number, totalOwners: number): string {
  return `${threshold}/${totalOwners}`;
}

// Check if address is the sentinel address used by Safe
export function isSentinelAddress(address: Address): boolean {
  return address.toLowerCase() === '0x0000000000000000000000000000000000000001';
}

// Get previous owner for Safe operations
export function getPreviousOwner(owners: Address[], targetOwner: Address): Address | null {
  const index = owners.findIndex(owner => owner.toLowerCase() === targetOwner.toLowerCase());
  if (index === -1) return null;
  if (index === 0) return '0x0000000000000000000000000000000000000001' as Address; // SENTINEL
  return owners[index - 1];
}

// Validate threshold
export function isValidThreshold(threshold: number, ownerCount: number): boolean {
  return threshold >= 1 && threshold <= ownerCount;
}

// Format sync status
export function formatSyncStatus(
  syncedOwners: number,
  isComplete: boolean,
  totalOwners?: number
): string {
  if (isComplete) {
    return `Sincronizado (${syncedOwners} owners)`;
  }
  if (totalOwners) {
    return `Parcialmente sincronizado (${syncedOwners}/${totalOwners})`;
  }
  return `Parcialmente sincronizado (${syncedOwners} owners)`;
}

// Generate operation description
export function getOperationDescription(operation: string, params: any): string {
  switch (operation) {
    case 'addOwner':
      return `Adicionar owner ${truncateAddress(params.newOwner)}`;
    case 'removeOwner':
      return `Remover owner ${truncateAddress(params.ownerToRemove)}`;
    case 'replaceOwner':
      return `Substituir ${truncateAddress(params.oldOwner)} por ${truncateAddress(params.newOwner)}`;
    case 'changeThreshold':
      return `Alterar threshold para ${params.threshold}`;
    case 'syncOwners':
      return 'Sincronizar owners do Safe';
    case 'enableModule':
      return 'Habilitar módulo no Safe';
    case 'createModule':
      return 'Criar novo módulo';
    default:
      return operation;
  }
}

// Error handling
export function getErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.reason) return error.reason;
  return 'Ocorreu um erro desconhecido';
}

// Transaction status helpers
export function getTransactionStatusColor(status: 'pending' | 'success' | 'error' | 'idle'): string {
  switch (status) {
    case 'pending':
      return 'text-yellow-600 bg-yellow-100';
    case 'success':
      return 'text-green-600 bg-green-100';
    case 'error':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

// Safe detection
export function isSafeAddress(address: Address): boolean {
  // Basic validation - in production, you might want to check the contract code
  return isValidAddress(address) && !isSentinelAddress(address);
}

/**
 * Extract Safe address from various input formats
 * Supports:
 * - Full URLs: https://app.safe.global/home?safe=gno:0x123...
 * - Full URLs: https://app.safe.global/transactions/tx?safe=gno:0x123...
 * - Chain prefix: gno:0x123...
 * - Direct address: 0x123...
 *
 * @param input - URL, chain-prefixed address, or direct address
 * @returns Ethereum address or null if invalid
 */
export function extractSafeAddress(input: string): string | null {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  // Try to parse as URL
  try {
    const url = new URL(trimmed);
    // Extract from ?safe=chain:address or ?safe=address
    const safeParam = url.searchParams.get('safe');
    if (safeParam) {
      // Remove chain prefix (e.g., "gno:0x123" -> "0x123")
      const address = safeParam.includes(':') ? safeParam.split(':')[1] : safeParam;
      return isValidAddress(address) ? address : null;
    }
  } catch {
    // Not a URL, continue with other formats
  }

  // Try to match chain:address pattern anywhere in the string
  const chainPrefixMatch = trimmed.match(/(?:gno|eth|matic|arb|oeth|base|sep|gor|ogor|zkevm|zksync|aurora|avax|bnb|celo|gno|gnosis):0x[a-fA-F0-9]{40}/);
  if (chainPrefixMatch) {
    const address = chainPrefixMatch[0].split(':')[1];
    return isValidAddress(address) ? address : null;
  }

  // Check if it has chain prefix (e.g., "gno:0x123")
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    if (parts.length >= 2) {
      // Take everything after first colon
      const address = parts.slice(1).join(':');
      if (isValidAddress(address)) {
        return address;
      }
    }
  }

  // Try to extract any Ethereum address from the string
  const addressMatch = trimmed.match(/0x[a-fA-F0-9]{40}/);
  if (addressMatch && isValidAddress(addressMatch[0])) {
    return addressMatch[0];
  }

  return null;
}

/**
 * Chain prefix to chain ID mapping
 */
export const CHAIN_PREFIX_TO_ID: Record<string, number> = {
  'gno': 100,
  'gnosis': 100,
  'eth': 1,
  'matic': 137,
  'arb': 42161,
  'oeth': 10,
  'base': 8453,
  'sep': 11155111,
  'gor': 5,
  'celo': 42220,
};

/**
 * Chain ID to display name mapping
 */
export const CHAIN_ID_TO_NAME: Record<number, string> = {
  100: 'Gnosis',
  1: 'Ethereum',
  137: 'Polygon',
  42161: 'Arbitrum',
  10: 'Optimism',
  8453: 'Base',
  11155111: 'Sepolia',
  5: 'Goerli',
  42220: 'Celo',
};

/**
 * Extract Safe address and chain from various input formats
 * @param input - URL, chain-prefixed address, or direct address
 * @returns Object with address and chainId, or null if invalid
 */
export function extractSafeAddressWithChain(input: string): { address: string; chainId: number | null } | null {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();
  let chainPrefix: string | null = null;

  // Try to parse as URL
  try {
    const url = new URL(trimmed);
    // Extract from ?safe=chain:address or ?safe=address
    const safeParam = url.searchParams.get('safe');
    if (safeParam) {
      if (safeParam.includes(':')) {
        const [prefix, address] = safeParam.split(':', 2);
        if (isValidAddress(address)) {
          chainPrefix = prefix;
          return {
            address,
            chainId: CHAIN_PREFIX_TO_ID[prefix.toLowerCase()] ?? null,
          };
        }
      } else if (isValidAddress(safeParam)) {
        return { address: safeParam, chainId: null };
      }
    }
  } catch {
    // Not a URL, continue with other formats
  }

  // Try to match chain:address pattern
  const chainPrefixMatch = trimmed.match(/(gno|eth|matic|arb|oeth|base|sep|gor|ogor|zkevm|zksync|aurora|avax|bnb|celo|gnosis):0x[a-fA-F0-9]{40}/);
  if (chainPrefixMatch) {
    const [fullMatch] = chainPrefixMatch;
    const [prefix, address] = fullMatch.split(':', 2);
    if (isValidAddress(address)) {
      return {
        address,
        chainId: CHAIN_PREFIX_TO_ID[prefix.toLowerCase()] ?? null,
      };
    }
  }

  // Check if it has chain prefix (e.g., "gno:0x123")
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    if (parts.length >= 2) {
      const [prefix, ...addressParts] = parts;
      const address = addressParts.join(':');
      if (isValidAddress(address)) {
        return {
          address,
          chainId: CHAIN_PREFIX_TO_ID[prefix.toLowerCase()] ?? null,
        };
      }
    }
  }

  // Try to extract any Ethereum address from the string
  const addressMatch = trimmed.match(/0x[a-fA-F0-9]{40}/);
  if (addressMatch && isValidAddress(addressMatch[0])) {
    return { address: addressMatch[0], chainId: null };
  }

  return null;
}