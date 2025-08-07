'use client';

import { WalletProvider as Web3WalletProvider } from './walletcontext/WalletContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Web3WalletProvider>
      {children}
    </Web3WalletProvider>
  );
}
