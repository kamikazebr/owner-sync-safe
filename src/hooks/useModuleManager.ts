'use client';

import { useState } from 'react';
import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address } from 'viem';
import { SafeModuleManagerABI } from '@/lib/abis';
import { getContractAddresses } from '@/lib/contracts';
import toast from 'react-hot-toast';

export function useModuleManager(managerAddress?: Address) {
  const { address } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  const [isLoading, setIsLoading] = useState(false);

  // Use provided manager address or fall back to global/deployed address
  const contractAddresses = getContractAddresses(chainId);
  const effectiveManagerAddress = managerAddress || contractAddresses.SafeModuleManager;

  // Read functions
  const { data: managerOwner } = useReadContract({
    address: effectiveManagerAddress,
    abi: SafeModuleManagerABI,
    functionName: 'owner',
  });

  const { data: version } = useReadContract({
    address: effectiveManagerAddress,
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
        address: effectiveManagerAddress,
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

  // Batch create modules for multiple Safes
  // TODO: Implement true multicall for single-transaction batch processing
  // Currently uses sequential calls - consider Multicall3 for production
  const createModulesForSafes = async (
    safeAddresses: Address[],
    onProgress?: (current: number, total: number, address: Address, status: 'pending' | 'success' | 'error') => void
  ): Promise<{ successful: Address[]; failed: Address[] }> => {
    if (!address) {
      toast.error('Conecte sua wallet primeiro');
      return { successful: [], failed: [] };
    }

    const successful: Address[] = [];
    const failed: Address[] = [];

    setIsLoading(true);
    try {
      for (let i = 0; i < safeAddresses.length; i++) {
        const safeAddress = safeAddresses[i];
        onProgress?.(i + 1, safeAddresses.length, safeAddress, 'pending');

        try {
          const hash = await writeContractAsync({
            address: effectiveManagerAddress,
            abi: SafeModuleManagerABI,
            functionName: 'createModuleForSafe',
            args: [safeAddress],
          });

          if (hash) {
            successful.push(safeAddress);
            onProgress?.(i + 1, safeAddresses.length, safeAddress, 'success');
          } else {
            failed.push(safeAddress);
            onProgress?.(i + 1, safeAddresses.length, safeAddress, 'error');
          }
        } catch (error: any) {
          console.error(`Error creating module for ${safeAddress}:`, error);
          failed.push(safeAddress);
          onProgress?.(i + 1, safeAddresses.length, safeAddress, 'error');
        }
      }

      if (successful.length > 0) {
        toast.success(`${successful.length} Safe(s) adicionado(s) com sucesso!`);
      }
      if (failed.length > 0) {
        toast.error(`${failed.length} Safe(s) falharam ao adicionar`);
      }

      return { successful, failed };
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
        address: effectiveManagerAddress,
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
        address: effectiveManagerAddress,
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

  // Add owner to all managed Safes
  const addSafeOwnerToAll = async (newOwner: Address, threshold: number) => {
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
        address: effectiveManagerAddress,
        abi: SafeModuleManagerABI,
        functionName: 'addSafeOwnerToAll',
        args: [newOwner, BigInt(threshold)],
      });

      toast.success('Adding owner to all Safes! Aguardando confirmação...');
      return hash;
    } catch (error: any) {
      console.error('Error adding owner to all:', error);
      toast.error(`Erro ao adicionar owner: ${error.message || 'Erro desconhecido'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove owner from all managed Safes
  const removeSafeOwnerFromAll = async (prevOwner: Address, ownerToRemove: Address, threshold: number) => {
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
        address: effectiveManagerAddress,
        abi: SafeModuleManagerABI,
        functionName: 'removeSafeOwnerFromAll',
        args: [prevOwner, ownerToRemove, BigInt(threshold)],
      });

      toast.success('Removing owner from all Safes! Aguardando confirmação...');
      return hash;
    } catch (error: any) {
      console.error('Error removing owner from all:', error);
      toast.error(`Erro ao remover owner: ${error.message || 'Erro desconhecido'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Replace owner in all managed Safes
  const replaceSafeOwnerInAll = async (prevOwner: Address, oldOwner: Address, newOwner: Address) => {
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
        address: effectiveManagerAddress,
        abi: SafeModuleManagerABI,
        functionName: 'replaceSafeOwnerInAll',
        args: [prevOwner, oldOwner, newOwner],
      });

      toast.success('Replacing owner in all Safes! Aguardando confirmação...');
      return hash;
    } catch (error: any) {
      console.error('Error replacing owner in all:', error);
      toast.error(`Erro ao substituir owner: ${error.message || 'Erro desconhecido'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Change threshold in all managed Safes
  const changeSafeThresholdInAll = async (threshold: number) => {
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
        address: effectiveManagerAddress,
        abi: SafeModuleManagerABI,
        functionName: 'changeSafeThresholdInAll',
        args: [BigInt(threshold)],
      });

      toast.success('Changing threshold in all Safes! Aguardando confirmação...');
      return hash;
    } catch (error: any) {
      console.error('Error changing threshold in all:', error);
      toast.error(`Erro ao alterar threshold: ${error.message || 'Erro desconhecido'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    isLoading,

    // Contract info
    managerAddress: effectiveManagerAddress,
    managerOwner,
    version,
    isManagerOwner: address === managerOwner,

    // Functions
    createModuleForSafe,
    createModulesForSafes,
    addModuleForSafe,
    setSafeToModule,

    // Cross-module operations
    addSafeOwnerToAll,
    removeSafeOwnerFromAll,
    replaceSafeOwnerInAll,
    changeSafeThresholdInAll,
  };
}