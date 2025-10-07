'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Shield, Users, Settings, CheckCircle, Loader2 } from 'lucide-react';
import { PendingSetupInfo } from '@/hooks/usePendingSetup';
import { useEnableModule } from '@/hooks/useEnableModule';
import { useDeclineInvitation } from '@/hooks/useDeclineInvitation';
import { useSafeApps } from '@/hooks/useSafeApps';

interface CompleteSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingSetup: PendingSetupInfo;
  pendingSetups: PendingSetupInfo[];
  onComplete?: () => void;
}

export function CompleteSetupModal({
  isOpen,
  onClose,
  pendingSetup,
  pendingSetups,
  onComplete,
}: CompleteSetupModalProps) {
  const { enableModule, isEnabling } = useEnableModule();
  const { declineInvitation } = useDeclineInvitation();
  const { safeInfo } = useSafeApps();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const otherInvitations = pendingSetups.filter(
    (setup) => setup.managerAddress !== pendingSetup.managerAddress
  );

  const handleEnable = async () => {
    if (!safeInfo) return;

    setIsProcessing(true);

    // First, enable the selected module
    const success = await enableModule(pendingSetup.moduleAddress);

    if (success) {
      // If there are other invitations, decline them
      if (otherInvitations.length > 0) {
        for (const invitation of otherInvitations) {
          await declineInvitation(
            invitation.managerAddress,
            safeInfo.safeAddress as `0x${string}`,
            invitation.groupName
          );
        }
      }

      setIsSuccess(true);
      setIsProcessing(false);
      setTimeout(() => {
        onComplete?.();
        onClose();
        setIsSuccess(false);
      }, 2000);
    } else {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto z-50 p-6">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              Complete Setup
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                disabled={isEnabling}
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </Dialog.Close>
          </div>

          {isSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Setup Complete!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your Safe is now part of {pendingSetup.groupName}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {/* Group Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {pendingSetup.groupName}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Enable the module to activate owner synchronization for this group
                  </p>
                </div>

                {/* Module Info */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Module Address
                  </label>
                  <code className="block text-xs font-mono bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 break-all">
                    {pendingSetup.moduleAddress}
                  </code>
                </div>

                {/* What will happen */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                    What happens when you enable:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Module activation:</strong> The module will be enabled on your Safe
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Users className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Owner sync:</strong> Your Safe's owners can be synchronized with the group
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Safe control:</strong> Your Safe maintains full control and can disable the module anytime
                      </span>
                    </li>
                    {otherInvitations.length > 0 && (
                      <li className="flex items-start gap-2">
                        <X className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>Other invitations:</strong> {otherInvitations.length} other invitation{otherInvitations.length > 1 ? 's' : ''} will be automatically declined
                        </span>
                      </li>
                    )}
                  </ul>
                </div>

                {/* Warning */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ <strong>Requires signatures:</strong> This will propose a transaction that needs approval from your Safe owners (threshold: {/* TODO: Get threshold */}signatures required)
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isEnabling || isProcessing}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEnable}
                  disabled={isEnabling || isProcessing}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isEnabling || isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isEnabling ? 'Proposing...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Enable Module
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
