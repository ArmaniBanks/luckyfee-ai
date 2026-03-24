'use client';

import React from 'react';
import { Users, Clock, ExternalLink } from 'lucide-react';
import { usePool } from '@/hooks/usePool';
import { shortenAddress, MIN_PARTICIPANTS_FOR_DRAW } from '@/lib/constants';

export default function ParticipantList() {
  const { participants, participantCount } = usePool();
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Users size={18} className="text-bags-accent" /><h3 className="font-semibold">Participants</h3></div>
        <span className="badge-purple">{participantCount} / {MIN_PARTICIPANTS_FOR_DRAW} min</span>
      </div>
      {participantCount === 0 ? (
        <div className="text-center py-8 text-bags-muted text-sm"><Users size={24} className="mx-auto mb-2 opacity-40" />No participants yet. Be the first!</div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {participants.map((p: any, i: number) => (
            <div key={p.wallet + i} className="flex items-center justify-between bg-bags-dark/40 rounded-xl px-4 py-3 border border-bags-border/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-bags-primary/20 to-bags-accent/20 flex items-center justify-center text-xs font-mono font-bold text-bags-primary">{i + 1}</div>
                <div>
                  <p className="font-mono text-sm">{shortenAddress(p.wallet, 6)}</p>
                  {p.txSignature && (
                    <a href={`https://solscan.io/tx/${p.txSignature}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-bags-muted hover:text-bags-primary">
                      View TX <ExternalLink size={8} />
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-bags-muted">
                <Clock size={10} />
                {p.entryTime ? new Date(p.entryTime).toLocaleTimeString() : '—'}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-bags-muted mb-1.5">
          <span>Draw eligibility</span>
          <span>{Math.min(participantCount, MIN_PARTICIPANTS_FOR_DRAW)}/{MIN_PARTICIPANTS_FOR_DRAW}</span>
        </div>
        <div className="h-2 bg-bags-dark rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-bags-primary to-bags-accent rounded-full transition-all duration-500" style={{ width: `${Math.min((participantCount / MIN_PARTICIPANTS_FOR_DRAW) * 100, 100)}%` }} />
        </div>
      </div>
    </div>
  );
}
