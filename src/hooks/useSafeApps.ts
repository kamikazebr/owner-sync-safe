'use client';

import { useState, useEffect } from 'react';
import SafeAppsSDK, { SafeInfo } from '@safe-global/safe-apps-sdk';

interface UseSafeAppsReturn {
  isSafeApp: boolean;
  safeInfo: SafeInfo | null;
  sdk: SafeAppsSDK | null;
  isLoading: boolean;
  error: string | null;
}

export function useSafeApps(): UseSafeAppsReturn {
  const [isSafeApp, setIsSafeApp] = useState(false);
  const [safeInfo, setSafeInfo] = useState<SafeInfo | null>(null);
  const [sdk, setSdk] = useState<SafeAppsSDK | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initSafeApps = async () => {
      if (typeof window === 'undefined') {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        // Check if we're in an iframe
        const isInIframe = window !== window.parent;

        if (!isInIframe) {
          if (mounted) {
            setIsSafeApp(false);
            setSafeInfo(null);
            setSdk(null);
            setIsLoading(false);
          }
          return;
        }

        // Initialize Safe Apps SDK
        const safeAppsSDK = new SafeAppsSDK({
          allowedDomains: [/^https:\/\/app\.safe\.global$/, /^https:\/\/.*\.safe\.global$/],
          debug: process.env.NODE_ENV === 'development',
        });

        if (mounted) setSdk(safeAppsSDK);

        // Try to get Safe info with timeout
        const safe = await Promise.race([
          safeAppsSDK.safe.getInfo(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Safe API timeout')), 3000)
          ),
        ]);

        if (mounted) {
          console.log('Safe App detected:', safe);
          setIsSafeApp(true);
          setSafeInfo(safe);
        }

      } catch (error) {
        if (mounted) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.log('Not running as Safe App:', errorMessage);
          setIsSafeApp(false);
          setSafeInfo(null);
          setSdk(null);

          // Only set error for non-timeout issues
          if (!errorMessage.includes('timeout')) {
            setError(errorMessage);
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initSafeApps();

    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array - only run once

  return { isSafeApp, safeInfo, sdk, isLoading, error };
}