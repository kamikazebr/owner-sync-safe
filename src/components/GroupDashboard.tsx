'use client';

import { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useReadContract } from 'wagmi';
import { Address, isAddress, encodeFunctionData } from 'viem';
import { useGroupDetails } from '@/hooks/useSyncGroupRegistry';
import { useModuleManager } from '@/hooks/useModuleManager';
import { useGroupSafes } from '@/hooks/useGroupSafes';
import { useSafeApps } from '@/hooks/useSafeApps';
import { useOwnerSyncStatus } from '@/hooks/useOwnerSyncStatus';
import { getBlockExplorerUrl, getDeployedAddress } from '@/lib/deployments';
import { buildSafeAppUrl, buildSafeHomeUrl, buildSafeModulesUrl, encodeDeactivateGroup, buildSafeTransactionBuilderUrl } from '@/lib/safe-batch';
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
  UserCog,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { cn, extractSafeAddress, extractSafeAddressWithChain, CHAIN_ID_TO_NAME } from '@/lib/utils';
import toast from 'react-hot-toast';
import * as Dialog from '@radix-ui/react-dialog';
import { OwnerManagementModal } from '@/components/OwnerManagementModal';
import { OwnerSyncStatusModal } from '@/components/OwnerSyncStatusModal';

interface GroupDashboardProps {
  groupId: bigint;
}

interface SafeListItemProps {
  safe: {
    safeAddress: Address;
    moduleAddress: Address;
    isActive: boolean;
  };
  chainId: number;
  explorerUrl: string;
  copiedField: string | null;
  handleCopy: (text: string, field: string) => void;
  activeSafesCount: number;
}

