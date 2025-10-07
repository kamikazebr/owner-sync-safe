'use client';

import { useAccount } from 'wagmi';
import { useOwnerGroups, useGroupDetails } from '@/hooks/useSyncGroupRegistry';
import { Users, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GroupListProps {
  onGroupSelect: (groupId: bigint) => void;
  selectedGroupId?: bigint;
}

export function GroupList({ onGroupSelect, selectedGroupId }: GroupListProps) {
  const { address, chainId } = useAccount();
  const { groupIds, refetchGroupIds } = useOwnerGroups(address, chainId || 100);

  if (!address) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
        <p className="text-sm text-gray-500">
          Connect your wallet to view and manage your sync groups
        </p>
      </div>
    );
  }

  if (!groupIds || groupIds.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Sync Groups</h3>
        <p className="text-sm text-gray-500 mb-4">
          You haven't created any sync groups yet
        </p>
        <button
          onClick={() => onGroupSelect(-1n)} // Signal to show create modal
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Create Your First Group
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Sync Groups</h2>
        <button
          onClick={() => refetchGroupIds()}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groupIds.map((groupId) => (
          <GroupCard
            key={groupId.toString()}
            groupId={groupId}
            chainId={chainId || 100}
            isSelected={selectedGroupId === groupId}
            onSelect={() => onGroupSelect(groupId)}
          />
        ))}
      </div>
    </div>
  );
}

interface GroupCardProps {
  groupId: bigint;
  chainId: number;
  isSelected: boolean;
  onSelect: () => void;
}

function GroupCard({ groupId, chainId, isSelected, onSelect }: GroupCardProps) {
  const { group } = useGroupDetails(groupId, chainId);

  if (!group) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  const createdDate = new Date(Number(group.createdAt) * 1000);

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full bg-white border rounded-lg p-6 text-left transition-all hover:shadow-md',
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{group.name}</h3>
          <div className="flex items-center space-x-2">
            {group.active ? (
              <span className="inline-flex items-center text-xs text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center text-xs text-gray-500">
                <XCircle className="h-3 w-3 mr-1" />
                Inactive
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          <span>Created {createdDate.toLocaleDateString()}</span>
        </div>
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-2" />
          <span className="text-xs font-mono truncate">{group.manager.slice(0, 10)}...</span>
        </div>
      </div>
    </button>
  );
}
