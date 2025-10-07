'use client';

import { CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { ActiveGroupInfo } from '@/hooks/useActiveGroups';
import { useState } from 'react';
import { truncateAddress } from '@/lib/utils';
import { Address } from 'viem';

interface CompactActiveGroupBannerProps {
  activeGroups: ActiveGroupInfo[];
}

export function CompactActiveGroupBanner({ activeGroups }: CompactActiveGroupBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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

                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <div className="flex items-center gap-1">
                    <span className="font-medium w-16">Owner:</span>
                    <code className="font-mono">{truncateAddress(group.groupOwner as Address)}</code>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium w-16">Manager:</span>
                    <code className="font-mono">{truncateAddress(group.managerAddress as Address)}</code>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium w-16">Module:</span>
                    <code className="font-mono">{truncateAddress(group.moduleAddress as Address)}</code>
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
