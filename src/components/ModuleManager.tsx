'use client';

import { useState } from 'react';
import { Address } from 'viem';
import { useAccount } from 'wagmi';
import { Settings, Plus, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { useModuleManager } from '@/hooks/useModuleManager';
import { useModuleForSafe } from '@/hooks/useModuleForSafe';
import { useManagedModule } from '@/hooks/useManagedModule';
import { useSafeContract } from '@/hooks/useSafeContract';
import { useIsModuleEnabled } from '@/hooks/useIsModuleEnabled';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { copyToClipboard } from '@/lib/clipboard';
import { getBlockExplorerUrl } from '@/lib/deployments';

interface ModuleManagerProps {
  safeAddress?: Address;
  onModuleCreated?: (moduleAddress: Address) => void;
}

export function ModuleManager({ safeAddress, onModuleCreated }: ModuleManagerProps) {
  const { address, chainId } = useAccount();
  const [isCreating, setIsCreating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const explorerUrl = getBlockExplorerUrl(chainId || 100);

  const {
    createModuleForSafe,
    isLoading: managerLoading,
    isManagerOwner,
  } = useModuleManager();

  const moduleInfo = useModuleForSafe(safeAddress);
  const { moduleConfig } = useManagedModule(moduleInfo?.moduleAddress);
  const { enableModule } = useSafeContract(safeAddress);
  const { isEnabled: isModuleEnabledOnSafe } = useIsModuleEnabled(safeAddress, moduleInfo?.moduleAddress);

  const handleCreateModule = async () => {
    if (!safeAddress) {
      toast.error('Select a Safe first');
      return;
    }

    setIsCreating(true);
    try {
      const hash = await createModuleForSafe(safeAddress);
      if (hash && onModuleCreated && moduleInfo?.moduleAddress) {
        onModuleCreated(moduleInfo.moduleAddress);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleEnableModule = async () => {
    if (!moduleInfo?.moduleAddress) return;

    await enableModule(moduleInfo.moduleAddress);
  };

  const getModuleStatus = () => {
    const hasModule = moduleInfo?.moduleAddress && moduleInfo.moduleAddress !== '0x0000000000000000000000000000000000000000';
    if (!hasModule) {
      return { text: 'Not created', color: 'text-gray-500', bg: 'bg-gray-100' };
    }
    if (!moduleConfig.isConfigured) {
      return { text: 'Not configured', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    }
    if (!isModuleEnabledOnSafe) {
      return { text: 'Not enabled', color: 'text-orange-600', bg: 'bg-orange-100' };
    }
    return { text: 'Active', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const status = getModuleStatus();

  if (!safeAddress) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3">
          <Settings className="h-6 w-6 text-gray-400 dark:text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Module Management</h2>
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Connect your wallet and select a Safe to manage modules.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Safe Module</h2>
        </div>
        <span className={cn('px-3 py-1 rounded-full text-sm font-medium', status.color, status.bg)}>
          {status.text}
        </span>
      </div>

      <div className="space-y-4">
        {/* Safe Info */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/30">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">Selected Safe</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">{safeAddress}</p>
        </div>

        {/* Module Status */}
        {moduleInfo?.moduleAddress && moduleInfo.moduleAddress !== '0x0000000000000000000000000000000000000000' ? (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 dark:text-white">Installed Module</h3>
              <div className="flex items-center space-x-2">
                {moduleConfig.isConfigured ? (
                  <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-gray-600 dark:text-gray-400">Address:</span>
                <div className="flex items-center gap-2">
                  <span
                    onClick={() => copyToClipboard(moduleInfo.moduleAddress, 'module address')}
                    className="font-mono text-xs text-gray-900 dark:text-white break-all cursor-pointer hover:text-green-700 dark:hover:text-green-300 transition-colors"
                    title="Click to copy"
                  >
                    {moduleInfo.moduleAddress}
                  </span>
                  <a
                    href={`${explorerUrl}/address/${moduleInfo.moduleAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex-shrink-0"
                    title="View on explorer"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Configured:</span>
                <span className={moduleConfig.isConfigured ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  {moduleConfig.isConfigured ? 'Yes' : 'No'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Enabled on Safe:</span>
                <span className={isModuleEnabledOnSafe ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}>
                  {isModuleEnabledOnSafe ? 'Yes' : 'No'}
                </span>
              </div>

              {moduleConfig.isConfigured && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Synced owners:</span>
                    <span className="text-gray-900 dark:text-white">{moduleConfig.syncedOwners}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Threshold:</span>
                    <span className="text-gray-900 dark:text-white">{moduleConfig.threshold}</span>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 space-y-2">
              {!isModuleEnabledOnSafe && (
                <button
                  onClick={handleEnableModule}
                  className="w-full bg-blue-600 dark:bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Enable Module on Safe</span>
                </button>
              )}

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {showSettings ? 'Hide Settings' : 'Show Settings'}
              </button>
            </div>
          </div>
        ) : (
          /* Create Module */
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>

            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Create Module
            </h3>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This Safe does not have a synchronization module yet.
              Create a new module to start managing owners.
            </p>

            <button
              onClick={handleCreateModule}
              disabled={isCreating || managerLoading || !address}
              className="bg-blue-600 dark:bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mx-auto"
            >
              {isCreating || managerLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Create Module</span>
                </>
              )}
            </button>

            {!address && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                Connect your wallet to create a module
              </p>
            )}
          </div>
        )}

        {/* Manager Info */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex justify-between">
            <span>You are manager owner:</span>
            <span className={isManagerOwner ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
              {isManagerOwner ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}