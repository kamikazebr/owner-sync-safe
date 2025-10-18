import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import dynamic from 'next/dynamic';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// Load providers only on client to avoid SSR issues with WalletConnect/IndexedDB
const Providers = dynamic(() => import('./providers').then((mod) => ({ default: mod.Providers })), {
  ssr: false,
});

export const metadata: Metadata = {
  title: 'Owner Sync Safe',
  description: 'Safe module management with cross-module operations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}