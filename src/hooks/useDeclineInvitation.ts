'use client';

import { useState } from 'react';
import { Address } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { SafeModuleManagerABI } from '@/lib/abis';
import toast from 'react-hot-toast';

export function useDeclineInvitation() {
  const [isDeclining, setIsDeclining] = useState(false);
  const { writeContractAsync } = useWriteContract();

  const declineInvitation = async (
    managerAddress: Address,
    safeAddress: Address,
    groupName: string
  ): Promise<boolean> => {
    try {
      setIsDeclining(true);

      toast.loading(`Declining invitation from ${groupName}...`, { id: 'decline' });

      const hash = await writeContractAsync({
        address: managerAddress,
        abi: SafeModuleManagerABI,
        functionName: 'removeSafeFromNetwork',
        args: [safeAddress],
      });

      toast.success(`Declined invitation from ${groupName}`, { id: 'decline' });

      setIsDeclining(false);
      return true;
    } catch (error: any) {
      console.error('Error declining invitation:', error);
      toast.error(error.message || 'Failed to decline invitation', { id: 'decline' });
      setIsDeclining(false);
      return false;
    }
  };

  return {
    declineInvitation,
    isDeclining,
  };
}