function SafeListItem({ safe, chainId, explorerUrl, copiedField, handleCopy, activeSafesCount }: SafeListItemProps) {
  // Get sync status for this Safe (hooks can be called here since it's a component)
  const syncStatus = safe.isActive ? useOwnerSyncStatus(safe.safeAddress, safe.moduleAddress) : null;

  // Only show sync status if there are multiple Safes to sync (2+)
  const showSyncStatus = activeSafesCount > 1;

  return (
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
              href={buildSafeHomeUrl(chainId, safe.safeAddress)}
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
            <a
              href={`${explorerUrl}/address/${safe.moduleAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              title="View on block explorer"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="flex-shrink-0 flex flex-col gap-2">
          {safe.isActive ? (
            <>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <Check className="h-3 w-3 mr-1" />
                Active
              </span>
              {showSyncStatus && syncStatus && syncStatus.isInSync ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  In Sync
                </span>
              ) : showSyncStatus && syncStatus && syncStatus.needsSync ? (
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 cursor-help"
                  title={`Actual owners: ${syncStatus.actualOwners.length}, Cached: ${syncStatus.cachedOwners.length}`}
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Out of Sync
                </span>
              ) : null}
            </>
          ) : (
            <>
              {/* Load this app in Safe */}
              <a
                href={buildSafeAppUrl(
                  chainId,
                  safe.safeAddress,
                  typeof window !== 'undefined' ? window.location.origin : ''
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50 rounded-lg text-xs font-medium transition-colors"
                title="Open this app inside Safe"
              >
                <AlertCircle className="h-3 w-3" />
                Enable Module
                <ExternalLink className="h-3 w-3" />
              </a>
              {/* Go to modules settings */}
              <a
                href={buildSafeModulesUrl(chainId, safe.safeAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg text-xs font-medium transition-colors"
                title="Go to Safe modules settings"
              >
                <Settings className="h-3 w-3" />
                Modules Settings
                <ExternalLink className="h-3 w-3" />
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
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

  // Sync status modal state
  const [showSyncStatusModal, setShowSyncStatusModal] = useState(false);

  // Add Safe to group
  const [safeToAdd, setSafeToAdd] = useState('');
  const [isAddingSafe, setIsAddingSafe] = useState(false);
  const [addSafeError, setAddSafeError] = useState('');

  // Parsed Safes with chain info
  interface ParsedSafe {
    address: Address;
    chainId: number | null;
    chainName: string | null;
    isValidChain: boolean;
    input: string;
  }
  const [parsedSafes, setParsedSafes] = useState<ParsedSafe[]>([]);

  // Progress tracking for batch add
  interface SafeProgress {
    address: Address;
    status: 'pending' | 'processing' | 'success' | 'error';
  }
  const [safeProgress, setSafeProgress] = useState<SafeProgress[]>([]);

  // Use group's manager address
  const { createModuleForSafe, createModulesForSafes, isLoading: isCreatingModule } = useModuleManager(group?.manager as Address);
  const { safes, isLoading: isLoadingSafes, refetch: refetchSafes } = useGroupSafes(group?.manager as Address, chainId || 100);

  // Calculate active Safes count for button states
  const activeSafesCount = safes.filter(s => s.isActive).length;

  // Manager implementation verification
  const publicClient = usePublicClient({ chainId: chainId || 100 });
  const [managerImplementation, setManagerImplementation] = useState<Address | null>(null);

  // Read canonical implementation from SyncGroupRegistry
  const registryAddress = getDeployedAddress(chainId || 100, 'SyncGroupRegistry');
  const { data: canonicalManagerImpl } = useReadContract({
    address: registryAddress as Address,
    abi: [{
      name: 'managerImplementation',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ type: 'address' }],
    }] as const,
    functionName: 'managerImplementation',
    chainId: chainId || 100,
    query: {
      enabled: !!registryAddress,
    },
  });

  // Read manager's actual implementation from ERC1967 storage slot
  useEffect(() => {
    const fetchManagerImplementation = async () => {
      if (!group?.manager || !publicClient) return;

      try {
        // ERC1967 implementation storage slot
        const slot = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
        const data = await publicClient.getStorageAt({
          address: group.manager as Address,
          slot: slot as `0x${string}`,
        });

        if (data && data !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
          // Extract address from bytes32 (last 20 bytes)
          const implAddress = ('0x' + data.slice(-40)) as Address;
          setManagerImplementation(implAddress);
        }
      } catch (error) {
        console.error('Failed to read manager implementation:', error);
      }
    };

    fetchManagerImplementation();
  }, [group?.manager, publicClient]);

  // Check if implementation is up-to-date
  const isImplementationUpToDate = managerImplementation && canonicalManagerImpl
    ? managerImplementation.toLowerCase() === (canonicalManagerImpl as string).toLowerCase()
    : null;

  const handleCopy = async (text: string, field: string) => {
    try {
      // Try modern Clipboard API first (requires clipboard-write permission)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
        toast.success('Copied to clipboard!');
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
        toast.success('Copied to clipboard!');
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
        params: {
          safeTxGas: 10000000, // 10M gas limit for complex transactions
        },
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

  // Parse input text and extract multiple Safe addresses
  const parseSafeInput = (input: string): ParsedSafe[] => {
    if (!input.trim()) return [];

    // Split by newline or comma
    const lines = input.split(/[\n,]/).map(l => l.trim()).filter(l => l);
    const parsed: ParsedSafe[] = [];

    for (const line of lines) {
      const result = extractSafeAddressWithChain(line);
      if (result) {
        const { address, chainId: detectedChainId } = result;
        const chainName = detectedChainId ? CHAIN_ID_TO_NAME[detectedChainId] || 'Unknown' : null;
        const isValidChain = detectedChainId === null || detectedChainId === chainId;

        parsed.push({
          address: address as Address,
          chainId: detectedChainId,
          chainName,
          isValidChain,
          input: line,
        });
      }
    }

    return parsed;
  };

  // Update parsed Safes when input changes
  const handleInputChange = (value: string) => {
    setSafeToAdd(value);
    setParsedSafes(parseSafeInput(value));
    setAddSafeError('');
  };

  const handleAddSafe = async () => {
    setAddSafeError('');

    // Validate input
    if (!safeToAdd.trim()) {
      setAddSafeError('Please enter Safe address(es) or URL(s)');
      return;
    }

    const safesToAdd = parseSafeInput(safeToAdd);

    if (safesToAdd.length === 0) {
      setAddSafeError('No valid Safe addresses found. Accepted formats: URL, chain:address, or 0x...');
      return;
    }

    // Check for invalid chains
    const invalidChainSafes = safesToAdd.filter(s => !s.isValidChain);
    if (invalidChainSafes.length > 0) {
      setAddSafeError(`Cannot add Safes from different chains. Please ensure all Safes are on ${CHAIN_ID_TO_NAME[chainId || 100]} (chain ID ${chainId || 100})`);
      return;
    }

    // Check for duplicates with existing Safes
    const existingSafeAddresses = new Set(safes.map(s => s.safeAddress.toLowerCase()));
    const newSafes = safesToAdd.filter(s => !existingSafeAddresses.has(s.address.toLowerCase()));
    const duplicates = safesToAdd.filter(s => existingSafeAddresses.has(s.address.toLowerCase()));

    if (duplicates.length > 0) {
      toast.error(`${duplicates.length} Safe(s) already in the group`, { duration: 3000 });
    }

    if (newSafes.length === 0) {
      setAddSafeError('All entered Safes are already in the group');
      return;
    }

    // Initialize progress tracking
    setSafeProgress(newSafes.map(s => ({ address: s.address, status: 'pending' as const })));

    setIsAddingSafe(true);
    try {
      const addresses = newSafes.map(s => s.address);
      const { successful, failed } = await createModulesForSafes(addresses, (current, total, address, status) => {
        setSafeProgress(prev => prev.map(p =>
          p.address.toLowerCase() === address.toLowerCase()
            ? { ...p, status: status === 'pending' ? 'processing' : status }
            : p
        ));
      });

      if (successful.length > 0) {
        setSafeToAdd('');
        setParsedSafes([]);
        setSafeProgress([]);
        // Refetch safes list after a delay
        setTimeout(() => {
          refetchSafes();
        }, 3000);
      }

      if (failed.length > 0 && successful.length === 0) {
        setAddSafeError(`Failed to add ${failed.length} Safe(s)`);
      }
    } catch (error) {
      console.error('Error adding Safes to group:', error);
      setAddSafeError('Failed to add Safes to group');
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
              {/* View Sync Status Button */}
              <button
                onClick={() => setShowSyncStatusModal(true)}
                disabled={activeSafesCount === 0}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={activeSafesCount === 0 ? 'No active Safes in this group' : undefined}
              >
                <Users className="h-4 w-4 mr-2" />
                View Sync Status
              </button>

              {/* Manage Owners Button */}
              <button
                onClick={() => setShowOwnerModal(true)}
                disabled={activeSafesCount === 0}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={activeSafesCount === 0 ? 'No active Safes in this group' : undefined}
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
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Manager Contract</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">SafeModuleManager</p>
              </div>
            </div>
            {isImplementationUpToDate !== null && (
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium cursor-help',
                  isImplementationUpToDate
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                )}
                title={managerImplementation ? `Implementation: ${managerImplementation}` : 'Loading implementation...'}
              >
                {isImplementationUpToDate ? '✓ Up to date' : '⚠ Upgrade available'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
              {group.manager}
            </code>
            <button
              onClick={() => handleCopy(group.manager, 'manager')}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex-shrink-0"
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
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex-shrink-0"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Your Module Proxy (if connected Safe is in this group) */}
        {(() => {
          const connectedSafeModule = isSafeApp && safeInfo
            ? safes.find(s => s.safeAddress.toLowerCase() === safeInfo.safeAddress.toLowerCase())
            : null;

          if (!connectedSafeModule) return null;

          return (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Settings className="h-4 w-4 text-purple-600 dark:text-purple-400 mr-2" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Your Module</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">ManagedSafeModule Proxy</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                  {connectedSafeModule.moduleAddress}
                </code>
                <button
                  onClick={() => handleCopy(connectedSafeModule.moduleAddress, 'your-module')}
                  className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  {copiedField === 'your-module' ? (
                    <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
                <a
                  href={`${explorerUrl}/address/${connectedSafeModule.moduleAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          );
        })()}

        {/* Governance Safe */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Users className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Governance Safe</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Safe</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
              {group.owner}
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

      {/* Advanced Info - Collapsible */}
      <details className="mt-6">
        <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Advanced Info
        </summary>

        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Module Template (Implementation)</h4>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                  {group.template}
                </code>
                <button
                  onClick={() => handleCopy(group.template, 'template')}
                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {copiedField === 'template' ? (
                    <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
                <a
                  href={`${explorerUrl}/address/${group.template}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                ⚠️ This is the implementation contract. Do NOT enable this on your Safe. Use the "Your Module" address above.
              </p>
            </div>
          </div>
        </div>
      </details>

      {/* Add Safe to Group Section - Compact */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">Add Safes to Group</span>
        </div>

        <div className="space-y-3">
          <div>
            <textarea
              value={safeToAdd}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Paste Safe addresses or URLs (one per line or comma-separated)
Example:
gno:0x1234...
https://app.safe.global/home?safe=gno:0x5678..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500 font-mono"
              disabled={isAddingSafe || isCreatingModule}
            />
          </div>

          {/* Parsed Safes Preview */}
          {parsedSafes.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Found {parsedSafes.length} Safe(s):
              </div>
              {parsedSafes.map((safe, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-2 py-1 text-xs bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
                >
                  <span className="font-mono text-gray-700 dark:text-gray-300 truncate flex-1">
                    {safe.address.slice(0, 10)}...{safe.address.slice(-8)}
                  </span>
                  {safe.chainName && (
                    <span className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium",
                      safe.isValidChain
                        ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                        : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                    )}>
                      {safe.chainName}
                    </span>
                  )}
                  {!safe.isValidChain && safe.chainId !== null && (
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Progress tracking during batch add */}
          {isAddingSafe && safeProgress.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Adding Safes ({safeProgress.filter(p => p.status === 'success').length}/{safeProgress.length} completed):
              </div>
              {safeProgress.map((progress, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-2 py-1 text-xs bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
                >
                  <span className="font-mono text-gray-700 dark:text-gray-300 truncate flex-1">
                    {progress.address.slice(0, 10)}...{progress.address.slice(-8)}
                  </span>
                  {progress.status === 'pending' && (
                    <span className="text-gray-500">Pending...</span>
                  )}
                  {progress.status === 'processing' && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  )}
                  {progress.status === 'success' && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  {progress.status === 'error' && (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleAddSafe}
            disabled={isAddingSafe || isCreatingModule || !safeToAdd.trim() || parsedSafes.length === 0}
            className="w-full px-4 py-2 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isAddingSafe || isCreatingModule ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding {parsedSafes.length > 1 ? `${parsedSafes.length} Safes` : 'Safe'}...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add {parsedSafes.length > 1 ? `${parsedSafes.length} Safes` : parsedSafes.length === 1 ? 'Safe' : 'Safes'}
              </>
            )}
          </button>
        </div>

        {addSafeError && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">{addSafeError}</p>
        )}

        {/* Collapsible info */}
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
            ℹ️ How it works
          </summary>
          <ol className="list-decimal list-inside mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400 pl-4">
            <li>Paste multiple Safe addresses (one per line or comma-separated)</li>
            <li>Chain is detected from URL or prefix (gno:, eth:, etc.)</li>
            <li>Red badge warns if Safe chain doesn't match connected chain</li>
            <li>Module created for each Safe sequentially</li>
            <li>Safe owners enable modules via Safe interface</li>
            <li>Owners synchronized across group</li>
          </ol>
        </details>
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
          <div className="space-y-6">
            {/* Active Safes */}
            {safes.filter(s => s.isActive).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  Active ({safes.filter(s => s.isActive).length})
                </h4>
                <div className="space-y-3">
                  {safes.filter(s => s.isActive).map((safe) => (
                    <SafeListItem
                      key={safe.moduleAddress}
                      safe={safe}
                      chainId={chainId || 100}
                      explorerUrl={explorerUrl}
                      copiedField={copiedField}
                      handleCopy={handleCopy}
                      activeSafesCount={activeSafesCount}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Inactive Safes */}
            {safes.filter(s => !s.isActive).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  Pending Setup ({safes.filter(s => !s.isActive).length})
                </h4>
                <div className="space-y-3">
                  {safes.filter(s => !s.isActive).map((safe) => (
                    <SafeListItem
                      key={safe.moduleAddress}
                      safe={safe}
                      chainId={chainId || 100}
                      explorerUrl={explorerUrl}
                      copiedField={copiedField}
                      handleCopy={handleCopy}
                      activeSafesCount={activeSafesCount}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Owner Management Modal */}
      <OwnerManagementModal
        isOpen={showOwnerModal}
        onClose={() => setShowOwnerModal(false)}
        managerAddress={group?.manager as Address}
      />

      {/* Owner Sync Status Modal */}
      <OwnerSyncStatusModal
        isOpen={showSyncStatusModal}
        onClose={() => setShowSyncStatusModal(false)}
        safes={safes || []}
        chainId={chainId}
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
