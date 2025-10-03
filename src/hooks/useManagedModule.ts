'use client';

import { useState } from 'react';
import { useReadContract, useWriteContract } from 'wagmi';
import { Address } from 'viem';
import { ManagedSafeModuleABI } from '@/lib/abis';
import toast from 'react-hot-toast';

interface ModuleConfig {
  isConfigured: boolean;
  owners: Address[];
  threshold: number;
  isSyncComplete: boolean;
  autoSyncEnabled: boolean;
  requireFullSync: boolean;
  maxSyncOwners: number;
  syncedOwners: number;
}

export function useManagedModule(moduleAddress?: Address) {
  const { writeContractAsync } = useWriteContract();
  const [isLoading, setIsLoading] = useState(false);

  const enabled = !!moduleAddress && moduleAddress !== '0x0000000000000000000000000000000000000000';

  // Read module configuration
  const { data: isConfigured, refetch: refetchConfigured } = useReadContract({
    address: moduleAddress,
    abi: ManagedSafeModuleABI,
    functionName: 'isSafeConfigured',
    query: { enabled },
  });

  const { data: owners, refetch: refetchOwners } = useReadContract({
    address: moduleAddress,
    abi: ManagedSafeModuleABI,
    functionName: 'getSafeOwners',
    query: { enabled: enabled && isConfigured },
  });

  const { data: threshold, refetch: refetchThreshold } = useReadContract({
    address: moduleAddress,
    abi: ManagedSafeModuleABI,
    functionName: 'getSafeThreshold',
    query: { enabled: enabled && isConfigured },
  });

  const { data: isSyncComplete, refetch: refetchSyncComplete } = useReadContract({
    address: moduleAddress,
    abi: ManagedSafeModuleABI,
    functionName: 'isSyncComplete',
    query: { enabled: enabled && isConfigured },
  });

  const { data: syncStatus, refetch: refetchSyncStatus } = useReadContract({
    address: moduleAddress,
    abi: ManagedSafeModuleABI,
    functionName: 'getSyncStatus',
    query: { enabled: enabled && isConfigured },
  });

  const { data: autoSyncEnabled } = useReadContract({
    address: moduleAddress,
    abi: ManagedSafeModuleABI,
    functionName: 'autoSyncEnabled',
    query: { enabled },
  });

  const { data: requireFullSync } = useReadContract({
    address: moduleAddress,
    abi: ManagedSafeModuleABI,
    functionName: 'requireFullSyncForOperations',
    query: { enabled },
  });

  const { data: maxSyncOwners } = useReadContract({
    address: moduleAddress,
    abi: ManagedSafeModuleABI,
    functionName: 'maxSyncOwners',
    query: { enabled },
  });

  const { data: moduleOwner } = useReadContract({
    address: moduleAddress,
    abi: ManagedSafeModuleABI,
    functionName: 'owner',
    query: { enabled },
  });

  // Refetch all data
  const refetchAll = () => {
    refetchConfigured();
    refetchOwners();
    refetchThreshold();
    refetchSyncComplete();
    refetchSyncStatus();
  };

  // Configure module for Safe
  const configureForSafe = async () => {
    if (!moduleAddress) {
      toast.error('Endereço do módulo não encontrado');
      return null;
    }

    setIsLoading(true);
    try {
      const hash = await writeContractAsync({
        address: moduleAddress,
        abi: ManagedSafeModuleABI,
        functionName: 'configureForSafe',
      });

      toast.success('Configuração iniciada! Aguardando confirmação...');
      return hash;
    } catch (error: any) {
      console.error('Error configuring module:', error);
      toast.error(`Erro ao configurar módulo: ${error.message || 'Erro desconhecido'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Add Safe owner
  const addSafeOwner = async (newOwner: Address, newThreshold: number) => {
    if (!moduleAddress) return null;

    setIsLoading(true);
    try {
      const hash = await writeContractAsync({
        address: moduleAddress,
        abi: ManagedSafeModuleABI,
        functionName: 'addSafeOwner',
        args: [newOwner, BigInt(newThreshold)],
      });

      toast.success('Adicionando owner! Aguardando confirmação...');
      return hash;
    } catch (error: any) {
      console.error('Error adding owner:', error);
      toast.error(`Erro ao adicionar owner: ${error.message || 'Erro desconhecido'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove Safe owner
  const removeSafeOwner = async (prevOwner: Address, ownerToRemove: Address, newThreshold: number) => {
    if (!moduleAddress) return null;

    setIsLoading(true);
    try {
      const hash = await writeContractAsync({
        address: moduleAddress,
        abi: ManagedSafeModuleABI,
        functionName: 'removeSafeOwner',
        args: [prevOwner, ownerToRemove, BigInt(newThreshold)],
      });

      toast.success('Removendo owner! Aguardando confirmação...');
      return hash;
    } catch (error: any) {
      console.error('Error removing owner:', error);
      toast.error(`Erro ao remover owner: ${error.message || 'Erro desconhecido'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Replace Safe owner
  const replaceSafeOwner = async (prevOwner: Address, oldOwner: Address, newOwner: Address) => {
    if (!moduleAddress) return null;

    setIsLoading(true);
    try {
      const hash = await writeContractAsync({
        address: moduleAddress,
        abi: ManagedSafeModuleABI,
        functionName: 'replaceSafeOwner',
        args: [prevOwner, oldOwner, newOwner],
      });

      toast.success('Substituindo owner! Aguardando confirmação...');
      return hash;
    } catch (error: any) {
      console.error('Error replacing owner:', error);
      toast.error(`Erro ao substituir owner: ${error.message || 'Erro desconhecido'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Change Safe threshold
  const changeSafeThreshold = async (newThreshold: number) => {
    if (!moduleAddress) return null;

    setIsLoading(true);
    try {
      const hash = await writeContractAsync({
        address: moduleAddress,
        abi: ManagedSafeModuleABI,
        functionName: 'changeSafeThreshold',
        args: [BigInt(newThreshold)],
      });

      toast.success('Alterando threshold! Aguardando confirmação...');
      return hash;
    } catch (error: any) {
      console.error('Error changing threshold:', error);
      toast.error(`Erro ao alterar threshold: ${error.message || 'Erro desconhecido'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Sync owners from Safe
  const syncOwnersFromSafe = async () => {
    if (!moduleAddress) return null;

    setIsLoading(true);
    try {
      const hash = await writeContractAsync({
        address: moduleAddress,
        abi: ManagedSafeModuleABI,
        functionName: 'syncOwnersFromSafe',
      });

      toast.success('Sincronizando owners! Aguardando confirmação...');
      return hash;
    } catch (error: any) {
      console.error('Error syncing owners:', error);
      toast.error(`Erro ao sincronizar owners: ${error.message || 'Erro desconhecido'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Set auto-sync
  const setAutoSync = async (enabled: boolean) => {
    if (!moduleAddress) return null;

    setIsLoading(true);
    try {
      const hash = await writeContractAsync({
        address: moduleAddress,
        abi: ManagedSafeModuleABI,
        functionName: 'setAutoSync',
        args: [enabled],
      });

      toast.success(`Auto-sync ${enabled ? 'ativado' : 'desativado'}! Aguardando confirmação...`);
      return hash;
    } catch (error: any) {
      console.error('Error setting auto-sync:', error);
      toast.error(`Erro ao alterar auto-sync: ${error.message || 'Erro desconhecido'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Set require full sync
  const setRequireFullSync = async (enabled: boolean) => {
    if (!moduleAddress) return null;

    setIsLoading(true);
    try {
      const hash = await writeContractAsync({
        address: moduleAddress,
        abi: ManagedSafeModuleABI,
        functionName: 'setRequireFullSync',
        args: [enabled],
      });

      toast.success(`Require full sync ${enabled ? 'ativado' : 'desativado'}! Aguardando confirmação...`);
      return hash;
    } catch (error: any) {
      console.error('Error setting require full sync:', error);
      toast.error(`Erro ao alterar require full sync: ${error.message || 'Erro desconhecido'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Set max sync owners
  const setMaxSyncOwners = async (newLimit: number) => {
    if (!moduleAddress) return null;

    setIsLoading(true);
    try {
      const hash = await writeContractAsync({
        address: moduleAddress,
        abi: ManagedSafeModuleABI,
        functionName: 'setMaxSyncOwners',
        args: [BigInt(newLimit)],
      });

      toast.success(`Limite de sync alterado para ${newLimit}! Aguardando confirmação...`);
      return hash;
    } catch (error: any) {
      console.error('Error setting max sync owners:', error);
      toast.error(`Erro ao alterar limite: ${error.message || 'Erro desconhecido'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Build module config object
  const moduleConfig: ModuleConfig = {
    isConfigured: !!isConfigured,
    owners: (owners as Address[]) || [],
    threshold: Number(threshold) || 0,
    isSyncComplete: !!isSyncComplete,
    autoSyncEnabled: !!autoSyncEnabled,
    requireFullSync: !!requireFullSync,
    maxSyncOwners: Number(maxSyncOwners) || 0,
    syncedOwners: syncStatus ? Number(syncStatus[0]) : 0,
  };

  return {
    // State
    isLoading,
    moduleAddress,
    moduleOwner,
    moduleConfig,

    // Functions
    configureForSafe,
    addSafeOwner,
    removeSafeOwner,
    replaceSafeOwner,
    changeSafeThreshold,
    syncOwnersFromSafe,
    setAutoSync,
    setRequireFullSync,
    setMaxSyncOwners,
    refetchAll,
  };
}