'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useCreateGroup } from '@/hooks/useSyncGroupRegistry';
import { X, Shield, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Address, isAddress } from 'viem';
import { getDeployedAddress } from '@/lib/deployments';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (groupId: bigint) => void;
}

export function CreateGroupModal({ isOpen, onClose, onSuccess }: CreateGroupModalProps) {
  const { address, chainId } = useAccount();
  const [groupName, setGroupName] = useState('');
  const [governanceSafe, setGovernanceSafe] = useState('');
  const [useConnectedAddress, setUseConnectedAddress] = useState(true);
  const [error, setError] = useState('');

  const { createGroup, isPending, isConfirming, isSuccess, hash } = useCreateGroup(chainId || 100);

  // Check if SyncGroupRegistry is deployed
  const registryAddress = getDeployedAddress(chainId || 100, 'SyncGroupRegistry');
  const isRegistryDeployed = !!registryAddress;

  useEffect(() => {
    if (isSuccess && onSuccess) {
      // Wait a bit for the transaction to be indexed
      setTimeout(() => {
        onClose();
        setGroupName('');
        setGovernanceSafe('');
        setError('');
      }, 2000);
    }
  }, [isSuccess, onSuccess, onClose]);

  useEffect(() => {
    if (useConnectedAddress && address) {
      setGovernanceSafe(address);
    } else if (useConnectedAddress && !address) {
      setGovernanceSafe('');
    }
  }, [useConnectedAddress, address]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    console.log('=== CREATE GROUP SUBMIT ===');
    console.log('Address:', address);
    console.log('ChainId:', chainId);
    console.log('Group Name:', groupName);
    console.log('Governance Safe:', governanceSafe);
    console.log('useConnectedAddress:', useConnectedAddress);

    // Validation
    if (!groupName.trim()) {
      console.log('❌ Validation failed: Group name is empty');
      setError('Group name is required');
      return;
    }
    console.log('✅ Group name validation passed');

    if (!governanceSafe || !isAddress(governanceSafe)) {
      console.log('❌ Validation failed: Invalid governance Safe address');
      console.log('  - governanceSafe value:', governanceSafe);
      console.log('  - isAddress check:', isAddress(governanceSafe || ''));
      setError('Invalid governance Safe address');
      return;
    }
    console.log('✅ Governance Safe validation passed');

    try {
      console.log('🚀 Calling createGroup with:');
      console.log('  - name:', groupName.trim());
      console.log('  - governanceSafe:', governanceSafe);
      await createGroup(groupName.trim(), governanceSafe as Address);
      console.log('✅ createGroup call completed');
    } catch (err: any) {
      console.error('❌ Error creating group:', err);
      console.error('Error stack:', err.stack);
      console.error('Error message:', err.message);
      setError(err.message || 'Failed to create group');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Create Sync Group</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isPending || isConfirming}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {/* Registry Not Deployed Warning */}
          {!isRegistryDeployed && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-900">
                  <p className="font-medium mb-1">SyncGroupRegistry Not Deployed</p>
                  <p className="text-red-800">
                    The SyncGroupRegistry contract is not deployed on chain {chainId || 100}. Please deploy it first or switch to a supported chain.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Wallet Not Connected Warning */}
          {!address && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-900">
                  <p className="font-medium mb-1">Wallet Not Connected</p>
                  <p className="text-yellow-800">
                    Please connect your wallet to create a sync group. The connected address will be used as the governance Safe.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">What is a Sync Group?</p>
                <p className="text-blue-800">
                  A sync group allows you to synchronize owners across multiple Safes. Each group has
                  its own isolated contracts managed by a governance Safe.
                </p>
              </div>
            </div>
          </div>

          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Treasury Safes, DAO Multisigs"
              disabled={isPending || isConfirming}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500"
            />
          </div>

          {/* Governance Safe Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Governance Safe <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">
              The Safe that will control this sync group. This Safe doesn't need to hold any funds.
            </p>

            {/* Use Connected Address Toggle */}
            <div className="mb-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={useConnectedAddress}
                  onChange={(e) => setUseConnectedAddress(e.target.checked)}
                  disabled={isPending || isConfirming}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Use connected address ({address?.slice(0, 6)}...{address?.slice(-4)})
                </span>
              </label>
            </div>

            {!useConnectedAddress && (
              <input
                type="text"
                value={governanceSafe}
                onChange={(e) => setGovernanceSafe(e.target.value)}
                placeholder="0x..."
                disabled={isPending || isConfirming}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 font-mono text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500"
              />
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div className="text-sm text-green-800">
                  <p className="font-medium">Group created successfully!</p>
                  {hash && (
                    <p className="mt-1 text-xs font-mono">
                      Tx: {hash.slice(0, 10)}...{hash.slice(-8)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending || isConfirming}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || isConfirming || !groupName.trim() || !governanceSafe}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isPending ? 'Creating...' : 'Confirming...'}
                </>
              ) : (
                'Create Group'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
