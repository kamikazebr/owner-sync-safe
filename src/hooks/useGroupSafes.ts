'use client';

import { useEffect, useState } from 'react';
import { useReadContract, usePublicClient } from 'wagmi';
import { Address, parseAbiItem } from 'viem';
import { SafeModuleManagerABI, SafeABI } from '@/lib/abis';

export interface GroupSafe {
  safeAddress: Address;
  moduleAddress: Address;
  isActive: boolean;
}

export function useGroupSafes(managerAddress?: Address, chainId?: number) {
  const [safes, setSafes] = useState<GroupSafe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const publicClient = usePublicClient({ chainId });

  // Get all modules from the manager
  const { data: allModules, refetch: refetchModules } = useReadContract({
    address: managerAddress,
    abi: SafeModuleManagerABI,
    functionName: 'getAllModules',
    query: {
      enabled: !!managerAddress,
    },
  });

  // Fetch module creation events and build safe list
  useEffect(() => {
    if (!managerAddress || !publicClient || !allModules || (allModules as Address[]).length === 0) {
      setSafes([]);
      setIsLoading(false);
      return;
    }

    const fetchSafes = async () => {
      setIsLoading(true);
      try {
        // Get ModuleCreated events
        const logs = await publicClient.getLogs({
          address: managerAddress,
          event: parseAbiItem('event ModuleCreated(address indexed safe, address indexed module)'),
          fromBlock: 'earliest',
          toBlock: 'latest',
        });

        // Build map of module -> safe from events
        const moduleToSafe = new Map<Address, Address>();
        logs.forEach((log) => {
          if (log.args.safe && log.args.module) {
            moduleToSafe.set(log.args.module as Address, log.args.safe as Address);
          }
        });

        // For each module, get its safe address and check if active
        const safesList: GroupSafe[] = [];

        for (const moduleAddress of allModules as Address[]) {
          const safeAddress = moduleToSafe.get(moduleAddress);

          if (safeAddress) {
            // Check if module is enabled on the Safe (source of truth)
            const isActive = await publicClient.readContract({
              address: safeAddress,
              abi: SafeABI,
              functionName: 'isModuleEnabled',
              args: [moduleAddress],
            }) as boolean;

            safesList.push({
              safeAddress,
              moduleAddress,
              isActive,
            });
          }
        }

        setSafes(safesList);
      } catch (error) {
        console.error('Error fetching group safes:', error);
        setSafes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSafes();
  }, [managerAddress, publicClient, allModules]);

  const refetch = () => {
    refetchModules();
  };

  return {
    safes,
    isLoading,
    refetch,
  };
}
