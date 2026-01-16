import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { gnosis, base } from 'wagmi/chains';
import { http } from 'viem';

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

// Custom Base chain with Alchemy RPC and fallback
const customBase = {
  ...base,
  rpcUrls: {
    default: {
      http: [
        // Primary: Alchemy RPC (if configured)
        ...(process.env.NEXT_PUBLIC_ALCHEMY_BASE_URL
          ? [process.env.NEXT_PUBLIC_ALCHEMY_BASE_URL]
          : []),
        // Fallback: Public Base RPC
        'https://mainnet.base.org',
      ],
    },
    public: {
      http: ['https://mainnet.base.org'],
    },
  },
};

export const config = getDefaultConfig({
  appName: 'Owner Sync Safe',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'placeholder-project-id',
  chains: [customGnosis, customBase] as const,
  ssr: false, // Disable SSR to prevent IndexedDB errors
  transports: {
    [gnosis.id]: http(),
    [base.id]: http(),
  },
});