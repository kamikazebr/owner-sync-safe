import { Address } from 'viem';
import { getImplementationAddress, isChainConfigured } from './network-config';

/**
 * Get contract addresses for the current chain
 * Returns implementation addresses for SafeModuleManager and ManagedSafeModule templates
 */
export function getContractAddresses(chainId: number) {
  const safeModuleManager = getImplementationAddress(chainId, 'SafeModuleManager');
  const managedSafeModule = getImplementationAddress(chainId, 'ManagedSafeModule');

  if (!safeModuleManager || !managedSafeModule) {
    throw new Error(`Contracts not deployed on chain ${chainId}. Please check script/config/networks.json`);
  }

  return {
    SafeModuleManager: safeModuleManager,
    ManagedSafeModule: managedSafeModule,
  };
}

/**
 * Check if contracts are deployed and configured for the chain
 */
export function isChainSupported(chainId: number): boolean {
  return isChainConfigured(chainId);
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