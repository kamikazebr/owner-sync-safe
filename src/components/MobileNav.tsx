'use client';

import { Home, Users, Plus, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function MobileNav({ activeView, onViewChange }: MobileNavProps) {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'create-group', label: 'New', icon: Plus },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <nav className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id ||
                          (item.id === 'groups' && activeView.startsWith('group-'));

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors',
                isActive ? 'text-blue-600' : 'text-gray-600'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'fill-current')} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
