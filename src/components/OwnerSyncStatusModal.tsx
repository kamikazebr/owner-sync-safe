'use client';

import { useMemo, useState } from 'react';
import { Address } from 'viem';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { X, AlertTriangle, CheckCircle, Users, ListChecks, BarChart3, Plus, Minus, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { theme } from '@/lib/theme';
import { GroupSafe } from '@/hooks/useGroupSafes';
import { useCrossSafeOwnerStatus } from '@/hooks/useOwnerSyncStatus';
import { useReconcileOwners } from '@/hooks/useReconcileOwners';
import { copyToClipboard } from '@/lib/clipboard';
import { getBlockExplorerUrl } from '@/lib/deployments';

interface OwnerSyncStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  safes: GroupSafe[];
  chainId?: number;
  managerAddress?: Address;
}

export function OwnerSyncStatusModal({
  isOpen,
  onClose,
  safes,
  chainId,
  managerAddress,
}: OwnerSyncStatusModalProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'per-safe' | 'reconcile'>('summary');
  const crossSafeStatus = useCrossSafeOwnerStatus(safes, chainId);
  const explorerUrl = getBlockExplorerUrl(chainId || 100);

  // Selected owners for reconciliation
  const [selectedOwners, setSelectedOwners] = useState<Set<string>>(new Set());
  const [newThreshold, setNewThreshold] = useState<number>(1);

  // Get reconciliation logic and impact
  const { impact, reconcile, isReconciling } = useReconcileOwners(
    managerAddress,
    crossSafeStatus?.individualStatuses,
    selectedOwners,
    newThreshold
  );

  // Group owners by presence across Safes
  const ownerAnalysis = useMemo(() => {
    if (!crossSafeStatus) return null;

    const { commonOwners, divergentOwners, individualStatuses } = crossSafeStatus;

    // Build comprehensive owner map
    const ownerMap = new Map<string, { owner: Address; safes: Address[]; isCommon: boolean }>();

    // Add common owners
    commonOwners.forEach(owner => {
      ownerMap.set(owner.toLowerCase(), {
        owner,
        safes: individualStatuses.map(s => s.safeAddress),
        isCommon: true,
      });
    });

    // Add divergent owners
    divergentOwners.forEach((safesWithOwner, ownerKey) => {
      if (!ownerMap.has(ownerKey)) {
        ownerMap.set(ownerKey, {
          owner: ownerKey as Address,
          safes: safesWithOwner,
          isCommon: false,
        });
      }
    });

    return {
      ownerMap,
      totalOwners: ownerMap.size,
      commonCount: commonOwners.length,
      divergentCount: divergentOwners.size,
    };
  }, [crossSafeStatus]);

  // Initialize selected owners with common owners when tab changes to reconcile
  useMemo(() => {
    if (activeTab === 'reconcile' && crossSafeStatus && selectedOwners.size === 0) {
      const initialSelected = new Set(crossSafeStatus.commonOwners.map(o => o.toLowerCase()));
      setSelectedOwners(initialSelected);
      // Set initial threshold to first Safe's threshold or 1
      if (crossSafeStatus.individualStatuses.length > 0) {
        setNewThreshold(crossSafeStatus.individualStatuses[0].actualThreshold);
      }
    }
  }, [activeTab, crossSafeStatus, selectedOwners.size]);

  if (!crossSafeStatus || !ownerAnalysis) {
    return null;
  }

  const { allSafesInSync, individualStatuses } = crossSafeStatus;

  const toggleOwner = (owner: string) => {
    const newSelected = new Set(selectedOwners);
    const ownerKey = owner.toLowerCase();
    if (newSelected.has(ownerKey)) {
      newSelected.delete(ownerKey);
    } else {
      newSelected.add(ownerKey);
    }
    setSelectedOwners(newSelected);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/50 fixed inset-0 z-50" />
        <Dialog.Content className="bg-white dark:bg-gray-800 fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-4xl sm:rounded-lg z-50 flex flex-col max-h-screen sm:max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-3">
              {allSafesInSync ? (
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              )}
              <div>
                <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                  Owner Sync Status
                </Dialog.Title>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {allSafesInSync
                    ? 'All Safes have identical owners'
                    : `${individualStatuses.length} Safes with different owner sets`}
                </p>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Tabs */}
          <Tabs.Root value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0">
            <Tabs.List className="flex border-b border-gray-200 dark:border-gray-700 px-6 flex-shrink-0">
              <Tabs.Trigger
                value="summary"
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'summary'
                    ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                )}
              >
                <BarChart3 className="h-4 w-4" />
                Summary
              </Tabs.Trigger>
              <Tabs.Trigger
                value="per-safe"
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'per-safe'
                    ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                )}
              >
                <Users className="h-4 w-4" />
                Per-Safe
              </Tabs.Trigger>
              <Tabs.Trigger
                value="reconcile"
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'reconcile'
                    ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                )}
              >
                <ListChecks className="h-4 w-4" />
                Reconcile
              </Tabs.Trigger>
            </Tabs.List>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Summary Tab */}
              <Tabs.Content value="summary" className="px-6 py-4 space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-medium text-blue-900 dark:text-blue-300 uppercase tracking-wide">
                        Total Owners
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {ownerAnalysis.totalOwners}
                    </p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-xs font-medium text-green-900 dark:text-green-300 uppercase tracking-wide">
                        Common
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {ownerAnalysis.commonCount}
                    </p>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-xs font-medium text-yellow-900 dark:text-yellow-300 uppercase tracking-wide">
                        Divergent
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                      {ownerAnalysis.divergentCount}
                    </p>
                  </div>
                </div>

                {/* Owner Breakdown */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Owner Distribution
                  </h3>

                  <div className="space-y-2">
                    {Array.from(ownerAnalysis.ownerMap.values()).map(({ owner, safes, isCommon }) => (
                      <div
                        key={owner}
                        className={cn(
                          'p-3 rounded-lg border',
                          isCommon
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {isCommon ? (
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                            )}
                            <span
                              onClick={() => copyToClipboard(owner, 'owner address')}
                              className="font-mono text-xs text-gray-900 dark:text-gray-100 break-all cursor-pointer hover:text-green-700 dark:hover:text-green-300 transition-colors"
                              title="Click to copy owner address"
                            >
                              {owner}
                            </span>
                            <a
                              href={`${explorerUrl}/address/${owner}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex-shrink-0"
                              title="View on explorer"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <span
                            className={cn(
                              'text-xs font-medium px-2 py-1 rounded ml-2 flex-shrink-0',
                              isCommon
                                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                                : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                            )}
                          >
                            {safes.length}/{individualStatuses.length} Safes
                          </span>
                        </div>
                        {!isCommon && (
                          <div className="mt-2 ml-7 text-xs text-gray-600 dark:text-gray-400">
                            <span className="mr-1">Present in:</span>
                            {safes.map((safe, idx) => (
                              <span key={safe} className="inline-flex items-center gap-1">
                                <span
                                  onClick={() => copyToClipboard(safe, 'safe address')}
                                  className="font-mono cursor-pointer hover:text-green-700 dark:hover:text-green-300 transition-colors"
                                  title="Click to copy safe address"
                                >
                                  {safe}
                                </span>
                                <a
                                  href={`${explorerUrl}/address/${safe}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                  title="View on explorer"
                                >
                                  <ExternalLink className="h-2 w-2" />
                                </a>
                                {idx < safes.length - 1 && <span className="mr-1">,</span>}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Warning if not in sync */}
                {!allSafesInSync && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-900 dark:text-yellow-300">
                        <p className="font-medium mb-1">Safes are out of sync</p>
                        <p className="text-xs">
                          Switch to the "Reconcile" tab to select which owners should be synchronized across all Safes.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Tabs.Content>

              {/* Per-Safe Tab */}
              <Tabs.Content value="per-safe" className="px-6 py-4">
                <div className="space-y-3">
                  {individualStatuses.map((status, index) => (
                    <div
                      key={status.safeAddress}
                      className="p-4 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Safe #{index + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            <p
                              onClick={() => copyToClipboard(status.safeAddress, 'safe address')}
                              className="font-mono text-xs text-gray-900 dark:text-gray-100 break-all cursor-pointer hover:text-green-700 dark:hover:text-green-300 transition-colors"
                              title="Click to copy safe address"
                            >
                              {status.safeAddress}
                            </p>
                            <a
                              href={`${explorerUrl}/address/${status.safeAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex-shrink-0"
                              title="View on explorer"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Threshold</span>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {status.actualThreshold}/{status.actualOwners.length}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {status.actualOwners.map(owner => {
                          const ownerInfo = ownerAnalysis.ownerMap.get(owner.toLowerCase());
                          const isCommon = ownerInfo?.isCommon ?? false;

                          return (
                            <div
                              key={owner}
                              className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded text-xs"
                            >
                              {isCommon ? (
                                <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                              ) : (
                                <AlertTriangle className="h-3 w-3 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                              )}
                              <span
                                onClick={() => copyToClipboard(owner, 'owner address')}
                                className="font-mono text-xs text-gray-900 dark:text-gray-100 break-all flex-1 cursor-pointer hover:text-green-700 dark:hover:text-green-300 transition-colors"
                                title="Click to copy owner address"
                              >
                                {owner}
                              </span>
                              <a
                                href={`${explorerUrl}/address/${owner}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex-shrink-0"
                                title="View on explorer"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              {!isCommon && (
                                <span className="text-yellow-600 dark:text-yellow-400 text-xs flex-shrink-0">
                                  Unique
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Tabs.Content>

              {/* Reconcile Tab */}
              <Tabs.Content value="reconcile" className="px-6 py-4 space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900 dark:text-blue-300">
                      <p className="font-medium mb-1">Select Target Owner Set</p>
                      <p className="text-xs">
                        Choose which owners should be present in all Safes after reconciliation. Owners already in all Safes are pre-selected.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Owner Selection ({selectedOwners.size} selected)
                  </h3>

                  <div className="space-y-2">
                    {Array.from(ownerAnalysis.ownerMap.values()).map(({ owner, safes, isCommon }) => {
                      const ownerKey = owner.toLowerCase();
                      const isSelected = selectedOwners.has(ownerKey);

                      return (
                        <label
                          key={owner}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                              : 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleOwner(owner)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                onClick={() => copyToClipboard(owner, 'owner address')}
                                className="font-mono text-xs text-gray-900 dark:text-gray-100 break-all cursor-pointer hover:text-green-700 dark:hover:text-green-300 transition-colors"
                                title="Click to copy owner address"
                              >
                                {owner}
                              </span>
                              <a
                                href={`${explorerUrl}/address/${owner}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex-shrink-0"
                                title="View on explorer"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                              Currently in {safes.length}/{individualStatuses.length} Safes
                            </span>
                          </div>
                          {isCommon && (
                            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded flex-shrink-0">
                              All Safes
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Threshold Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    New Threshold
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedOwners.size}
                    value={newThreshold}
                    onChange={(e) => setNewThreshold(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Range: 1-{selectedOwners.size}
                  </p>
                </div>

                {/* Impact Preview */}
                {impact && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Impact Preview
                    </h3>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Plus className="h-3 w-3 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-medium text-green-900 dark:text-green-300">Additions</span>
                        </div>
                        <p className="text-xl font-bold text-green-900 dark:text-green-100">
                          {impact.totalAdds}
                        </p>
                      </div>

                      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Minus className="h-3 w-3 text-red-600 dark:text-red-400" />
                          <span className="text-xs font-medium text-red-900 dark:text-red-300">Removals</span>
                        </div>
                        <p className="text-xl font-bold text-red-900 dark:text-red-100">
                          {impact.totalRemoves}
                        </p>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-medium text-blue-900 dark:text-blue-300">Affected</span>
                        </div>
                        <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                          {impact.affectedSafes}
                        </p>
                      </div>
                    </div>

                    {/* Per-Safe Changes */}
                    {impact.changes.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Changes per Safe:
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {impact.changes.map((change, index) => (
                            <div
                              key={change.safeAddress}
                              className="p-3 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <p
                                  onClick={() => copyToClipboard(change.safeAddress, 'safe address')}
                                  className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all cursor-pointer hover:text-green-700 dark:hover:text-green-300 transition-colors"
                                  title="Click to copy safe address"
                                >
                                  {change.safeAddress}
                                </p>
                                <a
                                  href={`${explorerUrl}/address/${change.safeAddress}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex-shrink-0"
                                  title="View on explorer"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                              <div className="flex gap-3 text-xs">
                                {change.ownersToAdd.length > 0 && (
                                  <span className="text-green-700 dark:text-green-400">
                                    +{change.ownersToAdd.length} owner{change.ownersToAdd.length > 1 ? 's' : ''}
                                  </span>
                                )}
                                {change.ownersToRemove.length > 0 && (
                                  <span className="text-red-700 dark:text-red-400">
                                    -{change.ownersToRemove.length} owner{change.ownersToRemove.length > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {impact.noChangeSafes > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {impact.noChangeSafes} Safe{impact.noChangeSafes > 1 ? 's' : ''} already synchronized
                      </p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={reconcile}
                    disabled={isReconciling || !impact || impact.changes.length === 0 || selectedOwners.size === 0}
                    className="flex-1 px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {isReconciling ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Proposing...
                      </>
                    ) : (
                      'Propose Reconciliation'
                    )}
                  </button>
                </div>

                {/* Warning about removals */}
                {impact && impact.totalRemoves > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-900 dark:text-yellow-300">
                        <p className="font-medium mb-1">Note on Removals</p>
                        <p className="text-xs">
                          Owner removals require prevOwner calculation and must be done manually via the "Manage Owners" modal.
                          This tool will only propose additions.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Tabs.Content>
            </div>
          </Tabs.Root>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <Dialog.Close asChild>
              <button className={cn(theme.button.secondary, 'px-4 py-2')}>Close</button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
