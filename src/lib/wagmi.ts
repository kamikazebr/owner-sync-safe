import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { gnosis } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Owner Sync Safe',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'placeholder-project-id',
  chains: [gnosis] as const,
  ssr: true,
});