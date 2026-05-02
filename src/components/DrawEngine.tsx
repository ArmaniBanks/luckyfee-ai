'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Timer, Crown, Gift, Loader2, Users, ExternalLink, ShieldCheck } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePool } from '@/hooks/usePool';
import { shortenAddress, formatSol, SOL_TIERS } from '@/lib/constants';

const ROUND_S = 300;

export default function DrawEngine() {
  const { pools, startedAt, recentDraws, claimReward } = usePool();
  const { publicKey } = useWallet();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimMsg, setClaimMsg] = useState('');
  const [filterTier, setFilterTier] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);

  const start = startedAt ? new Date(startedAt).getTime() : now;
  const remaining = Math.max(0, ROUND_S - Math.floor((now - start) / 1000));
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const myWallet = publicKey?.toBase58();
  const myUnclaimed = recentDraws.filter((d) => d.winner === myWallet && !d.paidOut);
  const filtered = filterTier ? recentDraws.filter((d) => d.tier === filterTier) : recentDraws;

  async function handleClaim(drawId: string) {
    if (!myWallet) return;
    setClaimingId(drawId); setClaimMsg('');
    try {
      const r = await claimReward(drawId, myWallet);
      setClaimMsg(r.success ? (r.explorerUrl ? `Paid! ${r.explorerUrl}` : `${r.payout} SOL sent!`) : (r.error || 'Failed'));
    } catch { setClaimMsg('Claim failed'); }
    finally { setClaimingId(null); }
  }

  return (
    <div className="space-y-6">
      {/* Timer */}
      <div className="card-glow text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Timer size={18} className="text-bags-warning" />
          <span className="text-sm text-bags-muted">All pools draw in</span>
        </div>
        <div className="font-mono text-5xl font-bold tracking-wider mb-4">
          <span className="gradient-text">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {pools.map((p) => (
            <div key={p.tier} className="bg-bags-dark/60 rounded-xl p-3 border border-bags-border/50 text-center">
              <p className="font-mono font-bold text-sm text-bags-accent mb-1">{p.tier} SOL</p>
              <div className="flex items-center justify-center gap-2 text-[10px] text-bags-muted">
                <span className="flex items-center gap-1"><Users size={10} /> {p.participantCount}</span>
                <span className="flex items-center gap-1"><Trophy size={10} /> {formatSol(p.rewardPool)}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-bags-muted">All three pools draw simultaneously. Winner of each receives 98%.</p>
      </div>

      {/* Unclaimed */}
      {myUnclaimed.length > 0 && (
        <div className="card bg-gradient-to-br from-bags-warning/10 to-bags-warning/5 border-bags-warning/30">
          <div className="flex items-center gap-2 mb-3"><Gift size={18} className="text-bags-warning" /><h3 className="font-semibold text-bags-warning">Unclaimed rewards!</h3></div>
          {myUnclaimed.map((d) => (
            <div key={d.drawId} className="flex items-center justify-between bg-bags-dark/40 rounded-xl px-4 py-3 mb-2">
              <div>
                <p className="font-mono text-sm font-bold text-bags-primary">+{formatSol(d.amount)} SOL</p>
                <p className="text-[10px] text-bags-muted">{d.tier} SOL pool · {d.participants} players</p>
              </div>
              <button onClick={() => handleClaim(d.drawId)} disabled={claimingId === d.drawId} className="btn-primary text-sm px-4 py-2">
                {claimingId === d.drawId ? <><Loader2 size={14} className="animate-spin" /> Claiming…</> : <><Gift size={14} /> Claim</>}
              </button>
            </div>
          ))}
          {claimMsg && <p className="text-xs mt-2 text-bags-primary">{claimMsg}</p>}
        </div>
      )}

      {/* History */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4"><Trophy size={18} className="text-bags-warning" /><h3 className="font-semibold">Draw History</h3></div>
        <div className="flex gap-1 bg-bags-dark/60 rounded-lg p-1 mb-4 border border-bags-border/50">
          <button onClick={() => setFilterTier(null)} className={`flex-1 py-1.5 rounded-md text-xs font-medium ${!filterTier ? 'bg-bags-primary/10 text-bags-primary' : 'text-bags-muted'}`}>All</button>
          {SOL_TIERS.map((t) => (
            <button key={t} onClick={() => setFilterTier(t)} className={`flex-1 py-1.5 rounded-md text-xs font-medium ${filterTier === t ? 'bg-bags-primary/10 text-bags-primary' : 'text-bags-muted'}`}>{t} SOL</button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <p className="text-center py-6 text-sm text-bags-muted">No draws yet.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((d) => (
              <div key={d.drawId} className="bg-bags-dark/40 rounded-xl border border-bags-border/30 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-bags-warning/10 flex items-center justify-center"><Crown size={14} className="text-bags-warning" /></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm">{shortenAddress(d.winner, 6)}</p>
                        {myWallet === d.winner && <span className="text-[10px] bg-bags-primary/10 text-bags-primary px-1.5 py-0.5 rounded">You</span>}
                        <span className="text-[10px] bg-bags-dark px-1.5 py-0.5 rounded text-bags-muted">{d.tier} SOL</span>
                      </div>
                      <p className="text-[10px] text-bags-muted">{d.participants} players · {new Date(d.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-bags-primary">+{formatSol(d.amount)} SOL</p>
                    <p className="text-[10px] text-bags-muted">{d.paidOut ? 'Paid ✓' : 'Pending'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-2 bg-bags-dark/40 border-t border-bags-border/20">
                  {d.drawTx ? (
                    <a href={`https://solscan.io/tx/${d.drawTx}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-bags-primary hover:underline">
                      <ShieldCheck size={12} /> Verify on Solscan <ExternalLink size={10} />
                    </a>
                  ) : (
                    <span className="text-xs text-bags-muted"><ShieldCheck size={12} className="inline mr-1" />{d.slotHash ? 'Blockhash verified' : 'Legacy'}</span>
                  )}
                  {myWallet === d.winner && !d.paidOut && (
                    <button onClick={() => handleClaim(d.drawId)} disabled={claimingId === d.drawId} className="flex items-center gap-1 text-xs bg-bags-primary/10 text-bags-primary px-3 py-1.5 rounded-lg hover:bg-bags-primary/20">
                      {claimingId === d.drawId ? <Loader2 size={12} className="animate-spin" /> : <Gift size={12} />} Claim
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
