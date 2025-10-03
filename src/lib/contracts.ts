import { Address } from 'viem';
import { getSafeModuleManagerAddress, getManagedSafeModuleAddress } from './deployments';

// Fallback contract addresses by chain ID (used when deployments can't be loaded)
const FALLBACK_CONTRACT_ADDRESSES: Record<number, {
  SafeModuleManager: Address;
  ManagedSafeModule: Address; // Template address
}> = {
  // Mainnet
  1: {
    SafeModuleManager: '0x0000000000000000000000000000000000000000', // Replace with actual address
    ManagedSafeModule: '0x0000000000000000000000000000000000000000', // Replace with actual address
  },
  // Sepolia
  11155111: {
    SafeModuleManager: '0x0000000000000000000000000000000000000000', // Replace with actual address
    ManagedSafeModule: '0x0000000000000000000000000000000000000000', // Replace with actual address
  },
  // Gnosis Chain
  100: {
    SafeModuleManager: '0x0000000000000000000000000000000000000000', // Replace with actual address
    ManagedSafeModule: '0x0000000000000000000000000000000000000000', // Replace with actual address
  },
};

// Get contract addresses for the current chain
export function getContractAddresses(chainId: number) {
  // Try to load from deployment files first
  const deployedSafeModuleManager = getSafeModuleManagerAddress(chainId);
  const deployedManagedSafeModule = getManagedSafeModuleAddress(chainId);

  // If we have deployment data, use it
  if (deployedSafeModuleManager && deployedManagedSafeModule) {
    return {
      SafeModuleManager: deployedSafeModuleManager,
      ManagedSafeModule: deployedManagedSafeModule,
    };
  }

  // If we have at least the manager deployed, use it with fallback for module
  if (deployedSafeModuleManager) {
    const fallback = FALLBACK_CONTRACT_ADDRESSES[chainId] || FALLBACK_CONTRACT_ADDRESSES[11155111];
    return {
      SafeModuleManager: deployedSafeModuleManager,
      ManagedSafeModule: deployedManagedSafeModule || fallback.ManagedSafeModule,
    };
  }

  // Fall back to hardcoded addresses
  return FALLBACK_CONTRACT_ADDRESSES[chainId] || FALLBACK_CONTRACT_ADDRESSES[11155111];
}

// Check if contracts are deployed on the chain
export function isChainSupported(chainId: number): boolean {
  const deployedManager = getSafeModuleManagerAddress(chainId);
  return !!deployedManager || chainId in FALLBACK_CONTRACT_ADDRESSES;
}

// Safe-related constants
export const SAFE_CONSTANTS = {
  SENTINEL_ADDRESS: '0x0000000000000000000000000000000000000001',
  MIN_THRESHOLD: 1,
  MAX_OWNERS: 50,
} as const;

// Module configuration
export const MODULE_CONFIG = {
  MAX_SYNC_OWNERS: 50,
  DEFAULT_SYNC_LIMIT: 10,
  AUTO_SYNC_DEFAULT: true,
  REQUIRE_FULL_SYNC_DEFAULT: false,
} as const;