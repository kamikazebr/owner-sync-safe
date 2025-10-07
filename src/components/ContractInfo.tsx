'use client';

import { useChainId } from 'wagmi';
import { ExternalLink, Code, Shield, Info } from 'lucide-react';
import { getDeploymentAddresses, getBlockExplorerUrl, CONTRACT_VERSIONS } from '@/lib/deployments';
import { truncateAddress } from '@/lib/utils';
import { SafeInfo } from '@safe-global/safe-apps-sdk';

interface ContractInfoProps {
  safeInfo?: SafeInfo | null;
}

// Map chain IDs to Safe chain prefixes
const getChainPrefix = (chainId: number): string => {
  const chainPrefixes: Record<number, string> = {
    1: 'eth',      // Ethereum Mainnet
    100: 'gno',    // Gnosis Chain
    137: 'matic',  // Polygon
    42161: 'arb1', // Arbitrum One
    10: 'oeth',    // Optimism
    8453: 'base',  // Base
  };
  return chainPrefixes[chainId] || 'eth';
};

export function ContractInfo({ safeInfo }: ContractInfoProps = {}) {
  const chainId = useChainId();
  const addresses = getDeploymentAddresses(chainId);
  const explorerUrl = getBlockExplorerUrl(chainId);

  const managerAddress = addresses.SafeModuleManager || addresses.OwnerModuleFactory;
  const moduleAddress = addresses.ManagedSafeModule || addresses.ControlOwnerModule;

  if (!managerAddress && !moduleAddress) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Code className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">System Contracts</h2>
      </div>

      <div className="space-y-4">
        {managerAddress && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900 dark:text-white">SafeModuleManager (Proxy)</h3>
              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                {CONTRACT_VERSIONS.SafeModuleManager}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <code className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                {truncateAddress(managerAddress, 10)}
              </code>
              <a
                href={`${explorerUrl}/address/${managerAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
              >
                <span>View on Explorer</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        )}

        {moduleAddress && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900 dark:text-white">ManagedSafeModule (Template)</h3>
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                {CONTRACT_VERSIONS.ManagedSafeModule}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <code className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                {truncateAddress(moduleAddress, 10)}
              </code>
              <a
                href={`${explorerUrl}/address/${moduleAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
              >
                <span>View on Explorer</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Chain ID: {chainId}</span>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center space-x-1"
          >
            <span>{explorerUrl.replace('https://', '').replace('http://', '')}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mt-6">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
        </div>

        <div className="space-y-3">
          {safeInfo ? (
            // With Safe Context - Functional link
            <a
              href={`https://app.safe.global/apps/open?safe=${getChainPrefix(Number(safeInfo.chainId))}:${safeInfo.safeAddress}&appUrl=${encodeURIComponent('https://zodiac.gnosisguild.org/')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 border border-purple-200 dark:border-purple-800 rounded-lg hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/70 transition-colors">
                  <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Enable Module on Zodiac</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Open Zodiac app to enable modules on your Safe</p>
                </div>
              </div>
              <ExternalLink className="h-5 w-5 text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform" />
            </a>
          ) : (
            // Without Safe Context - Informational card
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/30">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <Info className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 dark:text-gray-300">Enable Module on Zodiac</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Open this app inside a Safe to use Quick Actions</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {safeInfo
              ? 'Use Zodiac to enable the ManagedSafeModule on your Safe. This is required for owner synchronization.'
              : 'Quick Actions are available when running this app inside a Safe. Load this app as a Safe App to access module management features.'}
          </p>
        </div>
      </div>
    </div>
  );
}
