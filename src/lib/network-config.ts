import { Address } from 'viem';
import networksJson from '../../script/config/networks.json';

export interface NetworkConfig {
  name: string;
  chainId: number;
  testnet: boolean;
  ENVS?: Record<string, string>;
  PROXIES?: Record<string, Address>;
  IMPLEMENTATIONS?: Record<string, Address>;
  METADATA?: {
    deploymentBlock?: number;
    deploymentTx?: string;
    notes?: string;
  };
}

/**
 * Get network configuration for a specific chain
 */
export function getNetworkConfig(chainId: number): NetworkConfig | undefined {
  return networksJson.networks.find(n => n.chainId === chainId) as NetworkConfig | undefined;
}

/**
 * Get deployed proxy address for a contract on a chain
 */
export function getProxyAddress(
  chainId: number,
  contractName: string
): Address | undefined {
  const network = getNetworkConfig(chainId);
  return network?.PROXIES?.[contractName] as Address | undefined;
}

/**
 * Get implementation address for a contract on a chain
 */
export function getImplementationAddress(
  chainId: number,
  contractName: string
): Address | undefined {
  const network = getNetworkConfig(chainId);
  return network?.IMPLEMENTATIONS?.[contractName] as Address | undefined;
}

/**
 * Get deployed address for a contract (tries proxy first, then implementation)
 * This is the main function for getting contract addresses
 */
export function getDeployedAddress(
  chainId: number,
  contractName: string
): Address | undefined {
  // For Registry, return the proxy address (main contract)
  if (contractName === 'SyncGroupRegistry') {
    return getProxyAddress(chainId, contractName);
  }

  // For Manager and Module templates, return implementation addresses
  return getImplementationAddress(chainId, contractName);
}

/**
 * Get deployment block for a specific chain
 * Returns the block number where the proxy was first deployed
 * Used to optimize event queries by avoiding scanning from "earliest"
 */
export function getDeploymentBlock(chainId: number): bigint | undefined {
  const network = getNetworkConfig(chainId);
  const block = network?.METADATA?.deploymentBlock;
  return block !== undefined ? BigInt(block) : undefined;
}

/**
 * Get all network configurations
 */
export function getAllNetworks(): NetworkConfig[] {
  return networksJson.networks as NetworkConfig[];
}

/**
 * Check if a chain has deployment configuration
 */
export function isChainConfigured(chainId: number): boolean {
  return getNetworkConfig(chainId) !== undefined;
}

/**
 * Get block explorer URL for a chain
 */
export function getBlockExplorerUrl(chainId: number): string {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io',
    100: 'https://gnosisscan.io',
    8453: 'https://basescan.org',
    11155111: 'https://sepolia.etherscan.io',
    84532: 'https://sepolia.basescan.org',
    31337: 'http://localhost:8545',
  };
  return explorers[chainId] || 'https://etherscan.io';
}
