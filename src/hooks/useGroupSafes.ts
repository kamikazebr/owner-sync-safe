'use client';

import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { Address } from 'viem';
import { SafeABI } from '@/lib/abis';
import { subgraphClient, GET_GROUP_SAFES } from '@/lib/subgraph-client';

export interface GroupSafe {
  safeAddress: Address;
  moduleAddress: Address;
  isActive: boolean;
}

export function useGroupSafes(managerAddress?: Address, chainId?: number) {
  const [safes, setSafes] = useState<GroupSafe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const publicClient = usePublicClient({ chainId });

  // Fetch modules from subgraph and verify on-chain status
  useEffect(() => {
    // Early returns without clearing existing safes (prevents flickering during refetches)
    if (!managerAddress) {
      // Only clear if manager changed (stale data)
      if (safes.length > 0) setSafes([]);
      setIsLoading(false);
      return;
    }

    const fetchSafes = async () => {
      setIsLoading(true);
      try {
        // Query subgraph for all modules managed by this manager
        const response = await subgraphClient.request<{
          managedSafeModules: Array<{
            id: string;
            safe: string;
            isActive: boolean;
            isConfigured: boolean;
          }>;
        }>(GET_GROUP_SAFES, {
          managerAddress: managerAddress.toLowerCase(),
        });

        const modules = response.managedSafeModules || [];

        // Verify module status on-chain if we have a public client
        // This ensures we have the most up-to-date status
        const safesList: GroupSafe[] = [];

        for (const module of modules) {
          let isActive = module.isActive;

          // Always verify on-chain if public client available to get real-time status
          if (publicClient) {
            try {
              isActive = await publicClient.readContract({
                address: module.safe as Address,
                abi: SafeABI,
                functionName: 'isModuleEnabled',
                args: [module.id as Address],
              }) as boolean;
            } catch (error) {
              console.warn(`Failed to verify module status on-chain for ${module.id}:`, error);
              // Fall back to subgraph data
            }
          }

          safesList.push({
            safeAddress: module.safe as Address,
            moduleAddress: module.id as Address,
            isActive,
          });
        }

        setSafes(safesList);
      } catch (error) {
        console.error('Error fetching group safes from subgraph:', error);
        setSafes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSafes();
  }, [managerAddress, publicClient, refreshCounter]);

  const refetch = async () => {
    // Increment counter to force useEffect to re-run
    setRefreshCounter(prev => prev + 1);
  };

  return {
    safes,
    isLoading,
    refetch,
  };
}
