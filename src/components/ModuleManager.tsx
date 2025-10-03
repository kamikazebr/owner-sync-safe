'use client';

import { useState } from 'react';
import { Address } from 'viem';
import { useAccount } from 'wagmi';
import { Settings, Plus, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useModuleManager } from '@/hooks/useModuleManager';
import { useModuleForSafe } from '@/hooks/useModuleForSafe';
import { useManagedModule } from '@/hooks/useManagedModule';
import { useSafeContract } from '@/hooks/useSafeContract';
import { useIsModuleEnabled } from '@/hooks/useIsModuleEnabled';
import { truncateAddress, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ModuleManagerProps {
  safeAddress?: Address;
  onModuleCreated?: (moduleAddress: Address) => void;
}

export function ModuleManager({ safeAddress, onModuleCreated }: ModuleManagerProps) {
  const { address } = useAccount();
  const [isCreating, setIsCreating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3">
          <Settings className="h-6 w-6 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900">Module Management</h2>
        </div>
        <p className="mt-4 text-gray-600">
          Connect your wallet and select a Safe to manage modules.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Settings className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Safe Module</h2>
        </div>
        <span className={cn('px-3 py-1 rounded-full text-sm font-medium', status.color, status.bg)}>
          {status.text}
        </span>
      </div>

      <div className="space-y-4">
        {/* Safe Info */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-2">Selected Safe</h3>
          <p className="text-sm text-gray-600 font-mono">{truncateAddress(safeAddress, 8)}</p>
        </div>

        {/* Module Status */}
        {moduleInfo?.moduleAddress && moduleInfo.moduleAddress !== '0x0000000000000000000000000000000000000000' ? (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Installed Module</h3>
              <div className="flex items-center space-x-2">
                {moduleConfig.isConfigured ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Address:</span>
                <span className="font-mono text-gray-900">{truncateAddress(moduleInfo.moduleAddress as Address, 8)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Configured:</span>
                <span className={moduleConfig.isConfigured ? 'text-green-600' : 'text-red-600'}>
                  {moduleConfig.isConfigured ? 'Yes' : 'No'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Enabled on Safe:</span>
                <span className={isModuleEnabledOnSafe ? 'text-green-600' : 'text-orange-600'}>
                  {isModuleEnabledOnSafe ? 'Yes' : 'No'}
                </span>
              </div>

              {moduleConfig.isConfigured && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Synced owners:</span>
                    <span className="text-gray-900">{moduleConfig.syncedOwners}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Threshold:</span>
                    <span className="text-gray-900">{moduleConfig.threshold}</span>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 space-y-2">
              {!isModuleEnabledOnSafe && (
                <button
                  onClick={handleEnableModule}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Enable Module on Safe</span>
                </button>
              )}

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {showSettings ? 'Hide Settings' : 'Show Settings'}
              </button>
            </div>
          </div>
        ) : (
          /* Create Module */
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>

            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Create Module
            </h3>

            <p className="text-gray-600 mb-4">
              This Safe does not have a synchronization module yet.
              Create a new module to start managing owners.
            </p>

            <button
              onClick={handleCreateModule}
              disabled={isCreating || managerLoading || !address}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mx-auto"
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
              <p className="text-red-600 text-sm mt-2">
                Connect your wallet to create a module
              </p>
            )}
          </div>
        )}

        {/* Manager Info */}
        <div className="border-t pt-4 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>You are manager owner:</span>
            <span className={isManagerOwner ? 'text-green-600' : 'text-gray-600'}>
              {isManagerOwner ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}