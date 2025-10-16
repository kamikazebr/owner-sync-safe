'use client';

import { useEffect, useState, useRef } from 'react';
import { Address, parseAbiItem } from 'viem';
import { usePublicClient } from 'wagmi';
import { useSafeApps } from './useSafeApps';
import { SafeModuleManagerABI, SafeABI } from '@/lib/abis';
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

export interface PendingSetupInfo {
  groupId: bigint;
  groupName: string;
  managerAddress: Address;
  moduleAddress: Address;
  createdBy: Address; // Who added this Safe to the group
  blockNumber: bigint;
  timestamp: bigint;
  txHash: string;
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

        console.log('[usePendingSetup] Found logs:', logs.length);

        if (logs.length === 0) {
          console.log('[usePendingSetup] No ModuleCreated events found');
          setPendingSetups([]);
          hasInitialized.current = true;
          return;
        }

        // Collect ALL inactive modules (multiple groups can invite the same Safe)
        const pending: PendingSetupInfo[] = [];

        for (const log of logs) {
          if (!log.args.module || !log.address || !log.blockNumber || !log.transactionHash) continue;

          const moduleAddress = log.args.module as Address;
          const managerAddress = log.address as Address;
          const blockNumber = log.blockNumber;
          const txHash = log.transactionHash;

          // Get block timestamp
          const block = await publicClient.getBlock({ blockNumber });
          const timestamp = block.timestamp;

          // Check if module is enabled on the Safe (source of truth)
          const isActive = await publicClient.readContract({
            address: safeInfo.safeAddress as Address,
            abi: SafeABI,
            functionName: 'isModuleEnabled',
            args: [moduleAddress],
          }) as boolean;

          console.log('[usePendingSetup] Module check:', {
            moduleAddress,
            managerAddress,
            safeAddress: safeInfo.safeAddress,
            isActive,
          });

          if (!isActive) {
            // Found a pending setup! Get group info from registry
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
                console.log('[usePendingSetup] Group is inactive, skipping:', {
                  groupId,
                  groupName: group.name,
                });
                continue;
              }

              console.log('[usePendingSetup] Found pending setup:', {
                groupId,
                groupName: group.name,
                managerAddress,
                moduleAddress,
                blockNumber,
                timestamp,
                txHash,
              });

              pending.push({
                groupId,
                groupName: group.name,
                managerAddress,
                moduleAddress,
                createdBy: group.owner,
                blockNumber,
                timestamp,
                txHash,
              });
            } catch (error) {
              console.error('[usePendingSetup] Error fetching group info:', error);
              // Fallback to basic info
              pending.push({
                groupId: 0n,
                groupName: 'Sync Group',
                managerAddress,
                moduleAddress,
                createdBy: '0x0000000000000000000000000000000000000000' as Address,
                blockNumber,
                timestamp,
                txHash,
              });
            }
          }
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
