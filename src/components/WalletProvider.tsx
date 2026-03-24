'use client';

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SOLANA_RPC_URL } from '@/lib/constants';
import '@solana/wallet-adapter-react-ui/styles.css';

export default function WalletContextProvider({ children }: { children: React.ReactNode }) {
  const endpoint = SOLANA_RPC_URL;
  // Empty array — Wallet Standard auto-detects all installed wallets
  // (Phantom, Solflare, Backpack, Coinbase, Brave, etc.)
  const wallets = useMemo(() => [], []);
  return (
    // @ts-ignore - React 18 type mismatch with wallet adapter
    <ConnectionProvider endpoint={endpoint}>
      {/* @ts-ignore */}
      <WalletProvider wallets={wallets} autoConnect={false}>
        {/* @ts-ignore */}
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
