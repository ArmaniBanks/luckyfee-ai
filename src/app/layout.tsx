import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import './globals.css';

const ClientApp = dynamic(() => import('@/components/ClientApp'), { ssr: false });

export const metadata: Metadata = {
  title: 'LuckyFee AI — Bags Fee Sharing Pool',
  description: 'Decentralized fee-sharing reward pool on Solana, powered by Bags',
  icons: { icon: '/logo.jpeg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-bags-dark text-white">
        <ClientApp>{children}</ClientApp>
      </body>
    </html>
  );
}
