'use client';

import { CheckCircle2, ExternalLink } from 'lucide-react';
import { gnosis, base } from 'wagmi/chains';
import { getDeploymentAddresses, getBlockExplorerUrl } from '@/lib/deployments';

interface NetworkInfo {
  name: string;
  chainId: number;
  icon: string;
  color: string;
}

const NETWORKS: NetworkInfo[] = [
  {
    name: 'Gnosis Chain',
    chainId: gnosis.id,
    icon: '🟢',
    color: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    name: 'Base',
    chainId: base.id,
    icon: '🔵',
    color: 'bg-blue-500/10 border-blue-500/20',
  },
];

export function SupportedNetworks() {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-green-500" />
        Supported Networks
      </h2>

      <div className="space-y-3">
        {NETWORKS.map((network) => {
          const deployments = getDeploymentAddresses(network.chainId);
          const isDeployed = !!deployments.SyncGroupRegistry;
          const explorerUrl = getBlockExplorerUrl(network.chainId);

          return (
            <div
              key={network.chainId}
              className={`rounded-lg border p-4 ${network.color}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{network.icon}</span>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {network.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Chain ID: {network.chainId}
                    </p>
                    {isDeployed && (
                      <div className="mt-2 space-y-1">
                        <a
                          href={`${explorerUrl}/address/${deployments.SyncGroupRegistry}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          Registry: {deployments.SyncGroupRegistry?.slice(0, 10)}...
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  {isDeployed ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle2 className="w-3 h-3" />
                      Deployed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                      Coming Soon
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Switch networks using your wallet's network selector to use Owner Sync Safe on different chains.
        </p>
      </div>
    </div>
  );
}
