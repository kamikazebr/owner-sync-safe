'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Toaster } from 'react-hot-toast';
import { useSafeApps } from '@/hooks/useSafeApps';
import { usePendingSetup } from '@/hooks/usePendingSetup';
import { useActiveGroups } from '@/hooks/useActiveGroups';
import { AppLayout } from '@/components/AppLayout';
import { GroupList } from '@/components/GroupList';
import { GroupDashboard } from '@/components/GroupDashboard';
import { CreateGroupModal } from '@/components/CreateGroupModal';
import { ContractInfo } from '@/components/ContractInfo';
import { SetupBanner } from '@/components/SetupBanner';
import { ActiveGroupsBanner } from '@/components/ActiveGroupsBanner';
import { CompactActiveGroupBanner } from '@/components/CompactActiveGroupBanner';
import { Home, Users, Shield } from 'lucide-react';
import { SafeAppRedirectBanner } from '@/components/SafeAppRedirectBanner';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  return <HomeClient />;
}

function HomeClient() {
  const { isConnected, chainId } = useAccount();
  const { isSafeApp, safeInfo, isLoading: safeLoading } = useSafeApps();
  const { hasPendingSetup, pendingSetups } = usePendingSetup(chainId);
  const { hasActiveGroups, activeGroups } = useActiveGroups(chainId);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedGroupId, setSelectedGroupId] = useState<bigint | undefined>(undefined);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Debug logging
  console.log('[HomePage] Pending setup state:', {
    hasPendingSetup,
    pendingSetupsCount: pendingSetups.length,
    pendingSetups,
    hasActiveGroups,
    activeGroupsCount: activeGroups.length,
    isSafeApp,
    safeAddress: safeInfo?.safeAddress,
  });

  const handleViewChange = (view: string) => {
    setActiveView(view);

    // Reset selected group when changing views
    if (view !== 'groups' && !view.startsWith('group-')) {
      setSelectedGroupId(undefined);
    }

    // Handle create-group view
    if (view === 'create-group') {
      setShowCreateModal(true);
    }
  };

  const handleGroupSelect = (groupId: bigint) => {
    if (groupId === -1n) {
      // Special case: show create modal
      setShowCreateModal(true);
    } else {
      setSelectedGroupId(groupId);
      setActiveView(`group-${groupId.toString()}`);
    }
  };

  const handleCreateSuccess = (groupId: bigint) => {
    setShowCreateModal(false);
    setSelectedGroupId(groupId);
    setActiveView(`group-${groupId.toString()}`);
  };

  return (
    <>
      <Toaster position="top-right" />

      {/* Show redirect banner when NOT in Safe App */}
      {!isSafeApp && !safeLoading && (
        <SafeAppRedirectBanner />
      )}

      <AppLayout
        activeView={activeView}
        onViewChange={handleViewChange}
      >
        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome to Owner Sync Safe - Manage your Safe owner synchronization groups
              </p>
            </div>

            {/* Active Groups Banner - Compact version if has pending invites */}
            {hasActiveGroups && hasPendingSetup && (
              <CompactActiveGroupBanner activeGroups={activeGroups} />
            )}

            {/* Active Groups Banner - Full version if no pending invites */}
            {hasActiveGroups && !hasPendingSetup && (
              <ActiveGroupsBanner activeGroups={activeGroups} />
            )}

            {/* Pending Setup Banner - Always show if has pending invitations */}
            {hasPendingSetup && (
              <SetupBanner
                pendingSetups={pendingSetups}
                hasActiveGroups={hasActiveGroups}
                activeGroups={activeGroups}
                onComplete={() => {
                  // Refresh the page or update state after completion
                  window.location.reload();
                }}
                onDeclineAll={() => {
                  // TODO: Implement decline all functionality
                  console.log('Decline all invites');
                }}
              />
            )}

            {/* Safe App Status Banner - Only show if no pending setup and no active groups */}
            {!hasPendingSetup && !hasActiveGroups && isSafeApp && safeInfo && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-green-900 dark:text-green-100">Running as Safe App</h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Connected to Safe: <span className="font-mono">{safeInfo.safeAddress}</span>
                    </p>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Threshold: {safeInfo.threshold} of {safeInfo.owners?.length} owners
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isConnected ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Quick Actions */}
                <button
                  onClick={() => setActiveView('groups')}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow text-left"
                >
                  <Users className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">My Groups</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    View and manage your sync groups
                  </p>
                </button>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 hover:shadow-md transition-shadow text-left"
                >
                  <Home className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">New Group</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Create a new sync group
                  </p>
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
                <Users className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Connect Your Wallet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Connect your wallet to start managing sync groups
                </p>
              </div>
            )}
          </div>
        )}

        {/* Groups List View */}
        {activeView === 'groups' && (
          <GroupList
            onGroupSelect={handleGroupSelect}
            selectedGroupId={selectedGroupId}
          />
        )}

        {/* Individual Group View */}
        {activeView.startsWith('group-') && selectedGroupId !== undefined && (
          <GroupDashboard groupId={selectedGroupId} />
        )}

        {/* Settings View */}
        {activeView === 'settings' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Configure your preferences and view system information
              </p>
            </div>

            {/* System Contracts */}
            <ContractInfo safeInfo={safeInfo} />

            {/* Future Settings */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">Additional settings coming soon...</p>
            </div>
          </div>
        )}
      </AppLayout>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}
