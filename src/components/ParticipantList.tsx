'use client';

import React, { useState } from 'react';
import { Users, Clock, ExternalLink } from 'lucide-react';
import { usePool } from '@/hooks/usePool';
import { shortenAddress, SOL_TIERS } from '@/lib/constants';

export default function ParticipantList() {
  const { pools } = usePool();
  const [viewTier, setViewTier] = useState(0.01);
  const currentPool = pools.find((p) => p.tier === viewTier);
  const participants = currentPool?.participants || [];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Users size={18} className="text-bags-accent" /><h3 className="font-semibold">Participants</h3></div>
      </div>

      <div className="flex gap-1 bg-bags-dark/60 rounded-lg p-1 mb-4 border border-bags-border/50">
        {SOL_TIERS.map((tier) => {
          const pool = pools.find((p) => p.tier === tier);
          return (
            <button key={tier} onClick={() => setViewTier(tier)} className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${viewTier === tier ? 'bg-bags-primary/10 text-bags-primary' : 'text-bags-muted'}`}>
              {tier} SOL ({pool?.participantCount || 0})
            </button>
          );
        })}
      </div>

      {participants.length === 0 ? (
        <div className="text-center py-8 text-bags-muted text-sm"><Users size={24} className="mx-auto mb-2 opacity-40" />No participants in {viewTier} SOL pool yet.</div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {participants.map((p: any, i: number) => (
            <div key={p.wallet + i} className="flex items-center justify-between bg-bags-dark/40 rounded-xl px-4 py-3 border border-bags-border/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-bags-primary/20 to-bags-accent/20 flex items-center justify-center text-xs font-mono font-bold text-bags-primary">{i + 1}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm">{shortenAddress(p.wallet, 6)}</p>
                    {p.paymentType === 'LFAI' && <span className="text-[10px] bg-bags-accent/10 text-bags-accent px-1.5 py-0.5 rounded">$LFAI</span>}
                  </div>
                  {p.txSignature && (
                    <a href={`https://solscan.io/tx/${p.txSignature}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-bags-muted hover:text-bags-primary">
                      View TX <ExternalLink size={8} />
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-bags-muted"><Clock size={10} />{p.entryTime ? new Date(p.entryTime).toLocaleTimeString() : '—'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
