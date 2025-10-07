'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useEffect } from 'react';
import { getDeployedAddress } from '@/lib/deployments';
import { Address } from 'viem';

const REGISTRY_ABI = [
  {
    type: 'function',
    name: 'createGroup',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'governanceSafe', type: 'address' },
    ],
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
  {
    type: 'function',
    name: 'getOwnerGroups',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'getGroupByManager',
    stateMutability: 'view',
    inputs: [{ name: 'manager', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'updateGroupName',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'groupId', type: 'uint256' },
      { name: 'name', type: 'string' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'deactivateGroup',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'groupId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'isGroupActive',
    stateMutability: 'view',
    inputs: [{ name: 'groupId', type: 'uint256' }],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'nextGroupId',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const;

export interface SyncGroup {
  manager: Address;
  template: Address;
  owner: Address;
  name: string;
  active: boolean;
  createdAt: bigint;
}

export function useSyncGroupRegistry(chainId: number) {
  const registryAddress = getDeployedAddress(chainId, 'SyncGroupRegistry');

  // Read total groups count
  const { data: nextGroupId, refetch: refetchNextGroupId } = useReadContract({
    address: registryAddress as Address,
    abi: REGISTRY_ABI,
    functionName: 'nextGroupId',
    chainId,
  });

  return {
    registryAddress,
    nextGroupId: nextGroupId as bigint | undefined,
    refetchNextGroupId,
  };
}

export function useOwnerGroups(owner: Address | undefined, chainId: number) {
  const registryAddress = getDeployedAddress(chainId, 'SyncGroupRegistry');

  const { data: groupIds, refetch: refetchGroupIds } = useReadContract({
    address: registryAddress as Address,
    abi: REGISTRY_ABI,
    functionName: 'getOwnerGroups',
    args: owner ? [owner] : undefined,
    chainId,
    query: {
      enabled: !!owner,
    },
  });

  return {
    groupIds: groupIds as bigint[] | undefined,
    refetchGroupIds,
  };
}

export function useGroupDetails(groupId: bigint | undefined, chainId: number) {
  const registryAddress = getDeployedAddress(chainId, 'SyncGroupRegistry');

  const { data: groupData, refetch: refetchGroup } = useReadContract({
    address: registryAddress as Address,
    abi: REGISTRY_ABI,
    functionName: 'getGroup',
    args: groupId !== undefined ? [groupId] : undefined,
    chainId,
    query: {
      enabled: groupId !== undefined,
    },
  });

  const group = groupData as SyncGroup | undefined;

  return {
    group,
    refetchGroup,
  };
}

export function useCreateGroup(chainId: number) {
  const registryAddress = getDeployedAddress(chainId, 'SyncGroupRegistry');

  console.log('=== useCreateGroup Hook ===');
  console.log('ChainId:', chainId);
  console.log('Registry Address:', registryAddress);

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    chainId,
  });

  const createGroup = async (name: string, governanceSafe: Address) => {
    console.log('=== createGroup function called ===');
    console.log('Registry Address:', registryAddress);
    console.log('Name:', name);
    console.log('Governance Safe:', governanceSafe);
    console.log('ChainId:', chainId);

    if (!registryAddress) {
      const errorMsg = `SyncGroupRegistry not deployed on chain ${chainId}`;
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }

    console.log('📝 Calling writeContract with args:', [name, governanceSafe]);

    writeContract({
      address: registryAddress as Address,
      abi: REGISTRY_ABI,
      functionName: 'createGroup',
      args: [name, governanceSafe],
      chainId,
    });

    console.log('✅ writeContract called');
  };

  return {
    createGroup,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useUpdateGroupName(chainId: number) {
  const registryAddress = getDeployedAddress(chainId, 'SyncGroupRegistry');
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    chainId,
  });

  const updateGroupName = async (groupId: bigint, name: string) => {
    writeContract({
      address: registryAddress as Address,
      abi: REGISTRY_ABI,
      functionName: 'updateGroupName',
      args: [groupId, name],
      chainId,
    });
  };

  return {
    updateGroupName,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useDeactivateGroup(chainId: number) {
  const registryAddress = getDeployedAddress(chainId, 'SyncGroupRegistry');
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    chainId,
  });

  const deactivateGroup = async (groupId: bigint) => {
    writeContract({
      address: registryAddress as Address,
      abi: REGISTRY_ABI,
      functionName: 'deactivateGroup',
      args: [groupId],
      chainId,
    });
  };

  return {
    deactivateGroup,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useGroupActive(groupId: bigint | undefined, chainId: number) {
  const registryAddress = getDeployedAddress(chainId, 'SyncGroupRegistry');

  const { data: isActive, refetch: refetchActive } = useReadContract({
    address: registryAddress as Address,
    abi: REGISTRY_ABI,
    functionName: 'isGroupActive',
    args: groupId !== undefined ? [groupId] : undefined,
    chainId,
    query: {
      enabled: groupId !== undefined,
    },
  });

  return {
    isActive: isActive as boolean | undefined,
    refetchActive,
  };
}
