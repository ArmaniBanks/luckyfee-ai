'use client';

import React from 'react';
import { Shield, Percent, Repeat, Layers, Wallet, ExternalLink } from 'lucide-react';
import { usePool } from '@/hooks/usePool';
import { formatSol } from '@/lib/constants';

const STEPS = [
  { icon: Wallet, title: '1. Connect & Enter', desc: 'Connect your Solana wallet and send 0.01 SOL to the pool treasury.' },
  { icon: Repeat, title: '2. Fees via Bags', desc: 'Trades routed through Bags generate 2% fees shared between protocol and creators.' },
  { icon: Percent, title: '3. Fee Distribution', desc: '50% protocol, 50% creator. Partner fees add another revenue layer.' },
  { icon: Layers, title: '4. Pool Grows', desc: 'Each participant increases the reward pool. All entries are verified on-chain.' },
  { icon: Shield, title: '5. Fair Draw & Claim', desc: 'Cryptographically random winner selection. Winner claims 90% of the pool.' },
];

export default function BagsIntegration() {
  const { totalVolume, totalDraws, rewardPool } = usePool();
  return (
    <div className="space-y-6">
      <div className="card bg-gradient-to-br from-bags-card to-bags-accent/5 border-bags-accent/20">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold">Bags Integration</h3>
          <span className="badge-purple text-[10px]">Active</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-bags-dark/40 rounded-xl p-3 text-center"><p className="font-mono font-bold text-lg text-bags-primary">{formatSol(totalVolume * 0.02)}</p><p className="text-[10px] text-bags-muted mt-0.5">Fees Generated</p></div>
          <div className="bg-bags-dark/40 rounded-xl p-3 text-center"><p className="font-mono font-bold text-lg text-bags-accent">{totalDraws}</p><p className="text-[10px] text-bags-muted mt-0.5">Total Draws</p></div>
          <div className="bg-bags-dark/40 rounded-xl p-3 text-center"><p className="font-mono font-bold text-lg text-white">{formatSol(totalVolume)}</p><p className="text-[10px] text-bags-muted mt-0.5">Total Volume</p></div>
        </div>
        <p className="text-xs text-bags-muted">LuckyFee AI routes entries through <a href="https://bags.fm/apps" target="_blank" rel="noopener noreferrer" className="text-bags-primary hover:underline">Bags</a>, generating trading fees shared between the protocol, creators, and the reward pool.</p>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-4">How Fee Sharing Works</h3>
        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-bags-primary/10 to-bags-accent/10 flex items-center justify-center flex-shrink-0"><step.icon size={14} className="text-bags-primary" /></div>
              <div><p className="text-sm font-medium">{step.title}</p><p className="text-xs text-bags-muted">{step.desc}</p></div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-bags-border/30">
          <a href="https://bags.fm/apps" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 text-xs text-bags-muted hover:text-bags-primary transition-colors">Learn more on Bags <ExternalLink size={11} /></a>
        </div>
      </div>
    </div>
  );
}
