'use client';

import { useChainId, useReadContract } from 'wagmi';
import { Address } from 'viem';
import { SafeModuleManagerABI } from '@/lib/abis';
import { getContractAddresses } from '@/lib/contracts';

interface UseModuleForSafeReturn {
  moduleAddress: Address | undefined;
  isModule: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function useModuleForSafe(safeAddress: Address | undefined): UseModuleForSafeReturn {
  const chainId = useChainId();
  const contractAddresses = getContractAddresses(chainId);

  // Get module address for the Safe using getModuleForSafe function
  const { data: moduleAddress, isLoading: isLoadingModule, error: moduleError } = useReadContract({
    address: contractAddresses.SafeModuleManager,
    abi: SafeModuleManagerABI,
    functionName: 'getModuleForSafe',
    args: safeAddress ? [safeAddress] : undefined,
    query: { enabled: !!safeAddress },
  });

  // Check if the Safe has a module using hasModule function
  const { data: hasModule, isLoading: isLoadingHasModule, error: hasModuleError } = useReadContract({
    address: contractAddresses.SafeModuleManager,
    abi: SafeModuleManagerABI,
    functionName: 'hasModule',
    args: safeAddress ? [safeAddress] : undefined,
    query: { enabled: !!safeAddress },
  });

  return {
    moduleAddress: moduleAddress as Address | undefined,
    isModule: !!hasModule,
    isLoading: isLoadingModule || isLoadingHasModule,
    error: moduleError || hasModuleError,
  };
}