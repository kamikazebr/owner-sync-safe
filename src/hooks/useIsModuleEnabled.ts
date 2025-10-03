'use client';

import { useReadContract } from 'wagmi';
import { Address } from 'viem';
import { SafeABI } from '@/lib/abis';

export function useIsModuleEnabled(safeAddress?: Address, moduleAddress?: Address) {
  const enabled = !!safeAddress &&
                  safeAddress !== '0x0000000000000000000000000000000000000000' &&
                  !!moduleAddress &&
                  moduleAddress !== '0x0000000000000000000000000000000000000000';

  const { data, isLoading, error, refetch } = useReadContract({
    address: safeAddress,
    abi: SafeABI,
    functionName: 'isModuleEnabled',
    args: moduleAddress ? [moduleAddress] : undefined,
    query: { enabled },
  });

  return {
    isEnabled: !!data,
    isLoading,
    error,
    refetch,
  };
}
