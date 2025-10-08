'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, ExternalLink, X, Copy, Check } from 'lucide-react';
import { useAccount } from 'wagmi';
import { isAddress } from 'viem';
import { extractSafeAddress } from '@/lib/utils';

const CHAIN_PREFIXES: Record<number, string> = {
  1: 'eth',
  100: 'gno',
  8453: 'base',
  11155111: 'sep',
  84532: 'basesep',
};

const DISMISS_KEY = 'safeAppRedirectBannerDismissed';

export function SafeAppRedirectBanner() {
  const [safeAddress, setSafeAddress] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  const { chainId } = useAccount();

  // Parse Safe address from various formats
  const parseSafeAddress = (input: string): string | null => {
    // Remove whitespace
    input = input.trim();

    // Case 1: Direct Ethereum address (0x...)
    if (isAddress(input)) {
      return input;
    }

    // Case 2: Safe App URL format (https://app.safe.global/apps/open?safe=gno:0x...)
    try {
      const url = new URL(input);
      const safeParam = url.searchParams.get('safe');
      if (safeParam) {
        // Remove chain prefix (e.g., "gno:0x..." -> "0x...")
        const address = safeParam.includes(':') ? safeParam.split(':')[1] : safeParam;
        if (isAddress(address)) {
          return address;
        }
      }
    } catch {
      // Not a valid URL, continue
    }

    // Case 3: Chain-prefixed format (gno:0x... or eth:0x...)
    if (input.includes(':')) {
      const address = input.split(':')[1];
      if (isAddress(address)) {
        return address;
      }
    }

    return null;
  };

  // Check localStorage on mount
  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    // Check for safe address in URL query params
    const params = new URLSearchParams(window.location.search);
    const safeParam = params.get('safe');
    if (safeParam) {
      const parsed = parseSafeAddress(safeParam);
      if (parsed) {
        setSafeAddress(parsed);
      }
    }
  }, []);

  const handleDismiss = (permanent = false) => {
    if (permanent) {
      localStorage.setItem(DISMISS_KEY, 'true');
    }
    setIsDismissed(true);
  };

  const getAppUrl = () => {
    // Get current URL without query params
    const baseUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    return encodeURIComponent(baseUrl);
  };

  const generateSafeAppLink = () => {
    if (!safeAddress || !isAddress(safeAddress)) return null;

    const chain = CHAIN_PREFIXES[chainId || 100] || 'gno';
    const appUrl = getAppUrl();
    return `https://app.safe.global/apps/open?safe=${chain}:${safeAddress}&appUrl=${appUrl}`;
  };

  const handleCopyLink = () => {
    const link = generateSafeAppLink();
    if (link) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenInSafe = () => {
    const link = generateSafeAppLink();
    if (link) {
      window.open(link, '_blank');
    }
  };

  if (isDismissed) return null;

  const safeLink = generateSafeAppLink();
  const isValidAddress = safeAddress && isAddress(safeAddress);

  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-b-2 border-amber-300 dark:border-amber-700 sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-4 items-start">
          {/* Icon */}
          <div className="flex-shrink-0 mt-1">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-amber-900 dark:text-amber-100 mb-1">
              ⚠️ Open in Safe App for Best Experience
            </h3>
            <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
              This application is designed to run inside the Safe App. Enter your Safe address below to generate a direct link.
            </p>

            {/* Input and buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Enter Safe address or paste Safe App URL"
                  value={safeAddress}
                  onChange={(e) => {
                    const input = e.target.value;
                    // Try to extract address from input (URL, chain:address, or direct address)
                    const extracted = extractSafeAddress(input);
                    // If we extracted an address, use it; otherwise keep the raw input for user to see/edit
                    setSafeAddress(extracted || input);
                  }}
                  onPaste={(e) => {
                    // On paste, try to parse the pasted content
                    const pastedText = e.clipboardData.getData('text');
                    const parsed = extractSafeAddress(pastedText);
                    if (parsed) {
                      e.preventDefault();
                      setSafeAddress(parsed);
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-amber-300 dark:border-amber-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {safeAddress && !isValidAddress && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Invalid Ethereum address
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleOpenInSafe}
                  disabled={!isValidAddress}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in Safe
                </button>

                {safeLink && (
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-900/70 text-amber-900 dark:text-amber-100 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                    title="Copy link"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy Link
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Network info */}
            {chainId && (
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                Network: {CHAIN_PREFIXES[chainId] ? CHAIN_PREFIXES[chainId].toUpperCase() : 'Unknown'} (Chain ID: {chainId})
              </p>
            )}
          </div>

          {/* Close buttons */}
          <div className="flex-shrink-0 flex flex-col gap-2">
            <button
              onClick={() => handleDismiss(false)}
              className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg transition-colors"
              title="Hide for now"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleDismiss(true)}
              className="px-2 py-1 text-xs text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 underline"
              title="Don't show again"
            >
              Don't show again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
