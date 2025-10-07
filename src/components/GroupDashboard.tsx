'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Address, isAddress } from 'viem';
import { useGroupDetails, useUpdateGroupName, useDeactivateGroup } from '@/hooks/useSyncGroupRegistry';
import { useModuleManager } from '@/hooks/useModuleManager';
import { useGroupSafes } from '@/hooks/useGroupSafes';
import { getBlockExplorerUrl } from '@/lib/deployments';
import { buildSafeAppUrl } from '@/lib/safe-batch';
import {
  Shield,
  Users,
  Settings,
  ExternalLink,
  Edit2,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Plus,
  Loader2
} from 'lucide-react';
import { cn, truncateAddress } from '@/lib/utils';

interface GroupDashboardProps {
  groupId: bigint;
}

export function GroupDashboard({ groupId }: GroupDashboardProps) {
  const { chainId } = useAccount();
  const { group, refetchGroup } = useGroupDetails(groupId, chainId || 100);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Add Safe to group
  const [safeToAdd, setSafeToAdd] = useState('');
  const [isAddingSafe, setIsAddingSafe] = useState(false);
  const [addSafeError, setAddSafeError] = useState('');

  const { updateGroupName, isPending: isUpdating, isSuccess: updateSuccess } = useUpdateGroupName(chainId || 100);
  const { deactivateGroup, isPending: isDeactivating, isSuccess: deactivateSuccess } = useDeactivateGroup(chainId || 100);

  // Use group's manager address
  const { createModuleForSafe, isLoading: isCreatingModule } = useModuleManager(group?.manager as Address);
  const { safes, isLoading: isLoadingSafes, refetch: refetchSafes } = useGroupSafes(group?.manager as Address, chainId || 100);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    await updateGroupName(groupId, newName);
    setIsEditingName(false);
    setTimeout(() => refetchGroup(), 2000);
  };

  const handleDeactivate = async () => {
    if (!confirm('Are you sure you want to deactivate this group? This action cannot be undone.')) return;
    await deactivateGroup(groupId);
    setTimeout(() => refetchGroup(), 2000);
  };

  const handleAddSafe = async () => {
    setAddSafeError('');

    // Validate address
    if (!safeToAdd.trim()) {
      setAddSafeError('Please enter a Safe address');
      return;
    }

    if (!isAddress(safeToAdd)) {
      setAddSafeError('Invalid Safe address');
      return;
    }

    // Check if Safe is already in the group
    if (safes.some(s => s.safeAddress.toLowerCase() === safeToAdd.toLowerCase())) {
      setAddSafeError('This Safe is already in the group');
      return;
    }

    setIsAddingSafe(true);
    try {
      const hash = await createModuleForSafe(safeToAdd as Address);
      if (hash) {
        setSafeToAdd('');
        // Refetch safes list after a delay
        setTimeout(() => {
          refetchSafes();
        }, 3000);
      }
    } catch (error) {
      console.error('Error adding Safe to group:', error);
      setAddSafeError('Failed to add Safe to group');
    } finally {
      setIsAddingSafe(false);
    }
  };

  if (!group) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const explorerUrl = getBlockExplorerUrl(chainId || 100);
  const createdDate = new Date(Number(group.createdAt) * 1000);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-xl font-bold text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={group.name}
              />
              <button
                onClick={handleUpdateName}
                disabled={isUpdating}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setIsEditingName(false)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
              <button
                onClick={() => {
                  setNewName(group.name);
                  setIsEditingName(true);
                }}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                group.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              )}
            >
              {group.active ? 'Active' : 'Inactive'}
            </span>
            <span className="text-sm text-gray-500">
              Created {createdDate.toLocaleDateString()}
            </span>
          </div>
        </div>

        {group.active && (
          <button
            onClick={handleDeactivate}
            disabled={isDeactivating}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeactivating ? 'Deactivating...' : 'Deactivate Group'}
          </button>
        )}
      </div>

      {/* Contract Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Manager Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Shield className="h-4 w-4 text-blue-600 mr-2" />
            <h3 className="text-sm font-semibold text-gray-900">Manager Contract</h3>
          </div>

          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono text-gray-700 truncate">
              {truncateAddress(group.manager as Address)}
            </code>
            <button
              onClick={() => handleCopy(group.manager, 'manager')}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              {copiedField === 'manager' ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            <a
              href={`${explorerUrl}/address/${group.manager}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Template Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Settings className="h-4 w-4 text-purple-600 mr-2" />
            <h3 className="text-sm font-semibold text-gray-900">Module Template</h3>
          </div>

          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono text-gray-700 truncate">
              {truncateAddress(group.template as Address)}
            </code>
            <button
              onClick={() => handleCopy(group.template, 'template')}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              {copiedField === 'template' ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            <a
              href={`${explorerUrl}/address/${group.template}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Governance Safe */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Users className="h-4 w-4 text-green-600 mr-2" />
            <h3 className="text-sm font-semibold text-gray-900">Governance Safe</h3>
          </div>

          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono text-gray-700 truncate">
              {truncateAddress(group.owner as Address)}
            </code>
            <button
              onClick={() => handleCopy(group.owner, 'owner')}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              {copiedField === 'owner' ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            <a
              href={`${explorerUrl}/address/${group.owner}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Add Safe to Group Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Plus className="h-5 w-5 mr-2 text-blue-600" />
          Add Safe to Group
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Safe Address
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={safeToAdd}
                onChange={(e) => setSafeToAdd(e.target.value)}
                placeholder="0x..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500"
                disabled={isAddingSafe || isCreatingModule}
              />
              <button
                onClick={handleAddSafe}
                disabled={isAddingSafe || isCreatingModule || !safeToAdd.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAddingSafe || isCreatingModule ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add Safe
                  </>
                )}
              </button>
            </div>
            {addSafeError && (
              <p className="mt-2 text-sm text-red-600">{addSafeError}</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">After adding a Safe</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-800">
                  <li>The module will be created for the Safe</li>
                  <li>The Safe owners must enable the module via Safe's interface</li>
                  <li>Once enabled, owners can be synchronized across the group</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Managed Safes Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
          <span className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-green-600" />
            Managed Safes ({safes.length})
          </span>
          {safes.length > 0 && (
            <button
              onClick={refetchSafes}
              disabled={isLoadingSafes}
              className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              {isLoadingSafes ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
        </h3>

        {isLoadingSafes && safes.length === 0 ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-spin" />
            <p className="text-sm text-gray-500">Loading Safes...</p>
          </div>
        ) : safes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No Safes added to this group yet</p>
            <p className="text-xs text-gray-400 mt-1">Add a Safe above to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {safes.map((safe) => (
              <div
                key={safe.moduleAddress}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-700">Safe Address:</span>
                      <code className="text-sm font-mono text-gray-900 truncate">
                        {safe.safeAddress}
                      </code>
                      <button
                        onClick={() => handleCopy(safe.safeAddress, `safe-${safe.safeAddress}`)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        {copiedField === `safe-${safe.safeAddress}` ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                      <a
                        href={`${explorerUrl}/address/${safe.safeAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Module:</span>
                      <code className="text-xs font-mono text-gray-600 truncate">
                        {safe.moduleAddress}
                      </code>
                      <button
                        onClick={() => handleCopy(safe.moduleAddress, `module-${safe.moduleAddress}`)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        {copiedField === `module-${safe.moduleAddress}` ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {safe.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        <Check className="h-3 w-3 mr-1" />
                        Active
                      </span>
                    ) : (
                      <a
                        href={buildSafeAppUrl(
                          chainId || 100,
                          safe.safeAddress,
                          typeof window !== 'undefined' ? window.location.origin : ''
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50 rounded-lg text-xs font-medium transition-colors"
                      >
                        <AlertCircle className="h-3 w-3" />
                        Enable Module in Safe
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
