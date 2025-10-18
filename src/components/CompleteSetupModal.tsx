'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Shield, Users, Settings, CheckCircle, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';
import { PendingSetupInfo } from '@/hooks/usePendingSetup';
import { useEnableModule } from '@/hooks/useEnableModule';
import { useDeclineInvitation } from '@/hooks/useDeclineInvitation';
import { useSafeApps } from '@/hooks/useSafeApps';
import { buildSafeTransactionBuilderUrl, encodeEnableModule } from '@/lib/safe-batch';
import { useAccount } from 'wagmi';
import { getBlockExplorerUrl } from '@/lib/deployments';
import toast from 'react-hot-toast';

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
  const { chainId } = useAccount();
  const { enableModule, isEnabling, canEnable } = useEnableModule();
  const { declineInvitation } = useDeclineInvitation();
  const { safeInfo, isLoading: isSafeLoading, error: safeError } = useSafeApps();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProposed, setIsProposed] = useState(false); // Track if transaction was proposed
  const explorerUrl = getBlockExplorerUrl(chainId || 100);

  const handleCopy = async (text: string, label: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast.success(`Copied ${label}!`);
        return;
      }
    } catch (error) {
      console.log('Clipboard API failed, using fallback:', error);
    }

    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      textArea.select();
      textArea.setSelectionRange(0, text.length);
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        toast.success(`Copied ${label}!`);
      }
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const otherInvitations = pendingSetups.filter(
    (setup) => setup.managerAddress !== pendingSetup.managerAddress
  );

  // Reset state when modal is opened
  useEffect(() => {
    if (isOpen) {
      setIsProposed(false);
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Generate Transaction Builder URL as fallback
  const getTransactionBuilderUrl = () => {
    if (!safeInfo?.safeAddress || !chainId) return '';

    const enableModuleTx = encodeEnableModule(
      safeInfo.safeAddress as `0x${string}`,
      pendingSetup.moduleAddress
    );

    return buildSafeTransactionBuilderUrl(
      chainId,
      safeInfo.safeAddress as `0x${string}`,
      enableModuleTx
    );
  };

  const handleEnable = async () => {
    if (!safeInfo) return;

    setIsProcessing(true);

    // Propose the enableModule transaction
    const success = await enableModule(pendingSetup.moduleAddress);

    if (success) {
      // Transaction was proposed successfully
      setIsProposed(true);

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

      setIsProcessing(false);

      // Don't auto-close - let user close manually after reviewing instructions
      // The pending setup will disappear automatically once transaction executes
      // and subgraph picks up the EnabledModule event
    } else {
      // Failed to propose transaction
      setIsProcessing(false);
      setIsProposed(false);
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

          {isProposed ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Transaction Proposed!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The enableModule transaction has been proposed to your Safe.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Next steps:</strong>
                </p>
                <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-decimal list-inside">
                  <li>Go to your Safe's transaction queue</li>
                  <li>Collect the required signatures ({safeInfo?.threshold || 0} of {safeInfo?.owners?.length || 0})</li>
                  <li>Execute the transaction</li>
                  <li>Once executed, this invitation will automatically be marked as complete</li>
                </ol>
              </div>
              <div className="mt-4 flex gap-3 justify-center">
                <button
                  onClick={() => setIsProposed(false)}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => {
                    setIsProposed(false);
                    onClose();
                  }}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Close
                </button>
              </div>
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
                  <div className="flex items-center gap-2">
                    <code
                      onClick={() => handleCopy(pendingSetup.moduleAddress, 'module address')}
                      className="flex-1 text-xs font-mono bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 break-all cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="Click to copy"
                    >
                      {pendingSetup.moduleAddress}
                    </code>
                    <a
                      href={`${explorerUrl}/address/${pendingSetup.moduleAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="View on explorer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
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

              {/* SDK Loading/Error State */}
              {isSafeLoading && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
                  <p className="text-sm text-blue-900 dark:text-blue-300">
                    Connecting to Safe Wallet...
                  </p>
                </div>
              )}

              {!isSafeLoading && !canEnable && safeInfo && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-1">
                        Safe SDK Not Available
                      </p>
                      <p className="text-xs text-yellow-800 dark:text-yellow-300">
                        {safeError || 'Unable to connect to Safe Wallet API'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-yellow-800 dark:text-yellow-300 mb-2">
                    Use Transaction Builder as fallback:
                  </p>
                  <a
                    href={getTransactionBuilderUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in Transaction Builder
                  </a>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isEnabling || isProcessing}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                {canEnable ? (
                  <button
                    onClick={handleEnable}
                    disabled={isEnabling || isProcessing || !safeInfo}
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
                ) : (
                  <a
                    href={getTransactionBuilderUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Use Transaction Builder
                  </a>
                )}
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
