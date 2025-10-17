'use client';

import { useEffect, useState, useRef } from 'react';
import { Address } from 'viem';
import { usePublicClient } from 'wagmi';
import { useSafeApps } from './useSafeApps';
import { SafeABI } from '@/lib/abis';
import { subgraphClient, GET_ACTIVE_GROUPS } from '@/lib/subgraph-client';

export interface ActiveGroupInfo {
  groupId: bigint;
  groupName: string;
  groupOwner: Address;
  managerAddress: Address;
  moduleAddress: Address;
}

export function useActiveGroups(chainId?: number) {
  const { isSafeApp, safeInfo } = useSafeApps();
  const publicClient = usePublicClient({ chainId });
  const [activeGroups, setActiveGroups] = useState<ActiveGroupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitialized = useRef(false);

  useEffect(() => {
    console.log('[useActiveGroups] Effect running:', {
      isSafeApp,
      hasSafeInfo: !!safeInfo,
      hasPublicClient: !!publicClient,
      hasInitialized: hasInitialized.current,
    });

    if (!isSafeApp || !safeInfo || !publicClient) {
      if (!hasInitialized.current) {
        console.log('[useActiveGroups] Not in Safe App or missing dependencies, clearing state');
        setActiveGroups([]);
        setIsLoading(false);
      }
      return;
    }

    const checkActiveGroups = async () => {
      try {
        console.log('[useActiveGroups] Starting check for Safe:', safeInfo.safeAddress);
        setIsLoading(true);

        // Query subgraph for all modules for this Safe
        const response = await subgraphClient.request<{
          managedSafeModules: Array<{
            id: string;
            manager: {
              id: string;
              group: {
                groupId: string;
                name: string;
                owner: string;
                active: boolean;
              };
            };
            isConfigured: boolean;
          }>;
        }>(GET_ACTIVE_GROUPS, {
          safeAddress: safeInfo.safeAddress.toLowerCase(),
        });

        const modules = response.managedSafeModules || [];

        console.log('[useActiveGroups] Found modules from subgraph:', modules.length);

        if (modules.length === 0) {
          console.log('[useActiveGroups] No modules found');
          setActiveGroups([]);
          hasInitialized.current = true;
          return;
        }

        // Collect ALL active modules (verify on-chain if needed)
        const active: ActiveGroupInfo[] = [];

        for (const module of modules) {
          const moduleAddress = module.id as Address;
          const managerAddress = module.manager.id as Address;
          const group = module.manager.group;

          // Skip if group is inactive
          if (!group.active) {
            console.log('[useActiveGroups] Group is inactive, skipping:', {
              groupId: group.groupId,
              groupName: group.name,
            });
            continue;
          }

          // Double-check if module is enabled on the Safe if public client available
          if (publicClient) {
            try {
              const isEnabled = await publicClient.readContract({
                address: safeInfo.safeAddress as Address,
                abi: SafeABI,
                functionName: 'isModuleEnabled',
                args: [moduleAddress],
              }) as boolean;

              console.log('[useActiveGroups] Module check:', {
                moduleAddress,
                managerAddress,
                safeAddress: safeInfo.safeAddress,
                isEnabled,
              });

              if (!isEnabled) {
                console.log('[useActiveGroups] Module not enabled on Safe, skipping');
                continue;
              }
            } catch (error) {
              console.warn('[useActiveGroups] Failed to verify module on-chain:', error);
              // Continue with subgraph data
            }
          }

          console.log('[useActiveGroups] Found active group:', {
            groupId: group.groupId,
            groupName: group.name,
            groupOwner: group.owner,
            managerAddress,
            moduleAddress,
          });

          active.push({
            groupId: BigInt(group.groupId),
            groupName: group.name,
            groupOwner: group.owner as Address,
            managerAddress,
            moduleAddress,
          });
        }

        console.log('[useActiveGroups] Total active groups found:', active.length);
        setActiveGroups(active);
        hasInitialized.current = true;

      } catch (error) {
        console.error('[useActiveGroups] Error checking active groups:', error);
        // Keep existing state on error if already initialized
        if (!hasInitialized.current) {
          setActiveGroups([]);
        }
        hasInitialized.current = true;
      } finally {
        setIsLoading(false);
      }
    };

    checkActiveGroups();
  }, [isSafeApp, safeInfo, publicClient, chainId]);

  return {
    hasActiveGroups: activeGroups.length > 0,
    activeGroups,
    isLoading,
  };
}
