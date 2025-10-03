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