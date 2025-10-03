'use client';

import { useState } from 'react';
import { Address } from 'viem';
import { RefreshCw, Users, CheckCircle, AlertCircle, Zap, Settings } from 'lucide-react';
import { useManagedModule } from '@/hooks/useManagedModule';
import { useSafeContract } from '@/hooks/useSafeContract';
import { truncateAddress, formatSyncStatus, cn } from '@/lib/utils';
import * as Switch from '@radix-ui/react-switch';

interface OwnerSyncProps {
  moduleAddress?: Address;
  safeAddress?: Address;
}

export function OwnerSync({ moduleAddress, safeAddress }: OwnerSyncProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    moduleConfig,
    syncOwnersFromSafe,
    setAutoSync,
    setRequireFullSync,
    setMaxSyncOwners,
    isLoading,
    refetchAll,
  } = useManagedModule(moduleAddress);

  const { owners: safeOwners, threshold: safeThreshold } = useSafeContract(safeAddress);

  const handleSync = async () => {
    const hash = await syncOwnersFromSafe();
    if (hash) {
      // Wait a bit and refresh data
      setTimeout(() => {
        refetchAll();
      }, 2000);
    }
  };

  const handleAutoSyncChange = async (enabled: boolean) => {
    await setAutoSync(enabled);
    setTimeout(() => refetchAll(), 1000);
  };

  const handleRequireFullSyncChange = async (enabled: boolean) => {
    await setRequireFullSync(enabled);
    setTimeout(() => refetchAll(), 1000);
  };

  const handleMaxSyncChange = async (newLimit: number) => {
    if (newLimit >= 1 && newLimit <= 50) {
      await setMaxSyncOwners(newLimit);
      setTimeout(() => refetchAll(), 1000);
    }
  };

  if (!moduleAddress || !moduleConfig.isConfigured) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <RefreshCw className="h-6 w-6 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900">Owner Synchronization</h2>
        </div>
        <p className="text-gray-600">
          Configure a module first to synchronize owners.
        </p>
      </div>
    );
  }

  const isOutOfSync = safeOwners.length !== moduleConfig.owners.length ||
                     safeThreshold !== moduleConfig.threshold;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <RefreshCw className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Owner Synchronization</h2>
        </div>

        {/* Status Badge */}
        <div className="flex items-center space-x-2">
          {moduleConfig.isSyncComplete ? (
            <div className="flex items-center space-x-1 text-green-600 bg-green-100 px-3 py-1 rounded-full">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Synced</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Partial</span>
            </div>
          )}
        </div>
      </div>

      {/* Sync Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Safe Owners */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium text-gray-900">Current Safe</h3>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Owners:</span>
              <span className="font-medium">{safeOwners.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Threshold:</span>
              <span className="font-medium">{safeThreshold}</span>
            </div>
          </div>

          <div className="mt-3 space-y-1">
            {safeOwners.slice(0, 3).map((owner, index) => (
              <div key={owner} className="text-xs font-mono text-gray-600">
                {truncateAddress(owner, 6)}
              </div>
            ))}
            {safeOwners.length > 3 && (
              <div className="text-xs text-gray-500">
                +{safeOwners.length - 3} more
              </div>
            )}
          </div>
        </div>

        {/* Module Sync */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <RefreshCw className="h-5 w-5 text-green-600" />
            <h3 className="font-medium text-gray-900">Synced Module</h3>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Owners:</span>
              <span className="font-medium">{moduleConfig.syncedOwners}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Threshold:</span>
              <span className="font-medium">{moduleConfig.threshold}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium">
                {formatSyncStatus(
                  moduleConfig.syncedOwners,
                  moduleConfig.isSyncComplete,
                  safeOwners.length
                )}
              </span>
            </div>
          </div>

          <div className="mt-3 space-y-1">
            {moduleConfig.owners.slice(0, 3).map((owner, index) => (
              <div key={owner} className="text-xs font-mono text-gray-600">
                {truncateAddress(owner, 6)}
              </div>
            ))}
            {moduleConfig.owners.length > 3 && (
              <div className="text-xs text-gray-500">
                +{moduleConfig.owners.length - 3} more
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sync Warning */}
      {isOutOfSync && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-yellow-800 font-medium">Out of sync data detected</p>
              <p className="text-yellow-700 text-sm">
                The module has different data from the current Safe. Synchronize to update.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Sync Button */}
      <div className="mb-6">
        <button
          onClick={handleSync}
          disabled={isLoading}
          className={cn(
            "w-full py-4 px-6 rounded-lg font-medium transition-all flex items-center justify-center space-x-3",
            isOutOfSync || !moduleConfig.isSyncComplete
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-green-600 text-white hover:bg-green-700"
          )}
        >
          <Zap className="h-5 w-5" />
          <span className="text-lg">
            {isLoading ? 'Synchronizing...' : 'Synchronize Owners'}
          </span>
        </button>
      </div>

      {/* Auto-sync Settings */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Sync Settings</h3>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
          >
            <Settings className="h-4 w-4" />
            <span>{showAdvanced ? 'Hide' : 'Advanced'}</span>
          </button>
        </div>

        <div className="space-y-4">
          {/* Auto Sync */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Auto-Sync</label>
              <p className="text-xs text-gray-600">Automatically synchronize before operations</p>
            </div>
            <Switch.Root
              checked={moduleConfig.autoSyncEnabled}
              onCheckedChange={handleAutoSyncChange}
              className="w-11 h-6 bg-gray-200 rounded-full relative data-[state=checked]:bg-blue-600 outline-none cursor-pointer"
            >
              <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px]" />
            </Switch.Root>
          </div>

          {showAdvanced && (
            <>
              {/* Require Full Sync */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">Require Full Sync</label>
                  <p className="text-xs text-gray-600">Block operations if sync is incomplete</p>
                </div>
                <Switch.Root
                  checked={moduleConfig.requireFullSync}
                  onCheckedChange={handleRequireFullSyncChange}
                  className="w-11 h-6 bg-gray-200 rounded-full relative data-[state=checked]:bg-blue-600 outline-none cursor-pointer"
                >
                  <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px]" />
                </Switch.Root>
              </div>

              {/* Max Sync Owners */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  Owner Limit for Sync ({moduleConfig.maxSyncOwners})
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={moduleConfig.maxSyncOwners}
                  onChange={(e) => handleMaxSyncChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1</span>
                  <span>50</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}