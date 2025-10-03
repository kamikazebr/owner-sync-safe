'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId } from 'wagmi';
import { Address } from 'viem';
import { Wallet, Shield, Settings, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useSafeApps } from '@/hooks/useSafeApps';
import { useModuleManager } from '@/hooks/useModuleManager';
import { useModuleForSafe } from '@/hooks/useModuleForSafe';
import { ModuleManager } from '@/components/ModuleManager';
import { OwnerSync } from '@/components/OwnerSync';
import { ModuleSettings } from '@/components/ModuleSettings';
import { ContractInfo } from '@/components/ContractInfo';
import { truncateAddress, isValidAddress } from '@/lib/utils';
import { Toaster } from 'react-hot-toast';


export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  return <HomeClient />;
}

function HomeClient() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { isSafeApp, safeInfo, isLoading: safeLoading, error: safeError } = useSafeApps();
  const moduleManager = useModuleManager();

  const [selectedSafe, setSelectedSafe] = useState<Address | undefined>(undefined);
  const [manualSafeInput, setManualSafeInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'sync' | 'settings'>('overview');

  const moduleInfo = useModuleForSafe(selectedSafe);

  // Auto-select Safe address when detected as Safe App
  useEffect(() => {
    if (isSafeApp && safeInfo?.safeAddress) {
      setSelectedSafe(safeInfo.safeAddress as Address);
    }
  }, [isSafeApp, safeInfo?.safeAddress]);

  const handleManualSafeSelect = () => {
    if (isValidAddress(manualSafeInput)) {
      setSelectedSafe(manualSafeInput as Address);
      setShowManualInput(false);
      setManualSafeInput('');
    }
  };

  const handleSafeAppSelect = () => {
    if (safeInfo?.safeAddress) {
      setSelectedSafe(safeInfo.safeAddress as Address);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Owner Sync Safe
              </h1>
            </div>
            <ConnectButton />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isConnected ? (
          /* Not Connected State */
          <div className="text-center py-12">
            <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 mb-6">
              Connect your wallet to start managing Safe modules and synchronizing owners.
            </p>
            <ConnectButton />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Contract Info */}
            <ContractInfo />

            {/* Connection Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Connection Status</h2>
                <div className="flex items-center space-x-2 text-green-600 bg-green-100 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span className="text-sm font-medium">Connected</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Wallet</label>
                  <p className="font-mono text-sm">{truncateAddress(address as Address, 8)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Chain</label>
                  <p className="font-medium">{chainId}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Type</label>
                  <p className="font-medium">{isSafeApp ? 'Safe App' : 'dApp'}</p>
                </div>
              </div>

              {isSafeApp && safeInfo && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2 flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Running as Safe App</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
                    <div>
                      <span className="font-medium">Safe:</span> {truncateAddress(safeInfo.safeAddress as Address, 8)}
                    </div>
                    <div>
                      <span className="font-medium">Threshold:</span> {safeInfo.threshold}/{safeInfo.owners?.length}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Safe Selection */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Safe</h2>

              <div className="space-y-4">
                {/* Safe App Auto-detect */}
                {isSafeApp && safeInfo && (
                  <button
                    onClick={handleSafeAppSelect}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                      selectedSafe === safeInfo.safeAddress
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Current Safe App</div>
                        <div className="text-sm text-gray-600 font-mono">
                          {truncateAddress(safeInfo.safeAddress as Address, 10)}
                        </div>
                      </div>
                      <Shield className="h-5 w-5 text-green-600" />
                    </div>
                  </button>
                )}

                {/* Manual Safe Input */}
                <div className="border rounded-lg">
                  <button
                    onClick={() => setShowManualInput(!showManualInput)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium">Enter Safe Address</div>
                      <div className="text-sm text-gray-600">
                        Manually enter a Safe address
                      </div>
                    </div>
                    {showManualInput ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </button>

                  {showManualInput && (
                    <div className="border-t p-4">
                      <div className="flex space-x-3">
                        <input
                          type="text"
                          placeholder="0x..."
                          value={manualSafeInput}
                          onChange={(e) => setManualSafeInput(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={handleManualSafeSelect}
                          disabled={!isValidAddress(manualSafeInput)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {selectedSafe && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-blue-800">
                      <Shield className="h-4 w-4" />
                      <span className="font-medium">Selected Safe:</span>
                      <span className="font-mono">{truncateAddress(selectedSafe, 10)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main Dashboard */}
            {selectedSafe && (
              <div className="space-y-6">
                {/* Navigation Tabs */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                      {[
                        { id: 'overview', label: 'Overview', icon: Shield },
                        { id: 'sync', label: 'Synchronization', icon: RefreshCw },
                        { id: 'settings', label: 'Settings', icon: Settings },
                      ].map(({ id, label, icon: Icon }) => (
                        <button
                          key={id}
                          onClick={() => setActiveTab(id as any)}
                          className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === id
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{label}</span>
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                  <ModuleManager
                    safeAddress={selectedSafe}
                    onModuleCreated={(moduleAddress) => {
                      // Optionally switch to sync tab after module creation
                      setActiveTab('sync');
                    }}
                  />
                )}

                {activeTab === 'sync' && (
                  <OwnerSync
                    moduleAddress={moduleInfo?.moduleAddress}
                    safeAddress={selectedSafe}
                  />
                )}

                {activeTab === 'settings' && (
                  <ModuleSettings
                    moduleAddress={moduleInfo?.moduleAddress}
                    safeAddress={selectedSafe}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}