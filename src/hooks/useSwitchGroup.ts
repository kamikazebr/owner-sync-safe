'use client';

import { useState } from 'react';
import { Address } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { SafeModuleManagerABI } from '@/lib/abis';
import { useSafeApps } from './useSafeApps';
import {
  buildMultiSendTransaction,
  encodeDisableModule,
  encodeEnableModule,
  buildSafeTransactionBuilderUrl,
} from '@/lib/safe-batch';
import toast from 'react-hot-toast';

export interface SwitchGroupParams {
  safeAddress: Address;
  oldManagerAddress: Address;
  oldModuleAddress: Address;
  newManagerAddress: Address;
  chainId: number;
}

export function useSwitchGroup() {
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string>('');
  const { isSafeApp, sdk } = useSafeApps();

  const { writeContractAsync: writeOldManager } = useWriteContract();
  const { writeContractAsync: writeNewManager } = useWriteContract();

  /**
   * Execute the group switch process
   */
  const switchGroup = async (params: SwitchGroupParams): Promise<{ success: boolean; newModuleAddress?: Address }> => {
    setIsSwitching(true);
    setError('');

    try {
      // Step 1: Remove Safe from old group manager
      toast.loading('Removing Safe from old group...', { id: 'switch-step-1' });

      const removeHash = await writeOldManager({
        address: params.oldManagerAddress,
        abi: SafeModuleManagerABI,
        functionName: 'removeSafeFromNetwork',
        args: [params.safeAddress],
      });

      toast.success('Removed from old group', { id: 'switch-step-1' });

      // Step 2: Create module in new group manager
      toast.loading('Creating module in new group...', { id: 'switch-step-2' });

      const createHash = await writeNewManager({
        address: params.newManagerAddress,
        abi: SafeModuleManagerABI,
        functionName: 'createModuleForSafe',
        args: [params.safeAddress],
      });

      // Wait for creation and get new module address
      // In real implementation, you'd want to get the new module address from event logs
      // For now, we'll need to query it after the transaction confirms

      toast.success('Module created in new group', { id: 'switch-step-2' });

      // Step 3: Build Safe transaction to swap modules
      // This needs to be done by the Safe owners
      toast.loading('Preparing Safe transaction...', { id: 'switch-step-3' });

      // Query the new module address
      // (In production, parse from transaction receipt events)
      const newModuleAddress = '0x...' as Address; // TODO: Get from event

      const batchTransaction = buildMultiSendTransaction([
        encodeDisableModule(params.safeAddress, params.oldModuleAddress),
        encodeEnableModule(params.safeAddress, newModuleAddress),
      ]);

      if (isSafeApp && sdk) {
        // Running inside Safe - propose transaction directly
        try {
          await sdk.txs.send({
            txs: [{
              to: batchTransaction.to,
              value: batchTransaction.value.toString(),
              data: batchTransaction.data,
            }],
          });

          toast.success('Transaction proposed to Safe owners', { id: 'switch-step-3' });
        } catch (sdkError) {
          console.error('Safe SDK error:', sdkError);
          throw new Error('Failed to propose transaction to Safe');
        }
      } else {
        // Not in Safe App - open Transaction Builder
        const txBuilderUrl = buildSafeTransactionBuilderUrl(
          params.chainId,
          params.safeAddress,
          batchTransaction
        );

        window.open(txBuilderUrl, '_blank');
        toast.success('Opening Safe Transaction Builder...', { id: 'switch-step-3' });
      }

      setIsSwitching(false);
      return { success: true, newModuleAddress };

    } catch (err: any) {
      console.error('Error switching groups:', err);
      const errorMessage = err.message || 'Failed to switch groups';
      setError(errorMessage);
      toast.error(errorMessage);
      setIsSwitching(false);
      return { success: false };
    }
  };

  return {
    switchGroup,
    isSwitching,
    error,
  };
}
