'use client';

import { useState } from 'react';
import { Address } from 'viem';
import { Settings, UserPlus, UserMinus, UserCheck, Hash, Trash2, Plus, ExternalLink } from 'lucide-react';
import { useManagedModule } from '@/hooks/useManagedModule';
import { useSafeContract } from '@/hooks/useSafeContract';
import { getPreviousOwner, isValidAddress, isValidThreshold, cn } from '@/lib/utils';
import { theme } from '@/lib/theme';
import * as Dialog from '@radix-ui/react-dialog';
import toast from 'react-hot-toast';
import { useAccount } from 'wagmi';
import { copyToClipboard } from '@/lib/clipboard';
import { getBlockExplorerUrl } from '@/lib/deployments';

interface ModuleSettingsProps {
  moduleAddress?: Address;
  safeAddress?: Address;
}

type OperationType = 'addOwner' | 'removeOwner' | 'replaceOwner' | 'changeThreshold';

interface OwnerOperation {
  type: OperationType;
  newOwner?: string;
  ownerToRemove?: Address;
  oldOwner?: Address;
  newThreshold?: number;
}

export function ModuleSettings({ moduleAddress, safeAddress }: ModuleSettingsProps) {
  const { chainId } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [operation, setOperation] = useState<OwnerOperation>({ type: 'addOwner' });
  const [loading, setLoading] = useState(false);
  const explorerUrl = getBlockExplorerUrl(chainId || 100);

  const {
    moduleConfig,
    addSafeOwner,
    removeSafeOwner,
    replaceSafeOwner,
    changeSafeThreshold,
    refetchAll,
  } = useManagedModule(moduleAddress);

  const { owners: safeOwners, threshold: safeThreshold } = useSafeContract(safeAddress);

  const handleSubmit = async () => {
    if (!moduleAddress) return;

    setLoading(true);
    try {
      let hash: string | null = null;

      switch (operation.type) {
        case 'addOwner':
          if (!operation.newOwner || !operation.newThreshold) {
            toast.error('Fill in all fields');
            return;
          }
          if (!isValidAddress(operation.newOwner)) {
            toast.error('Invalid address');
            return;
          }
          hash = await addSafeOwner(operation.newOwner as Address, operation.newThreshold);
          break;

        case 'removeOwner':
          if (!operation.ownerToRemove || !operation.newThreshold) {
            toast.error('Select an owner and new threshold');
            return;
          }
          const prevOwnerRemove = getPreviousOwner(moduleConfig.owners, operation.ownerToRemove);
          if (!prevOwnerRemove) {
            toast.error('Could not determine previous owner');
            return;
          }
          hash = await removeSafeOwner(prevOwnerRemove, operation.ownerToRemove, operation.newThreshold);
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
          const prevOwnerReplace = getPreviousOwner(moduleConfig.owners, operation.oldOwner);
          if (!prevOwnerReplace) {
            toast.error('Could not determine previous owner');
            return;
          }
          hash = await replaceSafeOwner(prevOwnerReplace, operation.oldOwner, operation.newOwner as Address);
          break;

        case 'changeThreshold':
          if (!operation.newThreshold) {
            toast.error('Define new threshold');
            return;
          }
          if (!isValidThreshold(operation.newThreshold, moduleConfig.owners.length)) {
            toast.error('Invalid threshold');
            return;
          }
          hash = await changeSafeThreshold(operation.newThreshold);
          break;
      }

      if (hash) {
        setIsOpen(false);
        setOperation({ type: 'addOwner' });
        setTimeout(() => refetchAll(), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!moduleAddress || !moduleConfig.isConfigured) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Settings className="h-6 w-6 text-gray-400 dark:text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Module Settings</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Configure a module first to manage owners.
        </p>
      </div>
    );
  }

  const getOperationIcon = (type: OperationType) => {
    switch (type) {
      case 'addOwner': return UserPlus;
      case 'removeOwner': return UserMinus;
      case 'replaceOwner': return UserCheck;
      case 'changeThreshold': return Hash;
      default: return Settings;
    }
  };

  const getOperationColor = (type: OperationType) => {
    switch (type) {
      case 'addOwner': return 'text-green-600 bg-green-100';
      case 'removeOwner': return 'text-red-600 bg-red-100';
      case 'replaceOwner': return 'text-blue-600 bg-blue-100';
      case 'changeThreshold': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Module Settings</h2>
        </div>

        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
          <Dialog.Trigger asChild>
            <button className="bg-blue-600 dark:bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>New Operation</span>
            </button>
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className="bg-black/50 fixed inset-0 z-50" />
            <Dialog.Content className="bg-white dark:bg-gray-800 rounded-lg p-6 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 max-h-[80vh] overflow-y-auto">
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                New Operation
              </Dialog.Title>

              <div className="space-y-4">
                {/* Operation Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Operation Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { type: 'addOwner' as OperationType, label: 'Add Owner', icon: UserPlus },
                      { type: 'removeOwner' as OperationType, label: 'Remove Owner', icon: UserMinus },
                      { type: 'replaceOwner' as OperationType, label: 'Replace Owner', icon: UserCheck },
                      { type: 'changeThreshold' as OperationType, label: 'Change Threshold', icon: Hash },
                    ].map(({ type, label, icon: Icon }) => (
                      <button
                        key={type}
                        onClick={() => setOperation({ type })}
                        className={cn(
                          'p-3 rounded-lg border-2 transition-all text-left',
                          theme.text.primary,
                          operation.type === type
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        )}
                      >
                        <Icon className="h-5 w-5 mb-1 text-current" />
                        <div className="text-sm font-medium text-current">{label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Operation-specific inputs */}
                {operation.type === 'addOwner' && (
                  <>
                    <div>
                      <label className={theme.input.label}>
                        New Owner
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
                        max={moduleConfig.owners.length + 1}
                        value={operation.newThreshold || ''}
                        onChange={(e) => setOperation({ ...operation, newThreshold: parseInt(e.target.value) })}
                        className={theme.input.base}
                      />
                    </div>
                  </>
                )}

                {operation.type === 'removeOwner' && (
                  <>
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
                        {moduleConfig.owners.map((owner) => (
                          <option key={owner} value={owner}>
                            {owner}
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
                        max={Math.max(1, moduleConfig.owners.length - 1)}
                        value={operation.newThreshold || ''}
                        onChange={(e) => setOperation({ ...operation, newThreshold: parseInt(e.target.value) })}
                        className={theme.input.base}
                      />
                    </div>
                  </>
                )}

                {operation.type === 'replaceOwner' && (
                  <>
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
                        {moduleConfig.owners.map((owner) => (
                          <option key={owner} value={owner}>
                            {owner}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={theme.input.label}>
                        New Owner
                      </label>
                      <input
                        type="text"
                        placeholder="0x..."
                        value={operation.newOwner || ''}
                        onChange={(e) => setOperation({ ...operation, newOwner: e.target.value })}
                        className={theme.input.base}
                      />
                    </div>
                  </>
                )}

                {operation.type === 'changeThreshold' && (
                  <div>
                    <label className={theme.input.label}>
                      New Threshold (current: {moduleConfig.threshold})
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={moduleConfig.owners.length}
                      value={operation.newThreshold || ''}
                      onChange={(e) => setOperation({ ...operation, newThreshold: parseInt(e.target.value) })}
                      className={theme.input.base}
                    />
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex space-x-3 pt-4">
                  <Dialog.Close asChild>
                    <button className={cn("flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700", theme.transition.default)}>
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
                  >
                    {loading ? 'Executing...' : 'Execute'}
                  </button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* Current Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Owners */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
            <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span>Current Owners ({moduleConfig.owners.length})</span>
          </h3>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {moduleConfig.owners.map((owner, index) => (
              <div
                key={owner}
                className="flex items-center justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-900/30 rounded"
              >
                <div
                  onClick={() => copyToClipboard(owner, 'owner address')}
                  className="font-mono text-xs text-gray-900 dark:text-white break-all flex-1 cursor-pointer hover:text-green-700 dark:hover:text-green-300 transition-colors"
                  title="Click to copy owner address"
                >
                  {owner}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={`${explorerUrl}/address/${owner}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    title="View on explorer"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <span className="text-xs text-gray-500 dark:text-gray-400">#{index + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration Summary */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
            <Hash className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span>Configuration</span>
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Threshold:</span>
              <span className="font-medium text-gray-900 dark:text-white">{moduleConfig.threshold}/{moduleConfig.owners.length}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Auto-sync:</span>
              <span className={moduleConfig.autoSyncEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                {moduleConfig.autoSyncEnabled ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Full sync:</span>
              <span className={moduleConfig.isSyncComplete ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}>
                {moduleConfig.isSyncComplete ? 'Yes' : 'Partial'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Sync limit:</span>
              <span className="font-medium text-gray-900 dark:text-white">{moduleConfig.maxSyncOwners} owners</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { type: 'addOwner' as OperationType, label: 'Add Owner', icon: UserPlus },
            { type: 'removeOwner' as OperationType, label: 'Remove Owner', icon: UserMinus },
            { type: 'replaceOwner' as OperationType, label: 'Replace Owner', icon: UserCheck },
            { type: 'changeThreshold' as OperationType, label: 'Change Threshold', icon: Hash },
          ].map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => {
                setOperation({ type });
                setIsOpen(true);
              }}
              className={cn(
                'p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all text-center',
                getOperationColor(type)
              )}
            >
              <Icon className="h-5 w-5 mx-auto mb-1" />
              <div className="text-sm font-medium">{label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}