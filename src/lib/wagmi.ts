import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia, gnosis } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Owner Sync Safe',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'placeholder-project-id',
  chains: [mainnet, sepolia, gnosis] as const,
  ssr: true,
});