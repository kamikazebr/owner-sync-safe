'use client';

import { CheckCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { ActiveGroupInfo } from '@/hooks/useActiveGroups';
import { useState } from 'react';
import { Address } from 'viem';
import { useAccount } from 'wagmi';
import { getBlockExplorerUrl } from '@/lib/deployments';
import toast from 'react-hot-toast';

interface CompactActiveGroupBannerProps {
  activeGroups: ActiveGroupInfo[];
}

export function CompactActiveGroupBanner({ activeGroups }: CompactActiveGroupBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { chainId } = useAccount();
  const explorerUrl = getBlockExplorerUrl(chainId || 100);

  const handleCopy = async (text: string, label: string) => {
    try {
      // Try modern Clipboard API first (requires clipboard-write permission)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast.success(`Copied ${label} to clipboard!`);
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
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg overflow-hidden">
      {/* Compact Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>

          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-green-900 dark:text-green-100">
                ✓ Active {isMultiple ? `in ${activeGroups.length} Groups` : 'Group'}
              </span>
              {!isMultiple && (
                <span className="text-sm text-green-700 dark:text-green-300">
                  {activeGroups[0].groupName}
                </span>
              )}
            </div>
            {isMultiple && (
              <div className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                {activeGroups.map(g => g.groupName).join(', ')}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-green-600 dark:text-green-400 hidden sm:inline">
            {isExpanded ? 'Hide details' : 'View details'}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-green-600 dark:text-green-400" />
          )}
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-green-200 dark:border-green-800 px-4 py-3 bg-white dark:bg-gray-800/50">
          <div className="space-y-3">
            {activeGroups.map((group, index) => (
              <div
                key={`${group.managerAddress}-${index}`}
                className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-100 dark:border-green-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                    {group.groupName}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full font-medium">
                    Active
                  </span>
                </div>

                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">Owner:</span>
                      <code
                        onClick={() => handleCopy(group.groupOwner, 'owner address')}
                        className="font-mono break-all cursor-pointer hover:text-green-700 dark:hover:text-green-300 transition-colors ml-2"
                        title="Click to copy"
                      >
                        {group.groupOwner}
                      </code>
                    </div>
                    <a
                      href={`${explorerUrl}/address/${group.groupOwner}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      title="View on explorer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">Manager:</span>
                      <code
                        onClick={() => handleCopy(group.managerAddress, 'manager address')}
                        className="font-mono break-all cursor-pointer hover:text-green-700 dark:hover:text-green-300 transition-colors ml-2"
                        title="Click to copy"
                      >
                        {group.managerAddress}
                      </code>
                    </div>
                    <a
                      href={`${explorerUrl}/address/${group.managerAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      title="View on explorer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">Module:</span>
                      <code
                        onClick={() => handleCopy(group.moduleAddress, 'module address')}
                        className="font-mono break-all cursor-pointer hover:text-green-700 dark:hover:text-green-300 transition-colors ml-2"
                        title="Click to copy"
                      >
                        {group.moduleAddress}
                      </code>
                    </div>
                    <a
                      href={`${explorerUrl}/address/${group.moduleAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      title="View on explorer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
            <p className="text-xs text-green-700 dark:text-green-300">
              <strong>Note:</strong> Owner changes are being synchronized across all Safes in {isMultiple ? 'these groups' : 'this group'}.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
