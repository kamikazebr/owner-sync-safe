'use client';

import { useState } from 'react';
import { Address } from 'viem';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ArrowRight, AlertCircle, Check } from 'lucide-react';
import { useSwitchGroup } from '@/hooks/useSwitchGroup';

interface SwitchGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  safeAddress: Address;
  currentGroupId: bigint;
  currentGroupName: string;
  currentManagerAddress: Address;
  currentModuleAddress: Address;
  availableGroups: Array<{
    id: bigint;
    name: string;
    manager: Address;
  }>;
  chainId: number;
  onSwitchComplete?: () => void;
}

export function SwitchGroupModal({
  isOpen,
  onClose,
  safeAddress,
  currentGroupId,
  currentGroupName,
  currentManagerAddress,
  currentModuleAddress,
  availableGroups,
  chainId,
  onSwitchComplete,
}: SwitchGroupModalProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<bigint | null>(null);
  const { switchGroup, isSwitching, error } = useSwitchGroup();

  const selectedGroup = availableGroups.find(g => g.id === selectedGroupId);

  const handleSwitch = async () => {
    if (!selectedGroup) return;

    const result = await switchGroup({
      safeAddress,
      oldManagerAddress: currentManagerAddress,
      oldModuleAddress: currentModuleAddress,
      newManagerAddress: selectedGroup.manager,
      chainId,
    });

    if (result.success) {
      onSwitchComplete?.();
      // Don't close modal immediately - let user see success state
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto z-50 p-6">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Switch Safe to Different Group
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            {/* Current Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Group
              </label>
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="font-medium text-gray-900 dark:text-gray-100">{currentGroupName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Group #{currentGroupId.toString()}</p>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-gray-400" />
            </div>

            {/* Select New Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Switch to Group
              </label>
              <select
                value={selectedGroupId?.toString() || ''}
                onChange={(e) => setSelectedGroupId(e.target.value ? BigInt(e.target.value) : null)}
                disabled={isSwitching}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Select a group...</option>
                {availableGroups.map((group) => (
                  <option key={group.id.toString()} value={group.id.toString()}>
                    {group.name} (Group #{group.id.toString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-medium mb-2">What happens when you switch:</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-blue-800 dark:text-blue-200">
                    <li>
                      <Check className="h-3 w-3 inline text-green-600 mr-1" />
                      Safe removed from current group (automatic)
                    </li>
                    <li>
                      <Check className="h-3 w-3 inline text-green-600 mr-1" />
                      New module created for new group (automatic)
                    </li>
                    <li className="text-yellow-800 dark:text-yellow-200">
                      <AlertCircle className="h-3 w-3 inline text-yellow-600 mr-1" />
                      Safe transaction proposed to swap modules
                    </li>
                    <li className="text-yellow-800 dark:text-yellow-200">
                      <AlertCircle className="h-3 w-3 inline text-yellow-600 mr-1" />
                      Requires Safe owner signatures to complete
                    </li>
                  </ol>
                  <p className="mt-3 text-xs text-blue-700 dark:text-blue-300">
                    The old module will be disabled and the new module will be enabled in a single Safe transaction.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={isSwitching}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSwitch}
                disabled={!selectedGroupId || isSwitching}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSwitching ? 'Switching...' : 'Switch Groups'}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
