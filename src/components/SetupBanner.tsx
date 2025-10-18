'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, Shield, Clock, Copy, Check, ExternalLink, X } from 'lucide-react';
import { useAccount } from 'wagmi';
import { PendingSetupInfo } from '@/hooks/usePendingSetup';
import { ActiveGroupInfo } from '@/hooks/useActiveGroups';
import { CompleteSetupModal } from './CompleteSetupModal';
import { getBlockExplorerUrl } from '@/lib/deployments';

function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

interface SetupBannerProps {
  pendingSetups: PendingSetupInfo[];
  hasActiveGroups?: boolean;
  activeGroups?: ActiveGroupInfo[];
  onComplete?: () => void;
  onDeclineAll?: () => void;
}

export function SetupBanner({
  pendingSetups,
  hasActiveGroups = false,
  activeGroups = [],
  onComplete,
  onDeclineAll
}: SetupBannerProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedSetup, setSelectedSetup] = useState<PendingSetupInfo | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed
  const { chainId } = useAccount();

  if (pendingSetups.length === 0) return null;

  const isMultiple = pendingSetups.length > 1;
  const explorerUrl = getBlockExplorerUrl(chainId || 100);

  // Get active group names for display
  const activeGroupNames = activeGroups.map(g => g.groupName).join(', ');

  // If collapsed, show minimal version
  if (isCollapsed) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-left">
              <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                📬 {pendingSetups.length} New Invitation{pendingSetups.length > 1 ? 's' : ''}
              </span>
              {pendingSetups.length === 1 && (
                <span className="text-sm text-blue-700 dark:text-blue-300 ml-2">
                  {pendingSetups[0].groupName}
                </span>
              )}
            </div>
          </div>
          <span className="text-xs text-blue-600 dark:text-blue-400">
            View details
          </span>
        </button>
      </div>
    );
  }


  const handleCopy = async (text: string, field: string) => {
    try {
      // Try modern Clipboard API first (requires clipboard-write permission)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
        return;
      }
    } catch (error) {
      // Modern API failed, fall through to legacy method
      console.log('Clipboard API failed, using fallback:', error);
    }

    try {
      // Fallback using document.execCommand (works in sandboxed iframes)
      const textArea = document.createElement('textarea');
      textArea.value = text;
      // Position off-screen but keep it visible (display:none or visibility:hidden breaks copy)
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);

      // Select the text
      textArea.select();
      textArea.setSelectionRange(0, text.length);

      // Execute copy command
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
      }
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleAccept = (setup: PendingSetupInfo) => {
    setSelectedSetup(setup);
    setShowModal(true);
  };

  return (
    <>
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500 rounded-lg p-6 shadow-sm">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {hasActiveGroups ? '📬 New Group Invitation(s)' : '🎉 Welcome to Owner Sync Safe!'}
            </h3>

            {/* Warning if already in active groups */}
            {hasActiveGroups && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                      You are already active in: {activeGroupNames}
                    </p>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      To accept a new invitation, you must first leave your current group(s).
                      Leaving will disable owner synchronization for the current group.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isMultiple ? (
              <>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  Your Safe has been invited to join {pendingSetups.length} groups. You can only join ONE group at a time.
                </p>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ <strong>Important:</strong> Choose one group to join. Other invitations will be automatically declined.
                  </p>
                </div>

                <div className="space-y-3 mb-4">
                  {pendingSetups.map((setup, index) => (
                    <div key={`${setup.managerAddress}-${index}`} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {setup.groupName}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5">
                            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 mb-1">
                              <Clock className="h-3 w-3" />
                              <span className="font-medium">{formatTimestamp(setup.timestamp)}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="font-medium">Owner:</span>
                              <code className="font-mono">{setup.createdBy.slice(0, 6)}...{setup.createdBy.slice(-4)}</code>
                              <button
                                onClick={() => handleCopy(setup.createdBy, `owner-${setup.moduleAddress}`)}
                                className="p-0.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                              >
                                {copiedField === `owner-${setup.moduleAddress}` ? (
                                  <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                              <a
                                href={`${explorerUrl}/address/${setup.createdBy}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-0.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="font-medium">Manager:</span>
                              <code className="font-mono">{setup.managerAddress.slice(0, 6)}...{setup.managerAddress.slice(-4)}</code>
                              <button
                                onClick={() => handleCopy(setup.managerAddress, `manager-${setup.moduleAddress}`)}
                                className="p-0.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                              >
                                {copiedField === `manager-${setup.moduleAddress}` ? (
                                  <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                              <a
                                href={`${explorerUrl}/address/${setup.managerAddress}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-0.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="font-medium">Module:</span>
                              <code className="font-mono">{setup.moduleAddress.slice(0, 6)}...{setup.moduleAddress.slice(-4)}</code>
                              <button
                                onClick={() => handleCopy(setup.moduleAddress, `module-${setup.moduleAddress}`)}
                                className="p-0.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                              >
                                {copiedField === `module-${setup.moduleAddress}` ? (
                                  <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                              <a
                                href={`${explorerUrl}/address/${setup.moduleAddress}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-0.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAccept(setup)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-sm"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  {hasActiveGroups ? 'You have been invited to join' : 'Your Safe has been added to'}{' '}
                  <span className="font-semibold text-blue-700 dark:text-blue-400">
                    {pendingSetups[0].groupName}
                  </span>
                </p>

                {!hasActiveGroups && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Complete setup to:
                    </p>
                    <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        Synchronize owners across all Safes in the group
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        Coordinate governance decisions
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        Maintain consistent threshold settings
                      </li>
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => handleAccept(pendingSetups[0])}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={hasActiveGroups}
                  title={hasActiveGroups ? 'Leave your current group first' : ''}
                >
                  {hasActiveGroups ? 'Complete Setup (Leave Current Group First)' : 'Complete Setup'}
                </button>
              </>
            )}
          </div>

          {/* Close/Minimize Button */}
          <div className="flex-shrink-0">
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
              title="Minimize"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {selectedSetup && (
        <CompleteSetupModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedSetup(null);
          }}
          pendingSetup={selectedSetup}
          pendingSetups={pendingSetups}
          onComplete={() => {
            setShowModal(false);
            setSelectedSetup(null);
            onComplete?.();
          }}
        />
      )}
    </>
  );
}
