'use client';

import { ReactNode } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Shield, Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { SafeAppRedirectBanner } from './SafeAppRedirectBanner';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
  groups?: Array<{ id: number; name: string }>;
  showSafeRedirect?: boolean;
}

export function AppLayout({ children, activeView, onViewChange, groups, showSafeRedirect = false }: AppLayoutProps) {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <Sidebar activeView={activeView} onViewChange={onViewChange} groups={groups} />

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-40">
        <div className="flex items-center justify-between px-4 py-3 gap-2">
          <button
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex-shrink-0"
          >
            {showMobileSidebar ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          {/* Logo - hidden when Safe redirect is shown on small screens */}
          <div className={cn(
            "flex items-center space-x-2",
            showSafeRedirect && "hidden sm:flex"
          )}>
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span className="font-bold text-gray-900 dark:text-white">Owner Sync</span>
          </div>

          {/* Safe App Redirect - show on mobile */}
          {showSafeRedirect && (
            <div className="flex-1 min-w-0 scale-90 origin-left">
              <SafeAppRedirectBanner />
            </div>
          )}

          <div className="scale-75 origin-right flex-shrink-0">
            <ConnectButton
              chainStatus="icon"
              showBalance={false}
              accountStatus="avatar"
            />
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setShowMobileSidebar(false)}
          />
          <div className="lg:hidden fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 z-40 transform transition-transform">
            <div className="h-full overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">Owner Sync</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Safe Management</p>
                  </div>
                </div>
              </div>
              {/* Render sidebar content for mobile */}
              <nav className="px-4 py-6 space-y-1">
                {[
                  { id: 'dashboard', label: 'Dashboard' },
                  { id: 'groups', label: 'My Groups' },
                  { id: 'settings', label: 'Settings' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onViewChange(item.id);
                      setShowMobileSidebar(false);
                    }}
                    className={cn(
                      'w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium',
                      activeView === item.id
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Desktop Header */}
        <div className="hidden lg:block sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-8 py-6 flex justify-between items-center">
            {/* Safe App Redirect (left side) */}
            {showSafeRedirect && (
              <div className="flex-shrink-0">
                <SafeAppRedirectBanner />
              </div>
            )}

            {/* Spacer when no redirect */}
            {!showSafeRedirect && <div />}

            {/* Connect Button (right side) */}
            <ConnectButton />
          </div>
        </div>

        {/* Content Area */}
        <main className="pt-16 lg:pt-0 pb-20 lg:pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav activeView={activeView} onViewChange={onViewChange} />
    </div>
  );
}
