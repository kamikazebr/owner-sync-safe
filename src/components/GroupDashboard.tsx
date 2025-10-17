'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Address, isAddress, encodeFunctionData } from 'viem';
import { useGroupDetails } from '@/hooks/useSyncGroupRegistry';
import { useModuleManager } from '@/hooks/useModuleManager';
import { useGroupSafes } from '@/hooks/useGroupSafes';
import { useSafeApps } from '@/hooks/useSafeApps';
import { getBlockExplorerUrl, getDeployedAddress } from '@/lib/deployments';
import { buildSafeAppUrl, buildSafeHomeUrl, encodeDeactivateGroup, buildSafeTransactionBuilderUrl } from '@/lib/safe-batch';
import {
  Shield,
  Users,
  Settings,
  ExternalLink,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Plus,
  Loader2,
  X,
  UserCog
} from 'lucide-react';
import { cn, truncateAddress, extractSafeAddress } from '@/lib/utils';
import toast from 'react-hot-toast';
import * as Dialog from '@radix-ui/react-dialog';
import { OwnerManagementModal } from '@/components/OwnerManagementModal';

interface GroupDashboardProps {
  groupId: bigint;
}

export function GroupDashboard({ groupId }: GroupDashboardProps) {
  const { chainId } = useAccount();
  const { group, refetchGroup } = useGroupDetails(groupId, chainId || 100);
  const { isSafeApp, safeInfo, sdk } = useSafeApps();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  // Owner management modal state
  const [showOwnerModal, setShowOwnerModal] = useState(false);

  // Add Safe to group
  const [safeToAdd, setSafeToAdd] = useState('');
  const [isAddingSafe, setIsAddingSafe] = useState(false);
  const [addSafeError, setAddSafeError] = useState('');

  // Use group's manager address
  const { createModuleForSafe, isLoading: isCreatingModule } = useModuleManager(group?.manager as Address);
  const { safes, isLoading: isLoadingSafes, refetch: refetchSafes } = useGroupSafes(group?.manager as Address, chainId || 100);

  const handleCopy = async (text: string, field: string) => {
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
        return;
      }

      // Fallback for iframe contexts (like Safe app)
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      textArea.remove();

      if (successful) {
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
      } else {
        toast.error('Copy failed. Please copy manually.');
      }
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Copy failed. Please copy manually.');
    }
  };

  // Check if we can execute deactivate directly via Safe SDK
  const canExecuteDirectly = !!(
    isSafeApp &&
    safeInfo &&
    sdk &&
    group &&
    safeInfo.safeAddress.toLowerCase() === group.owner.toLowerCase()
  );

  // Debug logging
  console.log('Deactivate Debug:', {
    isSafeApp,
    hasSafeInfo: !!safeInfo,
    hasSdk: !!sdk,
    hasGroup: !!group,
    safeAddress: safeInfo?.safeAddress,
    groupOwner: group?.owner,
    canExecuteDirectly,
  });

  const confirmDeactivate = () => {
    setShowDeactivateConfirm(true);
  };

  const handleDeactivateViaSdk = async () => {
    console.log('handleDeactivateViaSdk called', { sdk, group, chainId });
    setShowDeactivateConfirm(false);

    if (!sdk || !group || !chainId) {
      console.error('Missing required data:', { sdk, group, chainId });
      toast.error('Missing required data');
      return;
    }

    setIsDeactivating(true);
    console.log('Starting deactivation...');

    try {
      const registryAddress = getDeployedAddress(chainId, 'SyncGroupRegistry');
      console.log('Registry address:', registryAddress);

      if (!registryAddress) {
        toast.error('Registry not found');
        return;
      }

      // Encode the deactivateGroup call
      const data = encodeFunctionData({
        abi: [{
          name: 'deactivateGroup',
          type: 'function',
          inputs: [{ name: 'groupId', type: 'uint256' }],
          outputs: [],
          stateMutability: 'nonpayable',
        }],
        functionName: 'deactivateGroup',
        args: [groupId],
      });

      console.log('Encoded data:', data);
      console.log('Sending transaction to Safe SDK...');

      // Send transaction via Safe SDK
      const { safeTxHash } = await sdk.txs.send({
        txs: [{
          to: registryAddress,
          value: '0',
          data,
        }],
      });

      toast.success('Deactivation transaction proposed! Check Safe to approve.');
      console.log('Safe TX Hash:', safeTxHash);

      // Refetch group data after a delay
      setTimeout(() => refetchGroup(), 3000);
    } catch (error) {
      console.error('Error deactivating group:', error);
      toast.error(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeactivating(false);
    }
  };

  const getDeactivateGroupUrl = () => {
    if (!group || !chainId) return '';

    const registryAddress = getDeployedAddress(chainId, 'SyncGroupRegistry');
    if (!registryAddress) return '';

    const deactivateTransaction = encodeDeactivateGroup(registryAddress as Address, groupId);
    return buildSafeTransactionBuilderUrl(chainId, group.owner as Address, deactivateTransaction);
  };

  const handleAddSafe = async () => {
    setAddSafeError('');

    // Validate input
    if (!safeToAdd.trim()) {
      setAddSafeError('Please enter a Safe address or URL');
      return;
    }

    // Extract address from URL, chain prefix, or direct address
    const extractedAddress = extractSafeAddress(safeToAdd);
    console.log('🔍 Debug extractSafeAddress:', {
      input: safeToAdd,
      extracted: extractedAddress,
      isValid: extractedAddress ? isAddress(extractedAddress) : false
    });

    if (!extractedAddress || !isAddress(extractedAddress)) {
      setAddSafeError('Invalid Safe address or URL. Accepted formats: URL, chain:address, or 0x...');
      return;
    }

    // Check if Safe is already in the group
    if (safes.some(s => s.safeAddress.toLowerCase() === extractedAddress.toLowerCase())) {
      setAddSafeError('This Safe is already in the group');
      return;
    }

    setIsAddingSafe(true);
    try {
      const hash = await createModuleForSafe(extractedAddress as Address);
      if (hash) {
        setSafeToAdd('');
        toast.success(`Safe ${truncateAddress(extractedAddress as Address)} added to group!`);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{group.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                group.active ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
              )}
            >
              {group.active ? 'Active' : 'Inactive'}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Created {createdDate.toLocaleDateString()}
            </span>
          </div>
        </div>

        {group.active && (
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              {/* Manage Owners Button */}
              <button
                onClick={() => setShowOwnerModal(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                <UserCog className="h-4 w-4 mr-2" />
                Manage Owners
              </button>

              {/* Deactivate Group Button */}
              {canExecuteDirectly ? (
                // Direct execution via Safe SDK
                <button
                  onClick={confirmDeactivate}
                  disabled={isDeactivating}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeactivating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deactivating...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deactivate Group
                    </>
                  )}
                </button>
              ) : (
                // Fallback to Transaction Builder
                <a
                  href={getDeactivateGroupUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deactivate Group
                  <ExternalLink className="h-3.5 w-3.5 ml-2" />
                </a>
              )}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {canExecuteDirectly ? 'Proposes transaction in current Safe' : 'Opens in Governance Safe'}
            </span>
          </div>
        )}
      </div>

      {/* Contract Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Manager Info */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Manager Contract</h3>
          </div>

          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
              {truncateAddress(group.manager as Address)}
            </code>
            <button
              onClick={() => handleCopy(group.manager, 'manager')}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              {copiedField === 'manager' ? (
                <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            <a
              href={`${explorerUrl}/address/${group.manager}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Template Info */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Settings className="h-4 w-4 text-purple-600 dark:text-purple-400 mr-2" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Module Template</h3>
          </div>

          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
              {truncateAddress(group.template as Address)}
            </code>
            <button
              onClick={() => handleCopy(group.template, 'template')}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              {copiedField === 'template' ? (
                <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            <a
              href={`${explorerUrl}/address/${group.template}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Governance Safe */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Users className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Governance Safe</h3>
          </div>

          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
              {truncateAddress(group.owner as Address)}
            </code>
            <button
              onClick={() => handleCopy(group.owner, 'owner')}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              {copiedField === 'owner' ? (
                <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            <a
              href={`${explorerUrl}/address/${group.owner}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Add Safe to Group Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Plus className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
          Add Safe to Group
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Safe Address or URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={safeToAdd}
                onChange={(e) => setSafeToAdd(e.target.value)}
                placeholder="0x... or https://app.safe.global/home?safe=gno:0x..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500"
                disabled={isAddingSafe || isCreatingModule}
              />
              <button
                onClick={handleAddSafe}
                disabled={isAddingSafe || isCreatingModule || !safeToAdd.trim()}
                className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{addSafeError}</p>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-300">
                <p className="font-medium mb-1">After adding a Safe</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-800 dark:text-blue-400">
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
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
          <span className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
            Managed Safes ({safes.length})
          </span>
          <button
            onClick={refetchSafes}
            disabled={isLoadingSafes}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 transition-colors"
          >
            {isLoadingSafes ? 'Refreshing...' : 'Refresh'}
          </button>
        </h3>

        {isLoadingSafes && safes.length === 0 ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-gray-500 animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading Safes...</p>
          </div>
        ) : safes.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Users className="h-12 w-12 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
            <p className="text-sm">No Safes added to this group yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add a Safe above to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {safes.map((safe) => (
              <div
                key={safe.moduleAddress}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors bg-gray-50 dark:bg-gray-900/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Safe Address:</span>
                      <code className="text-sm font-mono text-gray-900 dark:text-gray-100 truncate">
                        {safe.safeAddress}
                      </code>
                      <button
                        onClick={() => handleCopy(safe.safeAddress, `safe-${safe.safeAddress}`)}
                        className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        title="Copy address"
                      >
                        {copiedField === `safe-${safe.safeAddress}` ? (
                          <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                      <a
                        href={buildSafeHomeUrl(chainId || 100, safe.safeAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        title="Open in Safe interface"
                      >
                        <Shield className="h-3 w-3" />
                      </a>
                      <a
                        href={`${explorerUrl}/address/${safe.safeAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        title="View on block explorer"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Module:</span>
                      <code className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate">
                        {safe.moduleAddress}
                      </code>
                      <button
                        onClick={() => handleCopy(safe.moduleAddress, `module-${safe.moduleAddress}`)}
                        className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        {copiedField === `module-${safe.moduleAddress}` ? (
                          <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex flex-col gap-2">
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

      {/* Owner Management Modal */}
      <OwnerManagementModal
        isOpen={showOwnerModal}
        onClose={() => setShowOwnerModal(false)}
        managerAddress={group?.manager as Address}
      />

      {/* Deactivate Confirmation Modal */}
      <Dialog.Root open={showDeactivateConfirm} onOpenChange={setShowDeactivateConfirm}>
        <Dialog.Portal>
          <Dialog.Overlay className="bg-black/50 fixed inset-0 z-50" />
          <Dialog.Content className="bg-white dark:bg-gray-800 rounded-lg p-6 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                Deactivate Group
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded">
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Are you sure you want to deactivate "<strong>{group?.name}</strong>"?
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  ⚠️ This action will disable owner synchronization for all Safes in this group. This cannot be undone.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Dialog.Close asChild>
                  <button className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  onClick={handleDeactivateViaSdk}
                  disabled={isDeactivating}
                  className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isDeactivating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deactivating...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Deactivate
                    </>
                  )}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
