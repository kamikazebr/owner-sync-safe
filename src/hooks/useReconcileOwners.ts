'use client';

import { useMemo, useState } from 'react';
import { Address } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { SafeModuleManagerABI } from '@/lib/abis';
import { SafeSyncStatus } from './useOwnerSyncStatus';
import toast from 'react-hot-toast';

export interface OwnerChange {
  safeAddress: Address;
  ownersToAdd: Address[];
  ownersToRemove: Address[];
}

export interface ReconciliationImpact {
  changes: OwnerChange[];
  totalAdds: number;
  totalRemoves: number;
  affectedSafes: number;
  noChangeSafes: number;
}

/**
 * Calculate the impact of reconciling owners across Safes
 * @param individualStatuses - Current status of each Safe
 * @param targetOwners - Set of owner addresses (lowercase) that should be in all Safes
 * @returns Impact analysis showing what changes are needed per Safe
 */
export function calculateReconciliationImpact(
  individualStatuses: SafeSyncStatus[],
  targetOwners: Set<string>
): ReconciliationImpact {
  const changes: OwnerChange[] = [];
  let totalAdds = 0;
  let totalRemoves = 0;
  let affectedSafes = 0;
  let noChangeSafes = 0;

  // Convert target owners to an array for easier comparison
  const targetOwnersArray = Array.from(targetOwners);

  individualStatuses.forEach((status) => {
    const currentOwners = new Set(status.actualOwners.map(o => o.toLowerCase()));

    // Find owners to add (in target but not in current Safe)
    const ownersToAdd: Address[] = targetOwnersArray
      .filter(owner => !currentOwners.has(owner))
      .map(owner => {
        // Find original casing from actualOwners or use as-is
        const original = status.actualOwners.find(o => o.toLowerCase() === owner);
        return (original || owner) as Address;
      });

    // Find owners to remove (in current Safe but not in target)
    const ownersToRemove: Address[] = status.actualOwners
      .filter(owner => !targetOwners.has(owner.toLowerCase()));

    // Only track if there are actual changes
    if (ownersToAdd.length > 0 || ownersToRemove.length > 0) {
      changes.push({
        safeAddress: status.safeAddress,
        ownersToAdd,
        ownersToRemove,
      });
      totalAdds += ownersToAdd.length;
      totalRemoves += ownersToRemove.length;
      affectedSafes++;
    } else {
      noChangeSafes++;
    }
  });

  return {
    changes,
    totalAdds,
    totalRemoves,
    affectedSafes,
    noChangeSafes,
  };
}

/**
 * Hook to reconcile owners across multiple Safes
 * @param managerAddress - Address of the SafeModuleManager contract
 * @param individualStatuses - Current status of each Safe
 * @param selectedOwners - Set of owner addresses that should be in all Safes
 * @param newThreshold - New threshold to set for all Safes
 */
export function useReconcileOwners(
  managerAddress?: Address,
  individualStatuses?: SafeSyncStatus[],
  selectedOwners?: Set<string>,
  newThreshold?: number
) {
  const { writeContractAsync } = useWriteContract();
  const [isReconciling, setIsReconciling] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<Address | undefined>();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: lastTxHash,
  });

  // Calculate reconciliation impact
  const impact = useMemo(() => {
    if (!individualStatuses || !selectedOwners || selectedOwners.size === 0) {
      return null;
    }
    return calculateReconciliationImpact(individualStatuses, selectedOwners);
  }, [individualStatuses, selectedOwners]);

  /**
   * Execute reconciliation by calling contract methods for each change
   * Note: This currently calls methods sequentially. For production,
   * consider batching or using a multicall pattern.
   */
  const reconcile = async () => {
    if (!managerAddress || !impact || !newThreshold) {
      toast.error('Missing required parameters for reconciliation');
      return;
    }

    if (impact.changes.length === 0) {
      toast.success('No changes needed - all Safes are already synchronized');
      return;
    }

    if (selectedOwners!.size < newThreshold) {
      toast.error(`Threshold (${newThreshold}) cannot be greater than number of owners (${selectedOwners!.size})`);
      return;
    }

    setIsReconciling(true);

    try {
      // For now, we'll propose add/remove operations sequentially
      // In production, this should be batched into a single transaction per Safe

      const selectedOwnersArray = Array.from(selectedOwners!);

      // Step 1: Add missing owners to all Safes that need them
      for (const change of impact.changes) {
        if (change.ownersToAdd.length > 0) {
          for (const ownerToAdd of change.ownersToAdd) {
            try {
              const hash = await writeContractAsync({
                address: managerAddress,
                abi: SafeModuleManagerABI,
                functionName: 'addSafeOwnerToAll',
                args: [ownerToAdd, BigInt(newThreshold)],
              });
              setLastTxHash(hash);
              toast.success(`Proposed adding ${ownerToAdd.slice(0, 8)}... to all Safes`);
            } catch (error) {
              console.error(`Failed to add owner ${ownerToAdd}:`, error);
              toast.error(`Failed to add owner ${ownerToAdd.slice(0, 8)}...`);
            }
          }
        }
      }

      // Step 2: Remove owners that shouldn't be in Safes
      // Note: This requires prevOwner calculation which is complex
      // For now, we'll show a warning that removes need manual handling
      const hasRemovals = impact.changes.some(c => c.ownersToRemove.length > 0);
      if (hasRemovals) {
        toast.error('Owner removals require manual handling in the "Manage Owners" modal', {
          duration: 5000,
        });
      }

      toast.success('Reconciliation transactions proposed! Check Safe to approve.');
    } catch (error) {
      console.error('Reconciliation error:', error);
      toast.error(`Reconciliation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsReconciling(false);
    }
  };

  return {
    impact,
    reconcile,
    isReconciling: isReconciling || isConfirming,
    isSuccess,
    lastTxHash,
  };
}
