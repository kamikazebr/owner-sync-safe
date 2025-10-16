'use client';

import { useEffect, useState, useRef } from 'react';
import { Address, parseAbiItem } from 'viem';
import { usePublicClient } from 'wagmi';
import { useSafeApps } from './useSafeApps';
import { SafeABI } from '@/lib/abis';
import { getDeployedAddress, getDeploymentBlock } from '@/lib/deployments';

// Registry ABI for group lookup
const REGISTRY_ABI = [
  {
    type: 'function',
    name: 'getGroupByManager',
    stateMutability: 'view',
    inputs: [{ name: 'manager', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getGroup',
    stateMutability: 'view',
    inputs: [{ name: 'groupId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'manager', type: 'address' },
          { name: 'template', type: 'address' },
          { name: 'owner', type: 'address' },
          { name: 'name', type: 'string' },
          { name: 'active', type: 'bool' },
          { name: 'createdAt', type: 'uint256' },
        ],
      },
    ],
  },
] as const;

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

        // Get deployment block to optimize query (avoid scanning millions of blocks)
        const deploymentBlock = getDeploymentBlock(chainId ?? 100);
        const fromBlock = deploymentBlock ? deploymentBlock : 'earliest';

        // Get all ModuleCreated events for this Safe
        const logs = await publicClient.getLogs({
          event: parseAbiItem('event ModuleCreated(address indexed safe, address indexed module)'),
          args: {
            safe: safeInfo.safeAddress as Address,
          },
          fromBlock,
          toBlock: 'latest',
        });

        console.log('[useActiveGroups] Found logs:', logs.length);

        if (logs.length === 0) {
          console.log('[useActiveGroups] No ModuleCreated events found');
          setActiveGroups([]);
          hasInitialized.current = true;
          return;
        }

        // Collect ALL active modules (enabled on the Safe)
        const active: ActiveGroupInfo[] = [];

        for (const log of logs) {
          if (!log.args.module || !log.address) continue;

          const moduleAddress = log.args.module as Address;
          const managerAddress = log.address as Address;

          // Check if module is enabled on the Safe (source of truth)
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

          if (isEnabled) {
            // Module is active! Get group info from registry
            try {
              const registryAddress = getDeployedAddress(chainId ?? 100, 'SyncGroupRegistry');

              // Get groupId from manager address
              const groupId = await publicClient.readContract({
                address: registryAddress as Address,
                abi: REGISTRY_ABI,
                functionName: 'getGroupByManager',
                args: [managerAddress],
              }) as bigint;

              // Get group details
              const group = await publicClient.readContract({
                address: registryAddress as Address,
                abi: REGISTRY_ABI,
                functionName: 'getGroup',
                args: [groupId],
              }) as { name: string; manager: Address; owner: Address; active: boolean };

              // Skip if group is inactive
              if (!group.active) {
                console.log('[useActiveGroups] Group is inactive, skipping:', {
                  groupId,
                  groupName: group.name,
                });
                continue;
              }

              console.log('[useActiveGroups] Found active group:', {
                groupId,
                groupName: group.name,
                groupOwner: group.owner,
                managerAddress,
                moduleAddress,
              });

              active.push({
                groupId,
                groupName: group.name,
                groupOwner: group.owner,
                managerAddress,
                moduleAddress,
              });
            } catch (error) {
              console.error('[useActiveGroups] Error fetching group info:', error);
              // Fallback to basic info
              active.push({
                groupId: 0n,
                groupName: 'Sync Group',
                groupOwner: '0x0000000000000000000000000000000000000000' as Address,
                managerAddress,
                moduleAddress,
              });
            }
          }
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
