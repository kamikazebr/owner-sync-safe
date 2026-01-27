'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { useAccount } from 'wagmi';
import { isAddress } from 'viem';

const CHAIN_PREFIXES: Record<number, string> = {
  1: 'eth',
  100: 'gno',
  8453: 'base',
  11155111: 'sep',
  84532: 'basesep',
};

export function SafeAppRedirectBanner() {
  const [safeAddress, setSafeAddress] = useState('');
  const [detectedChain, setDetectedChain] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { chainId } = useAccount();

  // Extract address and chain from various formats
  const extractAddressAndChain = (input: string): { address: string; chain: string | null } | null => {
    input = input.trim();

    // Case 1: Safe App URL format (https://app.safe.global/apps/open?safe=gno:0x...)
    try {
      const url = new URL(input);
      const safeParam = url.searchParams.get('safe');
      if (safeParam) {
        if (safeParam.includes(':')) {
          const [chain, address] = safeParam.split(':');
          if (isAddress(address)) {
            return { address, chain };
          }
        } else if (isAddress(safeParam)) {
          return { address: safeParam, chain: null };
        }
      }
    } catch {
      // Not a valid URL, continue
    }

    // Case 2: Chain-prefixed format (gno:0x... or eth:0x...)
    if (input.includes(':')) {
      const [chain, address] = input.split(':');
      if (isAddress(address)) {
        return { address, chain };
      }
    }

    // Case 3: Direct Ethereum address (0x...)
    if (isAddress(input)) {
      return { address: input, chain: null };
    }

    return null;
  };

  // Check for safe address in URL query params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const safeParam = params.get('safe');
    if (safeParam) {
      const parsed = extractAddressAndChain(safeParam);
      if (parsed) {
        setSafeAddress(parsed.address);
        setDetectedChain(parsed.chain);
      }
    }
  }, []);

  const getAppUrl = () => {
    // Get current URL without query params
    const baseUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    return encodeURIComponent(baseUrl);
  };

  const generateSafeAppLink = () => {
    if (!safeAddress || !isAddress(safeAddress)) return null;

    // Use detected chain from input, fallback to connected wallet chain, fallback to gnosis
    const chain = detectedChain || CHAIN_PREFIXES[chainId || 100] || 'gno';
    const appUrl = getAppUrl();
    return `https://app.safe.global/apps/open?safe=${chain}:${safeAddress}&appUrl=${appUrl}`;
  };

  // Get display name for chain
  const getChainDisplay = () => {
    const chain = detectedChain || CHAIN_PREFIXES[chainId || 100] || 'gno';
    return chain.toUpperCase();
  };

  const handleCopyLink = async () => {
    const link = generateSafeAppLink();
    if (!link) return;

    try {
      // Try modern Clipboard API first (requires clipboard-write permission)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
    } catch (error) {
      // Modern API failed, fall through to legacy method
      console.log('Clipboard API failed, using fallback:', error);
    }

    try {
      // Fallback using document.execCommand (works in sandboxed iframes)
      const textArea = document.createElement('textarea');
      textArea.value = link;
      // Position off-screen but keep it visible (display:none or visibility:hidden breaks copy)
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);

      // Select the text
      textArea.select();
      textArea.setSelectionRange(0, link.length);

      // Execute copy command
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleOpenInSafe = () => {
    const link = generateSafeAppLink();
    if (link) {
      window.open(link, '_blank');
    }
  };

  const safeLink = generateSafeAppLink();
  const isValidAddress = safeAddress && isAddress(safeAddress);

  // Return inline elements for navbar integration
  return (
    <div className="flex items-center gap-2">
      {/* Icon */}
      <div className="flex-shrink-0">
        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
          <ExternalLink className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        </div>
      </div>

      {/* Input - compact */}
      <input
        type="text"
        placeholder="Paste Safe address or URL..."
        value={safeAddress}
        onChange={(e) => setSafeAddress(e.target.value)}
        onPaste={(e) => {
          const pastedText = e.clipboardData.getData('text');
          const parsed = extractAddressAndChain(pastedText);
          if (parsed) {
            e.preventDefault();
            setSafeAddress(parsed.address);
            setDetectedChain(parsed.chain);
          }
        }}
        onBlur={(e) => {
          const extracted = extractAddressAndChain(e.target.value);
          if (extracted) {
            setSafeAddress(extracted.address);
            setDetectedChain(extracted.chain);
          }
        }}
        className="w-48 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
      />

      {/* Chain badge - show which network will be used */}
      {isValidAddress && (
        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-mono font-semibold">
          {getChainDisplay()}
        </span>
      )}

      {/* Open button */}
      <button
        onClick={handleOpenInSafe}
        disabled={!isValidAddress}
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
      >
        <ExternalLink className="h-4 w-4" />
        Open in Safe
      </button>

      {/* Copy button */}
      {safeLink && (
        <button
          onClick={handleCopyLink}
          className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Copy link"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      )}

      {/* Error tooltip */}
      {safeAddress && !isValidAddress && (
        <span className="text-xs text-red-600 dark:text-red-400">
          ✗
        </span>
      )}
    </div>
  );
}
