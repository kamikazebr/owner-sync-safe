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
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 seconds between retries

    const initSafeApps = async () => {
      if (typeof window === 'undefined') {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        // Check if we're in an iframe
        const isInIframe = window !== window.parent;

        console.log('🔍 Safe App Detection:', {
          isInIframe,
          origin: window.location.origin,
          ancestorOrigins: window.location.ancestorOrigins?.length || 0,
        });

        if (!isInIframe) {
          console.log('ℹ️ Not running in iframe, skipping Safe App initialization');
          if (mounted) {
            setIsSafeApp(false);
            setSafeInfo(null);
            setSdk(null);
            setIsLoading(false);
          }
          return;
        }

        // Initialize Safe Apps SDK
        console.log('🚀 Initializing Safe Apps SDK...');
        const safeAppsSDK = new SafeAppsSDK({
          allowedDomains: [/^https:\/\/app\.safe\.global$/, /^https:\/\/.*\.safe\.global$/],
          debug: true, // Always enable debug for better logs
        });

        if (mounted) setSdk(safeAppsSDK);

        // Try to get Safe info with longer timeout and retry logic
        const attemptGetSafeInfo = async (): Promise<any> => {
          while (retryCount <= MAX_RETRIES && mounted) {
            try {
              console.log(`📡 Attempt ${retryCount + 1}/${MAX_RETRIES + 1} to get Safe info...`);

              const safe = await Promise.race([
                safeAppsSDK.safe.getInfo(),
                new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error('Safe API timeout')), 10000) // Increased to 10s
                ),
              ]);

              console.log('✅ Safe App detected successfully:', {
                safeAddress: safe.safeAddress,
                chainId: safe.chainId,
                threshold: safe.threshold,
                owners: safe.owners?.length || 0,
              });

              return safe;
            } catch (err) {
              retryCount++;
              const errorMsg = err instanceof Error ? err.message : 'Unknown error';
              console.warn(`⚠️ Attempt ${retryCount} failed:`, errorMsg);

              if (retryCount <= MAX_RETRIES && mounted) {
                console.log(`⏳ Retrying in ${RETRY_DELAY}ms...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
              } else {
                throw err;
              }
            }
          }
          throw new Error('Max retries exceeded');
        };

        const safe = await attemptGetSafeInfo();

        if (mounted) {
          setIsSafeApp(true);
          setSafeInfo(safe);
        }

      } catch (error) {
        if (mounted) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('❌ Safe App initialization failed:', {
            error: errorMessage,
            retries: retryCount,
            isInIframe: window !== window.parent,
          });

          setIsSafeApp(false);
          setSafeInfo(null);
          setSdk(null);

          // Set error for non-timeout issues or after all retries
          if (!errorMessage.includes('timeout') || retryCount > MAX_RETRIES) {
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