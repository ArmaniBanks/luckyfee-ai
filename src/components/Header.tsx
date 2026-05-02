'use client';

import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, BarChart3, Trophy, Coins, Medal } from 'lucide-react';

const NAV = [
  { path: '/', label: 'Pool', icon: Zap },
  { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { path: '/draw', label: 'Draw', icon: Trophy },
  { path: '/leaderboard', label: 'Leaderboard', icon: Medal },
  { path: '/bags', label: 'Bags Feed', icon: Coins },
];

export default function Header() {
  const pathname = usePathname();
  const { connected } = useWallet();
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-bags-dark/80 border-b border-bags-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logo.jpeg" alt="LuckyFee AI" className="w-9 h-9 rounded-xl object-cover" />
            <div className="hidden sm:block"><span className="font-bold text-lg">LuckyFee</span><span className="text-bags-primary font-bold ml-1">AI</span></div>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ path, label, icon: Icon }) => (
              <Link key={path} href={path} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${pathname === path ? 'bg-bags-primary/10 text-bags-primary' : 'text-bags-muted hover:text-white hover:bg-white/5'}`}>
                <Icon size={16} />{label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {connected && <div className="badge-green"><span className="w-1.5 h-1.5 rounded-full bg-bags-primary animate-pulse" />Connected</div>}
            <WalletMultiButton />
          </div>
        </div>
        <nav className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
          {NAV.map(({ path, label, icon: Icon }) => (
            <Link key={path} href={path} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${pathname === path ? 'bg-bags-primary/10 text-bags-primary' : 'text-bags-muted'}`}>
              <Icon size={14} />{label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
