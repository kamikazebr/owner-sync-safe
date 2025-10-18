'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { gnosis } from 'wagmi/chains';
import { http } from 'viem';

import '@rainbow-me/rainbowkit/styles.css';

// Custom Gnosis chain with Alchemy RPC and fallback
const customGnosis = {
  ...gnosis,
  rpcUrls: {
    default: {
      http: [
        // Primary: Alchemy RPC (if configured)
        ...(process.env.NEXT_PUBLIC_ALCHEMY_GNOSIS_URL
          ? [process.env.NEXT_PUBLIC_ALCHEMY_GNOSIS_URL]
          : []),
        // Fallback: Public Gnosis RPC
        'https://rpc.gnosischain.com',
        // Additional fallback: Ankr public RPC
        'https://rpc.ankr.com/gnosis',
      ],
    },
    public: {
      http: ['https://rpc.gnosischain.com'],
    },
  },
};

const config = getDefaultConfig({
  appName: 'Owner Sync Safe',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'placeholder-project-id',
  chains: [customGnosis] as const,
  ssr: false,
  transports: {
    [gnosis.id]: http(),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}