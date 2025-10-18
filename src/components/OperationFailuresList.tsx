'use client';

import { Address } from 'viem';
import { AlertCircle, Clock, ExternalLink } from 'lucide-react';
import { useRecentFailuresForTx } from '@/hooks/useOperationFailures';
import { useAccount } from 'wagmi';
import { copyToClipboard } from '@/lib/clipboard';
import { getBlockExplorerUrl } from '@/lib/deployments';

interface OperationFailuresListProps {
  transactionHash?: string;
  managerAddress?: Address;
}

export function OperationFailuresList({ transactionHash }: OperationFailuresListProps) {
  const { chainId } = useAccount();
  const { data: failures, isLoading } = useRecentFailuresForTx(transactionHash);
  const explorerUrl = getBlockExplorerUrl(chainId || 100);

  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Clock className="h-4 w-4 animate-spin" />
          <span>Checking for operation results...</span>
        </div>
      </div>
    );
  }

  if (!failures || failures.length === 0) {
    return null;
  }

  return (
    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <div className="flex items-start gap-2 mb-3">
        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-red-900 dark:text-red-200">
            Operation Failed on {failures.length} Safe{failures.length > 1 ? 's' : ''}
          </h4>
          <p className="text-xs text-red-800 dark:text-red-300 mt-1">
            Some Safes couldn't process the operation. This usually means the module isn't enabled yet.
          </p>
        </div>
      </div>

      <div className="space-y-2 mt-3">
        {failures.map((failure) => (
          <div
            key={failure.id}
            className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-1 mb-1">
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    Safe:
                  </span>
                  <div className="flex items-center gap-2">
                    <code
                      onClick={() => copyToClipboard(failure.safe, 'safe address')}
                      className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all cursor-pointer hover:text-green-700 dark:hover:text-green-300 transition-colors"
                      title="Click to copy safe address"
                    >
                      {failure.safe}
                    </code>
                    <a
                      href={`${explorerUrl}/address/${failure.safe}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex-shrink-0"
                      title="View safe on explorer"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded">
                    {failure.operation}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">
                  Error: Module not enabled
                </p>
              </div>
              <a
                href={`https://gnosisscan.io/tx/${failure.transactionHash.startsWith('0x') ? failure.transactionHash : `0x${failure.transactionHash}`}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                title="View transaction on explorer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
        <p className="text-xs text-red-800 dark:text-red-300">
          <strong>Fix:</strong> Enable the module on each failed Safe by going to their individual
          Safe settings and enabling the module.
        </p>
      </div>
    </div>
  );
}
