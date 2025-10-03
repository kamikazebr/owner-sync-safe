'use client';

import { useState } from 'react';
import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address } from 'viem';
import { SafeModuleManagerABI } from '@/lib/abis';
import { getContractAddresses } from '@/lib/contracts';
import toast from 'react-hot-toast';

export function useModuleManager() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  const [isLoading, setIsLoading] = useState(false);

  const contractAddresses = getContractAddresses(chainId);

  // Read functions
  const { data: managerOwner } = useReadContract({
    address: contractAddresses.SafeModuleManager,
    abi: SafeModuleManagerABI,
    functionName: 'owner',
  });

  const { data: version } = useReadContract({
    address: contractAddresses.SafeModuleManager,
    abi: SafeModuleManagerABI,
    functionName: 'VERSION',
  });


  // Create module for Safe
  const createModuleForSafe = async (safeAddress: Address) => {
    if (!address) {
      toast.error('Conecte sua wallet primeiro');
      return null;
    }

    setIsLoading(true);
    try {
      const hash = await writeContractAsync({
        address: contractAddresses.SafeModuleManager,
        abi: SafeModuleManagerABI,
        functionName: 'createModuleForSafe',
        args: [safeAddress],
      });

      toast.success('Transação enviada! Aguardando confirmação...');
      return hash;
    } catch (error: any) {
      console.error('Error creating module:', error);
      toast.error(`Erro ao criar módulo: ${error.message || 'Erro desconhecido'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Add module for calling Safe (Safe must call this)
  const addModuleForSafe = async () => {
    if (!address) {
      toast.error('Conecte sua wallet primeiro');
      return null;
    }

    setIsLoading(true);
    try {
      const hash = await writeContractAsync({
        address: contractAddresses.SafeModuleManager,
        abi: SafeModuleManagerABI,
        functionName: 'addModuleForSafe',
      });

      toast.success('Transação enviada! Aguardando confirmação...');
      return hash;
    } catch (error: any) {
      console.error('Error adding module:', error);
      toast.error(`Erro ao adicionar módulo: ${error.message || 'Erro desconhecido'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Set Safe to Module mapping (only manager owner)
  const setSafeToModule = async (safeAddress: Address, moduleAddress: Address) => {
    if (!address) {
      toast.error('Conecte sua wallet primeiro');
      return null;
    }

    if (address !== managerOwner) {
      toast.error('Apenas o owner do manager pode executar esta operação');
      return null;
    }

    setIsLoading(true);
    try {
      const hash = await writeContractAsync({
        address: contractAddresses.SafeModuleManager,
        abi: SafeModuleManagerABI,
        functionName: 'setSafeToModule',
        args: [safeAddress, moduleAddress],
      });

      toast.success('Transação enviada! Aguardando confirmação...');
      return hash;
    } catch (error: any) {
      console.error('Error setting safe to module:', error);
      toast.error(`Erro ao definir mapeamento: ${error.message || 'Erro desconhecido'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    isLoading,

    // Contract info
    managerAddress: contractAddresses.SafeModuleManager,
    managerOwner,
    version,
    isManagerOwner: address === managerOwner,

    // Functions
    createModuleForSafe,
    addModuleForSafe,
    setSafeToModule,
  };
}