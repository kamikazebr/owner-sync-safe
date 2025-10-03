'use client';

import { useChainId } from 'wagmi';
import { ExternalLink, Code } from 'lucide-react';
import { getDeploymentAddresses, getBlockExplorerUrl, CONTRACT_VERSIONS } from '@/lib/deployments';
import { truncateAddress } from '@/lib/utils';

export function ContractInfo() {
  const chainId = useChainId();
  const addresses = getDeploymentAddresses(chainId);
  const explorerUrl = getBlockExplorerUrl(chainId);

  const managerAddress = addresses.SafeModuleManager || addresses.OwnerModuleFactory;
  const moduleAddress = addresses.ManagedSafeModule || addresses.ControlOwnerModule;

  if (!managerAddress && !moduleAddress) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Code className="h-6 w-6 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">System Contracts</h2>
      </div>

      <div className="space-y-4">
        {managerAddress && (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">SafeModuleManager (Proxy)</h3>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {CONTRACT_VERSIONS.SafeModuleManager}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <code className="text-sm text-gray-600 font-mono">
                {truncateAddress(managerAddress, 10)}
              </code>
              <a
                href={`${explorerUrl}/address/${managerAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
              >
                <span>View on Explorer</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        )}

        {moduleAddress && (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">ManagedSafeModule (Template)</h3>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                {CONTRACT_VERSIONS.ManagedSafeModule}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <code className="text-sm text-gray-600 font-mono">
                {truncateAddress(moduleAddress, 10)}
              </code>
              <a
                href={`${explorerUrl}/address/${moduleAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
              >
                <span>View on Explorer</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Chain ID: {chainId}</span>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span>{explorerUrl.replace('https://', '').replace('http://', '')}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
