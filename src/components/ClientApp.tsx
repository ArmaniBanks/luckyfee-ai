'use client';

import React from 'react';
import WalletContextProvider from '@/components/WalletProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ClientApp({ children }: { children: React.ReactNode }) {
  return (
    <WalletContextProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
        <Footer />
      </div>
    </WalletContextProvider>
  );
}
