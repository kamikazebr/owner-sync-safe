'use client';

import { useState } from 'react';
import { Address } from 'viem';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import {
  X,
  UserPlus,
  UserMinus,
  UserCheck,
  Hash,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useModuleManager } from '@/hooks/useModuleManager';
import { useGroupSafes } from '@/hooks/useGroupSafes';
import { useSafeContract } from '@/hooks/useSafeContract';
import { useAccount } from 'wagmi';
import { truncateAddress, getPreviousOwner, isValidAddress, isValidThreshold, cn } from '@/lib/utils';
import { theme } from '@/lib/theme';
import toast from 'react-hot-toast';

interface OwnerManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  managerAddress: Address;
}

type OperationType = 'addOwner' | 'removeOwner' | 'replaceOwner' | 'changeThreshold';

interface OwnerOperation {
  type: OperationType;
  newOwner?: string;
  ownerToRemove?: Address;
  oldOwner?: Address;
  newThreshold?: number;
}

export function OwnerManagementModal({
  isOpen,
  onClose,
  managerAddress
}: OwnerManagementModalProps) {
  const { chainId } = useAccount();
  const [activeTab, setActiveTab] = useState<OperationType>('addOwner');
  const [operation, setOperation] = useState<OwnerOperation>({ type: 'addOwner' });
  const [loading, setLoading] = useState(false);

  const {
    addSafeOwnerToAll,
    removeSafeOwnerFromAll,
    replaceSafeOwnerInAll,
    changeSafeThresholdInAll,
    isLoading: isManagerLoading,
  } = useModuleManager(managerAddress);

  const { safes, refetch: refetchSafes } = useGroupSafes(managerAddress, chainId || 100);

  // Get first Safe address to fetch owners from
  const firstSafeAddress = safes && safes.length > 0 ? safes[0].safeAddress : undefined;

  // Get owners and threshold from first Safe
  const { owners, threshold } = useSafeContract(firstSafeAddress);

  const handleSubmit = async () => {
    if (!managerAddress) return;

    setLoading(true);
    try {
      let hash: string | null = null;

      switch (activeTab) {
        case 'addOwner':
          if (!operation.newOwner || !operation.newThreshold) {
            toast.error('Fill in all fields');
            return;
          }
          if (!isValidAddress(operation.newOwner)) {
            toast.error('Invalid address');
            return;
          }
          hash = await addSafeOwnerToAll(operation.newOwner as Address, operation.newThreshold);
          break;

        case 'removeOwner':
          if (!operation.ownerToRemove || !operation.newThreshold) {
            toast.error('Select an owner and new threshold');
            return;
          }
          const prevOwnerRemove = getPreviousOwner(owners, operation.ownerToRemove);
          if (!prevOwnerRemove) {
            toast.error('Could not determine previous owner');
            return;
          }
          hash = await removeSafeOwnerFromAll(prevOwnerRemove, operation.ownerToRemove, operation.newThreshold);
          break;

        case 'replaceOwner':
          if (!operation.oldOwner || !operation.newOwner) {
            toast.error('Select current owner and new owner');
            return;
          }
          if (!isValidAddress(operation.newOwner)) {
            toast.error('Invalid new owner address');
            return;
          }
          const prevOwnerReplace = getPreviousOwner(owners, operation.oldOwner);
          if (!prevOwnerReplace) {
            toast.error('Could not determine previous owner');
            return;
          }
          hash = await replaceSafeOwnerInAll(prevOwnerReplace, operation.oldOwner, operation.newOwner as Address);
          break;

        case 'changeThreshold':
          if (!operation.newThreshold) {
            toast.error('Define new threshold');
            return;
          }
          if (!isValidThreshold(operation.newThreshold, owners.length)) {
            toast.error('Invalid threshold');
            return;
          }
          hash = await changeSafeThresholdInAll(operation.newThreshold);
          break;
      }

      if (hash) {
        onClose();
        setOperation({ type: 'addOwner' });
        setActiveTab('addOwner');
        setTimeout(() => refetchSafes(), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as OperationType);
    setOperation({ type: value as OperationType });
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/50 fixed inset-0 z-50" />
        <Dialog.Content className="bg-white fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg sm:rounded-lg z-50 flex flex-col max-h-screen sm:max-h-[90vh]">
          {/* Header - Fixed */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <div>
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Manage Owners - All Safes
              </Dialog.Title>
              <p className="text-sm text-gray-500 mt-1">
                Changes will be applied to all {safes?.length || 0} Safes in the group
              </p>
            </div>
            <Dialog.Close asChild>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Tabs + Content - Scrollable */}
          <Tabs.Root value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col min-h-0">
            {/* Tabs List - Scrollable horizontally on mobile */}
            <Tabs.List className="flex border-b border-gray-200 overflow-x-auto flex-shrink-0 px-4 sm:px-6">
              <Tabs.Trigger
                value="addOwner"
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  activeTab === 'addOwner'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                )}
              >
                <UserPlus className="h-4 w-4" />
                Add
              </Tabs.Trigger>
              <Tabs.Trigger
                value="removeOwner"
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  activeTab === 'removeOwner'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                )}
              >
                <UserMinus className="h-4 w-4" />
                Remove
              </Tabs.Trigger>
              <Tabs.Trigger
                value="replaceOwner"
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  activeTab === 'replaceOwner'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                )}
              >
                <UserCheck className="h-4 w-4" />
                Replace
              </Tabs.Trigger>
              <Tabs.Trigger
                value="changeThreshold"
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  activeTab === 'changeThreshold'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                )}
              >
                <Hash className="h-4 w-4" />
                Threshold
              </Tabs.Trigger>
            </Tabs.List>

            {/* Tab Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
              {/* Current Owners Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  Current Owners ({owners.length})
                </h3>

                {owners.length === 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-900">
                      <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p>
                        No owners found. Make sure at least one Safe is configured in the group.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {owners.map((owner, index) => (
                        <div
                          key={owner}
                          className="flex items-center justify-between p-2 bg-white rounded text-xs"
                        >
                          <span className="font-mono">{truncateAddress(owner, 8)}</span>
                          <span className="text-gray-500">#{index + 1}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Threshold:</span>
                        <span className="font-medium">{threshold}/{owners.length}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Add Owner Tab */}
              <Tabs.Content value="addOwner" className="space-y-4">
                <div>
                  <label className={theme.input.label}>
                    New Owner Address
                  </label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={operation.newOwner || ''}
                    onChange={(e) => setOperation({ ...operation, newOwner: e.target.value })}
                    className={theme.input.base}
                  />
                </div>
                <div>
                  <label className={theme.input.label}>
                    New Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={owners.length + 1}
                    value={operation.newThreshold || ''}
                    onChange={(e) => setOperation({ ...operation, newThreshold: parseInt(e.target.value) })}
                    className={theme.input.base}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Range: 1-{owners.length + 1}
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-900">
                      This will propose a transaction to add a new owner to the Safe.
                    </p>
                  </div>
                </div>
              </Tabs.Content>

              {/* Remove Owner Tab */}
              <Tabs.Content value="removeOwner" className="space-y-4">
                <div>
                  <label className={theme.input.label}>
                    Owner to Remove
                  </label>
                  <select
                    value={operation.ownerToRemove || ''}
                    onChange={(e) => setOperation({ ...operation, ownerToRemove: e.target.value as Address })}
                    className={theme.input.select}
                  >
                    <option value="">Select an owner</option>
                    {owners.map((owner) => (
                      <option key={owner} value={owner}>
                        {truncateAddress(owner, 8)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={theme.input.label}>
                    New Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={Math.max(1, owners.length - 1)}
                    value={operation.newThreshold || ''}
                    onChange={(e) => setOperation({ ...operation, newThreshold: parseInt(e.target.value) })}
                    className={theme.input.base}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Range: 1-{Math.max(1, owners.length - 1)}
                  </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-900">
                      This will propose a transaction to remove an owner from the Safe.
                    </p>
                  </div>
                </div>
              </Tabs.Content>

              {/* Replace Owner Tab */}
              <Tabs.Content value="replaceOwner" className="space-y-4">
                <div>
                  <label className={theme.input.label}>
                    Current Owner
                  </label>
                  <select
                    value={operation.oldOwner || ''}
                    onChange={(e) => setOperation({ ...operation, oldOwner: e.target.value as Address })}
                    className={theme.input.select}
                  >
                    <option value="">Select an owner</option>
                    {owners.map((owner) => (
                      <option key={owner} value={owner}>
                        {truncateAddress(owner, 8)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={theme.input.label}>
                    New Owner Address
                  </label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={operation.newOwner || ''}
                    onChange={(e) => setOperation({ ...operation, newOwner: e.target.value })}
                    className={theme.input.base}
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-900">
                      This will propose a transaction to replace an existing owner with a new one.
                    </p>
                  </div>
                </div>
              </Tabs.Content>

              {/* Change Threshold Tab */}
              <Tabs.Content value="changeThreshold" className="space-y-4">
                <div>
                  <label className={theme.input.label}>
                    New Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={owners.length}
                    value={operation.newThreshold || ''}
                    onChange={(e) => setOperation({ ...operation, newThreshold: parseInt(e.target.value) })}
                    className={theme.input.base}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Current: {threshold} | Range: 1-{owners.length}
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-900">
                      This will propose a transaction to change the number of required confirmations.
                    </p>
                  </div>
                </div>
              </Tabs.Content>
            </div>
          </Tabs.Root>

          {/* Footer - Fixed */}
          <div className="flex gap-3 px-4 sm:px-6 py-4 border-t border-gray-200 flex-shrink-0">
            <Dialog.Close asChild>
              <button className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Propose Transaction'
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
