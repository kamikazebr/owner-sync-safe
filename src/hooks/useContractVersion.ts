'use client';

import { useReadContract } from 'wagmi';
import { Address } from 'viem';

/**
 * ABI for the getVersion() function
 * All UUPS contracts (Registry, Manager, Module) implement this
 */
const VERSION_ABI = [
  {
    type: 'function',
    name: 'getVersion',
    stateMutability: 'pure',
    inputs: [],
    outputs: [{ name: 'version', type: 'string' }],
  },
] as const;

/**
 * Hook to read the version from a deployed contract
 * Contracts must implement: function getVersion() external pure returns (string memory version)
 *
 * @param address - Contract address to read version from
 * @param chainId - Chain ID where contract is deployed
 * @returns Contract version string (e.g., "2.0.0-uups" or "1.0.0")
 *
 * @example
 * const { version, isLoading, error } = useContractVersion(
 *   '0x1d9aafd517d85450bD85169eF291298a016da202',
 *   100
 * );
 */
export function useContractVersion(address: Address | undefined, chainId: number) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: address,
    abi: VERSION_ABI,
    functionName: 'getVersion',
    chainId,
    query: {
      enabled: !!address,
    },
  });

  return {
    version: data as string | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to read versions from multiple contracts simultaneously
 * Useful for displaying all contract versions in admin/debug UI
 *
 * @param contracts - Array of {name, address} objects
 * @param chainId - Chain ID
 * @returns Object mapping contract names to their versions
 *
 * @example
 * const versions = useContractVersions([
 *   { name: 'Registry', address: '0x1d9a...' },
 *   { name: 'Manager', address: '0x3CB5...' },
 * ], 100);
 * // Result: { Registry: "1.0.0", Manager: "2.0.0-uups" }
 */
export function useContractVersions(
  contracts: Array<{ name: string; address: Address }>,
  chainId: number
) {
  const versions: Record<string, string | undefined> = {};

  // Read version for each contract
  contracts.forEach(({ name, address }) => {
    const { data } = useReadContract({
      address,
      abi: VERSION_ABI,
      functionName: 'getVersion',
      chainId,
    });
    versions[name] = data as string | undefined;
  });

  return versions;
}
