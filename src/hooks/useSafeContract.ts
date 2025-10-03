'use client';

import { useState } from 'react';
import { useReadContract, useWriteContract } from 'wagmi';
import { Address } from 'viem';
import { SafeABI } from '@/lib/abis';
import toast from 'react-hot-toast';

export function useSafeContract(safeAddress?: Address) {
  const { writeContractAsync } = useWriteContract();
  const [isLoading, setIsLoading] = useState(false);

  const enabled = !!safeAddress && safeAddress !== '0x0000000000000000000000000000000000000000';

  // Read Safe data
  const { data: owners, refetch: refetchOwners } = useReadContract({
    address: safeAddress,
    abi: SafeABI,
    functionName: 'getOwners',
    query: { enabled },
  });

  const { data: threshold, refetch: refetchThreshold } = useReadContract({
    address: safeAddress,
    abi: SafeABI,
    functionName: 'getThreshold',
    query: { enabled },
  });

  // Enable module on Safe
  const enableModule = async (moduleAddress: Address) => {
    if (!safeAddress) {
      toast.error('Endereço do Safe não encontrado');
      return null;
    }

    setIsLoading(true);
    try {
      const hash = await writeContractAsync({
        address: safeAddress,
        abi: SafeABI,
        functionName: 'enableModule',
        args: [moduleAddress],
      });

      toast.success('Habilitando módulo! Aguardando confirmação...');
      return hash;
    } catch (error: any) {
      console.error('Error enabling module:', error);
      toast.error(`Erro ao habilitar módulo: ${error.message || 'Erro desconhecido'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Disable module on Safe
  const disableModule = async (prevModule: Address, moduleAddress: Address) => {
    if (!safeAddress) {
      toast.error('Endereço do Safe não encontrado');
      return null;
    }

    setIsLoading(true);
    try {
      const hash = await writeContractAsync({
        address: safeAddress,
        abi: SafeABI,
        functionName: 'disableModule',
        args: [prevModule, moduleAddress],
      });

      toast.success('Desabilitando módulo! Aguardando confirmação...');
      return hash;
    } catch (error: any) {
      console.error('Error disabling module:', error);
      toast.error(`Erro ao desabilitar módulo: ${error.message || 'Erro desconhecido'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const refetchAll = () => {
    refetchOwners();
    refetchThreshold();
  };

  return {
    // State
    isLoading,
    safeAddress,

    // Safe data
    owners: (owners as Address[]) || [],
    threshold: Number(threshold) || 0,

    // Functions
    enableModule,
    disableModule,
    refetchAll,
  };
}