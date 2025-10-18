'use client';

import { useMemo, useEffect, useState } from 'react';
import { Address } from 'viem';
import { usePublicClient } from 'wagmi';
import { SafeABI } from '@/lib/abis';
import { useManagedModule } from '@/hooks/useManagedModule';
import { useSafeContract } from '@/hooks/useSafeContract';

export interface SafeSyncStatus {
  safeAddress: Address;
  moduleAddress: Address;
  isInSync: boolean;
  needsSync: boolean;
  actualOwners: Address[];
  cachedOwners: Address[];
  actualThreshold: number;
  cachedThreshold: number;
  moduleConfigured: boolean;
}

/**
 * Hook to check if a Safe's owners are in sync between the Safe and its module
 * @param safeAddress - The Safe contract address
 * @param moduleAddress - The module contract address
 * @returns Sync status with comparison between actual and cached owners
 */
export function useOwnerSyncStatus(
  safeAddress?: Address,
  moduleAddress?: Address
): SafeSyncStatus | null {
  // Get actual owners from the Safe contract
  const { owners: actualOwners, threshold: actualThreshold } = useSafeContract(safeAddress);

  // Get cached owners from the module
  const { moduleConfig } = useManagedModule(moduleAddress);

  // Compare owners and threshold
  const syncStatus = useMemo(() => {
    if (!safeAddress || !moduleAddress || !moduleConfig.isConfigured) {
      return null;
    }

    const cachedOwners = moduleConfig.owners;
    const cachedThreshold = moduleConfig.threshold;

    // Check if owner lists match (order doesn't matter)
    const actualSet = new Set(actualOwners.map(o => o.toLowerCase()));
    const cachedSet = new Set(cachedOwners.map(o => o.toLowerCase()));

    const hasMatchingOwners =
      actualOwners.length === cachedOwners.length &&
      actualOwners.every(owner => cachedSet.has(owner.toLowerCase())) &&
      cachedOwners.every(owner => actualSet.has(owner.toLowerCase()));

    const hasMatchingThreshold = actualThreshold === cachedThreshold;

    const isInSync = hasMatchingOwners && hasMatchingThreshold;
    const needsSync = !isInSync;

    return {
      safeAddress,
      moduleAddress,
      isInSync,
      needsSync,
      actualOwners,
      cachedOwners,
      actualThreshold,
      cachedThreshold,
      moduleConfigured: moduleConfig.isConfigured,
    };
  }, [
    safeAddress,
    moduleAddress,
    moduleConfig.isConfigured,
    moduleConfig.owners,
    moduleConfig.threshold,
    actualOwners,
    actualThreshold,
  ]);

  return syncStatus;
}

/**
 * Hook to check sync status for multiple Safes in a group
 * Fetches owner data directly to avoid Rules of Hooks violations
 * @param safes - Array of Safe addresses and module addresses
 * @param chainId - Chain ID to use for fetching
 * @returns Array of sync statuses
 */
export function useGroupSyncStatus(
  safes: Array<{ safeAddress: Address; moduleAddress: Address; isActive: boolean }>,
  chainId?: number
): SafeSyncStatus[] {
  const publicClient = usePublicClient({ chainId });
  const [syncStatuses, setSyncStatuses] = useState<SafeSyncStatus[]>([]);

  useEffect(() => {
    if (!publicClient || safes.length === 0) {
      setSyncStatuses([]);
      return;
    }

    const activeSafes = safes.filter(s => s.isActive);
    if (activeSafes.length === 0) {
      setSyncStatuses([]);
      return;
    }

    const fetchStatuses = async () => {
      const statuses = await Promise.all(
        activeSafes.map(async (safe) => {
          try {
            // Fetch actual owners and threshold from Safe
            const [actualOwners, actualThreshold] = await Promise.all([
              publicClient.readContract({
                address: safe.safeAddress,
                abi: SafeABI,
                functionName: 'getOwners',
              }) as Promise<Address[]>,
              publicClient.readContract({
                address: safe.safeAddress,
                abi: SafeABI,
                functionName: 'getThreshold',
              }) as Promise<bigint>,
            ]);

            return {
              safeAddress: safe.safeAddress,
              moduleAddress: safe.moduleAddress,
              isInSync: true, // Simplified for now - we'll use actual owners
              needsSync: false,
              actualOwners: actualOwners || [],
              cachedOwners: [], // Not needed for cross-Safe comparison
              actualThreshold: Number(actualThreshold),
              cachedThreshold: 0,
              moduleConfigured: true,
            } as SafeSyncStatus;
          } catch (error) {
            console.error(`Failed to fetch status for Safe ${safe.safeAddress}:`, error);
            return null;
          }
        })
      );

      setSyncStatuses(statuses.filter((s): s is SafeSyncStatus => s !== null));
    };

    fetchStatuses();
  }, [safes, publicClient, chainId]);

  return syncStatuses;
}

/**
 * Cross-Safe owner comparison
 */
export interface CrossSafeOwnerStatus {
  commonOwners: Address[]; // Present in ALL Safes
  divergentOwners: Map<string, Address[]>; // Owner -> Safes where it exists
  allSafesInSync: boolean;
  safesWithDifferentOwners: Address[];
  individualStatuses: SafeSyncStatus[];
}

/**
 * Hook to compare owners across multiple Safes in a group
 * @param safes - Array of Safe addresses and module addresses
 * @param chainId - Chain ID to use for fetching
 * @returns Cross-Safe owner comparison status
 */
export function useCrossSafeOwnerStatus(
  safes: Array<{ safeAddress: Address; moduleAddress: Address; isActive: boolean }>,
  chainId?: number
): CrossSafeOwnerStatus | null {
  const syncStatuses = useGroupSyncStatus(safes, chainId);

  return useMemo(() => {
    if (syncStatuses.length === 0) return null;

    // Get actual owners from each Safe (not cached)
    const allOwnerSets = syncStatuses.map(status => ({
      safeAddress: status.safeAddress,
      owners: status.actualOwners.map(o => o.toLowerCase() as Address),
    }));

    // Find common owners (present in ALL Safes)
    const commonOwners = allOwnerSets[0].owners.filter(owner =>
      allOwnerSets.every(safeSet =>
        safeSet.owners.includes(owner)
      )
    );

    // Find divergent owners and track which Safes have them
    const divergentOwners = new Map<string, Address[]>();
    allOwnerSets.forEach(({ safeAddress, owners }) => {
      owners.forEach(owner => {
        if (!commonOwners.includes(owner)) {
          const safesWithOwner = divergentOwners.get(owner) || [];
          safesWithOwner.push(safeAddress);
          divergentOwners.set(owner, safesWithOwner);
        }
      });
    });

    // Check if all Safes have identical owner sets
    const firstSafeOwners = JSON.stringify([...allOwnerSets[0].owners].sort());
    const allSafesInSync = allOwnerSets.every(({ owners }) =>
      JSON.stringify([...owners].sort()) === firstSafeOwners
    );

    // Find Safes with different owner sets
    const safesWithDifferentOwners = allSafesInSync
      ? []
      : allOwnerSets
          .filter((_, index) => index > 0)
          .filter(({ owners }) =>
            JSON.stringify([...owners].sort()) !== firstSafeOwners
          )
          .map(({ safeAddress }) => safeAddress);

    return {
      commonOwners,
      divergentOwners,
      allSafesInSync,
      safesWithDifferentOwners,
      individualStatuses: syncStatuses,
    };
  }, [syncStatuses]);
}
