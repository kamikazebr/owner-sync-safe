'use client';

import { Shield, Home, Users, Plus, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  groups?: Array<{ id: number; name: string }>;
}

export function Sidebar({ activeView, onViewChange, groups = [] }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'groups', label: 'My Groups', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 lg:bg-white lg:border-r lg:border-gray-200">
      {/* Logo */}
      <div className="flex items-center space-x-3 px-6 py-6 border-b border-gray-200">
        <Shield className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-lg font-bold text-gray-900">Owner Sync</h1>
          <p className="text-xs text-gray-500">Safe Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                'w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Groups Submenu */}
        {activeView === 'groups' && groups.length > 0 && (
          <div className="ml-8 mt-2 space-y-1">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => onViewChange(`group-${group.id}`)}
                className={cn(
                  'w-full flex items-center px-4 py-2 rounded-lg text-sm transition-colors',
                  activeView === `group-${group.id}`
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                • {group.name}
              </button>
            ))}
          </div>
        )}

        {/* Create New Group Button */}
        <button
          onClick={() => onViewChange('create-group')}
          className="w-full flex items-center space-x-3 px-4 py-3 mt-4 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>New Sync Group</span>
        </button>
      </nav>

      {/* Footer Info */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <p className="font-medium">Gnosis Chain</p>
          <p className="mt-1">Connected</p>
        </div>
      </div>
    </div>
  );
}
