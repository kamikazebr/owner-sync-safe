'use client';

import { useEffect, useState, useRef } from 'react';
import { Address } from 'viem';
import { usePublicClient } from 'wagmi';
import { useSafeApps } from './useSafeApps';
import { SafeABI } from '@/lib/abis';
import { getSubgraphClient, GET_PENDING_SETUPS } from '@/lib/subgraph-client';

export interface PendingSetupInfo {
  groupId: bigint;
  groupName: string;
  managerAddress: Address;
  moduleAddress: Address;
  createdBy: Address; // Who added this Safe to the group
  timestamp: bigint;
}

export function usePendingSetup(chainId?: number) {
  const { isSafeApp, safeInfo } = useSafeApps();
  const publicClient = usePublicClient({ chainId });
  const [pendingSetups, setPendingSetups] = useState<PendingSetupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitialized = useRef(false);

  useEffect(() => {
    console.log('[usePendingSetup] Effect running:', {
      isSafeApp,
      hasSafeInfo: !!safeInfo,
      hasPublicClient: !!publicClient,
      hasInitialized: hasInitialized.current,
    });

    if (!isSafeApp || !safeInfo || !publicClient) {
      // Only clear if we haven't initialized yet
      if (!hasInitialized.current) {
        console.log('[usePendingSetup] Not in Safe App or missing dependencies, clearing state');
        setPendingSetups([]);
        setIsLoading(false);
      }
      return;
    }

    const checkPendingSetup = async () => {
      try {
        console.log('[usePendingSetup] Starting check for Safe:', safeInfo.safeAddress);
        setIsLoading(true);

        // Query subgraph for modules that are created but not configured
        const client = getSubgraphClient(chainId || 100);
        const response = await client.request<{
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
            createdAt: string;
          }>;
        }>(GET_PENDING_SETUPS, {
          safeAddress: safeInfo.safeAddress.toLowerCase(),
        });

        const modules = response.managedSafeModules || [];

        console.log('[usePendingSetup] Query variables:', {
          safeAddress: safeInfo.safeAddress.toLowerCase(),
          query: 'GET_PENDING_SETUPS with isActive: false',
        });
        console.log('[usePendingSetup] Found pending modules from subgraph:', modules.length);
        console.log('[usePendingSetup] Raw response:', response);

        if (modules.length === 0) {
          console.log('[usePendingSetup] No pending modules found');
          setPendingSetups([]);
          hasInitialized.current = true;
          return;
        }

        // Collect ALL inactive modules (multiple groups can invite the same Safe)
        const pending: PendingSetupInfo[] = [];

        for (const module of modules) {
          const moduleAddress = module.id as Address;
          const managerAddress = module.manager.id as Address;
          const group = module.manager.group;

          // Skip if group is inactive
          if (!group.active) {
            console.log('[usePendingSetup] Group is inactive, skipping:', {
              groupId: group.groupId,
              groupName: group.name,
            });
            continue;
          }

          // Optional: Check if module is enabled (for informational purposes)
          // We show pending setups regardless of enabled status, since user needs
          // to enable the module first before they can configure it
          if (publicClient) {
            try {
              const isEnabled = await publicClient.readContract({
                address: safeInfo.safeAddress as Address,
                abi: SafeABI,
                functionName: 'isModuleEnabled',
                args: [moduleAddress],
              }) as boolean;

              console.log('[usePendingSetup] Module check:', {
                moduleAddress,
                managerAddress,
                safeAddress: safeInfo.safeAddress,
                isEnabled,
              });
            } catch (error) {
              console.warn('[usePendingSetup] Failed to verify module on-chain:', error);
              // Continue with subgraph data
            }
          }

          console.log('[usePendingSetup] Found pending setup:', {
            groupId: group.groupId,
            groupName: group.name,
            managerAddress,
            moduleAddress,
            timestamp: module.createdAt,
          });

          pending.push({
            groupId: BigInt(group.groupId),
            groupName: group.name,
            managerAddress,
            moduleAddress,
            createdBy: group.owner as Address,
            timestamp: BigInt(module.createdAt),
          });
        }

        console.log('[usePendingSetup] Total pending setups found:', pending.length);
        setPendingSetups(pending);
        hasInitialized.current = true;

      } catch (error) {
        console.error('[usePendingSetup] Error checking pending setup:', error);
        // Only clear state if we haven't successfully initialized yet
        // This prevents losing the banner when re-renders cause RPC errors
        if (!hasInitialized.current) {
          setPendingSetups([]);
        }
        hasInitialized.current = true;
      } finally {
        setIsLoading(false);
      }
    };

    checkPendingSetup();
  }, [isSafeApp, safeInfo, publicClient, chainId]);

  return {
    hasPendingSetup: pendingSetups.length > 0,
    pendingSetups,
    isLoading,
  };
}
