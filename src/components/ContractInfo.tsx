'use client';

import { useChainId, useReadContract, usePublicClient } from 'wagmi';
import { ExternalLink, Code, Shield, Info, Settings, Copy, Check } from 'lucide-react';
import { getDeploymentAddresses, getBlockExplorerUrl } from '@/lib/deployments';
import { useContractVersion } from '@/hooks/useContractVersion';
import { buildSafeModulesUrl } from '@/lib/safe-batch';
import { SafeInfo } from '@safe-global/safe-apps-sdk';
import { Address, keccak256, toHex } from 'viem';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

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
  const publicClient = usePublicClient({ chainId });
  const [registryImplementation, setRegistryImplementation] = useState<Address | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const registryAddress = addresses.SyncGroupRegistry;

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

  // Read implementation from ERC1967 storage slot
  // Implementation slot = keccak256("eip1967.proxy.implementation") - 1
  useEffect(() => {
    const fetchImplementation = async () => {
      if (!registryAddress || !publicClient) return;

      try {
        // ERC1967 implementation storage slot
        const slot = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
        const data = await publicClient.getStorageAt({
          address: registryAddress as Address,
          slot: slot as `0x${string}`,
        });

        if (data && data !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
          // Extract address from bytes32 (last 20 bytes)
          const implAddress = ('0x' + data.slice(-40)) as Address;
          setRegistryImplementation(implAddress);
        }
      } catch (error) {
        console.error('Failed to read implementation:', error);
      }
    };

    fetchImplementation();
  }, [registryAddress, publicClient]);

  // Read implementation template addresses from Registry
  const { data: managerImplementation } = useReadContract({
    address: registryAddress as Address,
    abi: [
      {
        name: 'managerImplementation',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'address' }],
      },
    ] as const,
    functionName: 'managerImplementation',
    chainId,
    query: {
      enabled: !!registryAddress,
    },
  });

  const { data: moduleImplementation } = useReadContract({
    address: registryAddress as Address,
    abi: [
      {
        name: 'moduleImplementation',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'address' }],
      },
    ] as const,
    functionName: 'moduleImplementation',
    chainId,
    query: {
      enabled: !!registryAddress,
    },
  });

  // Read versions dynamically from deployed contracts
  const { version: registryVersion } = useContractVersion(registryImplementation ?? undefined, chainId);
  const { version: managerVersion } = useContractVersion(managerImplementation as Address | undefined, chainId);
  const { version: moduleVersion } = useContractVersion(moduleImplementation as Address | undefined, chainId);

  if (!registryAddress) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Code className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">System Contracts</h2>
      </div>

      <div className="space-y-4">
        {/* Registry Proxy */}
        <div className="border border-purple-200 dark:border-purple-700 rounded-lg p-4 bg-purple-50/30 dark:bg-purple-900/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900 dark:text-white">SyncGroupRegistry (Proxy)</h3>
            {registryVersion && (
              <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded">
                v{registryVersion}
              </span>
            )}
          </div>

          {/* Proxy Address */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Proxy Address</p>
            <div className="flex items-center justify-between gap-3">
              <code className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all flex-1">
                {registryAddress}
              </code>
              <a
                href={`${explorerUrl}/address/${registryAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm flex-shrink-0"
              >
                <span className="hidden sm:inline">View</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Implementation Address */}
          {registryImplementation && (
            <div className="pt-3 border-t border-purple-200 dark:border-purple-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Implementation</p>
              <div className="flex items-center justify-between gap-3">
                <code className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all flex-1">
                  {registryImplementation as string}
                </code>
                <a
                  href={`${explorerUrl}/address/${registryImplementation}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm flex-shrink-0"
                >
                  <span className="hidden sm:inline">View</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Implementation Templates from Registry */}
        {(managerImplementation || moduleImplementation) && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Implementation Templates
            </h3>
            <div className="space-y-3">
              {managerImplementation && (
                <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">SafeModuleManager</p>
                      {managerVersion && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">
                          v{managerVersion}
                        </span>
                      )}
                    </div>
                    <code className="text-xs text-gray-700 dark:text-gray-300 font-mono break-all">
                      {managerImplementation as string}
                    </code>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleCopy(managerImplementation as string, 'manager-impl')}
                      className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="Copy address"
                    >
                      {copiedField === 'manager-impl' ? (
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <a
                      href={`${explorerUrl}/address/${managerImplementation}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                      title="View on explorer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              )}
              {moduleImplementation && (
                <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">ManagedSafeModule</p>
                      {moduleVersion && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">
                          v{moduleVersion}
                        </span>
                      )}
                    </div>
                    <code className="text-xs text-gray-700 dark:text-gray-300 font-mono break-all">
                      {moduleImplementation as string}
                    </code>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleCopy(moduleImplementation as string, 'module-impl')}
                      className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="Copy address"
                    >
                      {copiedField === 'module-impl' ? (
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <a
                      href={`${explorerUrl}/address/${moduleImplementation}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                      title="View on explorer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              )}
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
            <>
              {/* Enable Module on Zodiac */}
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

              {/* Manage Modules */}
              <a
                href={buildSafeModulesUrl(Number(safeInfo.chainId), safeInfo.safeAddress as Address)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 border border-blue-200 dark:border-blue-800 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/70 transition-colors">
                    <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Manage Modules</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Go to Safe modules settings to enable/disable modules</p>
                  </div>
                </div>
                <ExternalLink className="h-5 w-5 text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform" />
              </a>
            </>
          ) : (
            // Without Safe Context - Informational card
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/30">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <Info className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 dark:text-gray-300">Quick Actions</h3>
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
