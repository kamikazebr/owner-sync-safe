'use client';

import { CheckCircle, Shield, Users, ExternalLink } from 'lucide-react';
import { ActiveGroupInfo } from '@/hooks/useActiveGroups';
import { useAccount } from 'wagmi';
import { getBlockExplorerUrl } from '@/lib/deployments';
import toast from 'react-hot-toast';

interface ActiveGroupsBannerProps {
  activeGroups: ActiveGroupInfo[];
}

export function ActiveGroupsBanner({ activeGroups }: ActiveGroupsBannerProps) {
  const { chainId } = useAccount();
  const explorerUrl = getBlockExplorerUrl(chainId || 100);

  const handleCopy = async (text: string, label: string) => {
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast.success(`Copied ${label} to clipboard!`);
        return;
      }
    } catch (error) {
      console.log('Clipboard API failed, using fallback:', error);
    }

    try {
      // Fallback using document.execCommand
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
        toast.success(`Copied ${label} to clipboard!`);
      } else {
        toast.error('Copy failed. Please copy manually.');
      }
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Copy failed. Please copy manually.');
    }
  };

  if (activeGroups.length === 0) return null;

  const isMultiple = activeGroups.length > 1;

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-green-500 rounded-lg p-6 shadow-sm">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <span>✅ Active in {isMultiple ? `${activeGroups.length} Groups` : 'Group'}</span>
          </h3>

          {isMultiple ? (
            <>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Your Safe is actively participating in multiple sync groups:
              </p>

              <div className="space-y-2 mb-4">
                {activeGroups.map((group, index) => (
                  <div
                    key={`${group.managerAddress}-${index}`}
                    className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {group.groupName}
                      </span>
                      <span className="ml-auto text-xs text-green-600 dark:text-green-400 font-medium">
                        Active
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5 ml-6">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-medium">Owner:</span>{' '}
                          <span
                            onClick={() => handleCopy(group.groupOwner, 'owner')}
                            className="font-mono cursor-pointer hover:text-green-700 dark:hover:text-green-300 transition-colors"
                            title="Click to copy full address"
                          >
                            {group.groupOwner.slice(0, 6)}...{group.groupOwner.slice(-4)}
                          </span>
                        </div>
                        <a
                          href={`${explorerUrl}/address/${group.groupOwner}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                          title="View on explorer"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-medium">Manager:</span>{' '}
                          <span
                            onClick={() => handleCopy(group.managerAddress, 'manager')}
                            className="font-mono cursor-pointer hover:text-green-700 dark:hover:text-green-300 transition-colors"
                            title="Click to copy full address"
                          >
                            {group.managerAddress.slice(0, 6)}...{group.managerAddress.slice(-4)}
                          </span>
                        </div>
                        <a
                          href={`${explorerUrl}/address/${group.managerAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                          title="View on explorer"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-medium">Module:</span>{' '}
                          <span
                            onClick={() => handleCopy(group.moduleAddress, 'module')}
                            className="font-mono cursor-pointer hover:text-green-700 dark:hover:text-green-300 transition-colors"
                            title="Click to copy full address"
                          >
                            {group.moduleAddress.slice(0, 6)}...{group.moduleAddress.slice(-4)}
                          </span>
                        </div>
                        <a
                          href={`${explorerUrl}/address/${group.moduleAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                          title="View on explorer"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Your Safe is actively participating in{' '}
                <span className="font-semibold text-green-700 dark:text-green-400">
                  {activeGroups[0].groupName}
                </span>
              </p>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Group details:
                </p>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2 mb-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-medium">Owner:</span>{' '}
                      <span
                        onClick={() => handleCopy(activeGroups[0].groupOwner, 'owner')}
                        className="font-mono cursor-pointer hover:text-green-700 dark:hover:text-green-300 transition-colors"
                        title="Click to copy full address"
                      >
                        {activeGroups[0].groupOwner.slice(0, 6)}...{activeGroups[0].groupOwner.slice(-4)}
                      </span>
                    </div>
                    <a
                      href={`${explorerUrl}/address/${activeGroups[0].groupOwner}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      title="View on explorer"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-medium">Manager:</span>{' '}
                      <span
                        onClick={() => handleCopy(activeGroups[0].managerAddress, 'manager')}
                        className="font-mono cursor-pointer hover:text-green-700 dark:hover:text-green-300 transition-colors"
                        title="Click to copy full address"
                      >
                        {activeGroups[0].managerAddress.slice(0, 6)}...{activeGroups[0].managerAddress.slice(-4)}
                      </span>
                    </div>
                    <a
                      href={`${explorerUrl}/address/${activeGroups[0].managerAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      title="View on explorer"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-medium">Module:</span>{' '}
                      <span
                        onClick={() => handleCopy(activeGroups[0].moduleAddress, 'module')}
                        className="font-mono cursor-pointer hover:text-green-700 dark:hover:text-green-300 transition-colors"
                        title="Click to copy full address"
                      >
                        {activeGroups[0].moduleAddress.slice(0, 6)}...{activeGroups[0].moduleAddress.slice(-4)}
                      </span>
                    </div>
                    <a
                      href={`${explorerUrl}/address/${activeGroups[0].moduleAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      title="View on explorer"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Active features:
                </p>
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    Owner synchronization enabled
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    Coordinated governance active
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    Threshold management synchronized
                  </li>
                </ul>
              </div>
            </>
          )}

          <div className="flex items-start gap-2 bg-green-50 dark:bg-green-900/30 rounded-lg p-3 border border-green-200 dark:border-green-700">
            <Users className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Note:</strong> Any owner changes will be synchronized across all Safes in {isMultiple ? 'these groups' : 'this group'}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
