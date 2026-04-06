'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Timer, Crown, Gift, Loader2, Users, ExternalLink, ShieldCheck } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePool } from '@/hooks/usePool';
import { shortenAddress, formatSol } from '@/lib/constants';

export default function DrawEngine() {
  const { participantCount, rewardPool, timeRemaining: serverTime, recentDraws, claimReward } = usePool();
  const { publicKey } = useWallet();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimMsg, setClaimMsg] = useState('');
  const [localTime, setLocalTime] = useState(300);
  const lastServerTime = useRef(serverTime);

  useEffect(() => {
    if (serverTime !== lastServerTime.current) {
      setLocalTime(serverTime);
      lastServerTime.current = serverTime;
    }
  }, [serverTime]);

  useEffect(() => {
    const id = setInterval(() => setLocalTime((p) => (p <= 0 ? 0 : p - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const minutes = Math.floor(localTime / 60);
  const seconds = localTime % 60;
  const myWallet = publicKey?.toBase58();

  async function handleClaim(drawId: string) {
    if (!myWallet) return;
    setClaimingId(drawId);
    setClaimMsg('');
    try {
      const result = await claimReward(drawId, myWallet);
      if (result.success) {
        setClaimMsg(result.explorerUrl ? `Paid! View: ${result.explorerUrl}` : `${result.payout} SOL sent!`);
      } else {
        setClaimMsg(result.error || 'Claim failed');
      }
    } catch {
      setClaimMsg('Claim failed');
    } finally {
      setClaimingId(null);
    }
  }

  const myUnclaimedWins = recentDraws.filter((d: any) => d.winner === myWallet && !d.paidOut);

  return (
    <div className="space-y-6">
      {/* Countdown */}
      <div className="card-glow text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Timer size={18} className="text-bags-warning" />
          <span className="text-sm text-bags-muted">Auto-draw in</span>
        </div>
        <div className="font-mono text-5xl font-bold tracking-wider mb-4">
          <span className="gradient-text">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-bags-dark/60 rounded-xl p-3 border border-bags-border/50 text-center">
            <Users size={16} className="mx-auto mb-1 text-bags-accent" />
            <p className="font-mono font-bold text-lg">{participantCount}</p>
            <p className="text-[10px] text-bags-muted">Participants</p>
          </div>
          <div className="bg-bags-dark/60 rounded-xl p-3 border border-bags-border/50 text-center">
            <Trophy size={16} className="mx-auto mb-1 text-bags-warning" />
            <p className="font-mono font-bold text-lg text-bags-primary">{formatSol(rewardPool)} SOL</p>
            <p className="text-[10px] text-bags-muted">Prize Pool</p>
          </div>
        </div>
        <p className="text-xs text-bags-muted">
          Draw executes automatically when timer ends. Winner receives 98%. Randomness derived from Solana blockhash.
        </p>
      </div>

      {/* Unclaimed wins */}
      {myUnclaimedWins.length > 0 && (
        <div className="card bg-gradient-to-br from-bags-warning/10 to-bags-warning/5 border-bags-warning/30">
          <div className="flex items-center gap-2 mb-3">
            <Gift size={18} className="text-bags-warning" />
            <h3 className="font-semibold text-bags-warning">You have unclaimed rewards!</h3>
          </div>
          <div className="space-y-2">
            {myUnclaimedWins.map((draw: any) => (
              <div key={draw.drawId} className="flex items-center justify-between bg-bags-dark/40 rounded-xl px-4 py-3">
                <div>
                  <p className="font-mono text-sm font-bold text-bags-primary">+{formatSol(draw.amount)} SOL</p>
                  <p className="text-[10px] text-bags-muted">{draw.participants} participants · {new Date(draw.timestamp).toLocaleString()}</p>
                </div>
                <button onClick={() => handleClaim(draw.drawId)} disabled={claimingId === draw.drawId} className="btn-primary text-sm px-4 py-2">
                  {claimingId === draw.drawId ? <><Loader2 size={14} className="animate-spin" /> Claiming…</> : <><Gift size={14} /> Claim</>}
                </button>
              </div>
            ))}
          </div>
          {claimMsg && <p className="text-xs mt-2 text-bags-primary">{claimMsg}</p>}
        </div>
      )}

      {/* Draw History */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={18} className="text-bags-warning" />
          <h3 className="font-semibold">Draw History</h3>
        </div>
        {recentDraws.length === 0 ? (
          <p className="text-center py-6 text-sm text-bags-muted">No draws yet.</p>
        ) : (
          <div className="space-y-3">
            {recentDraws.map((draw: any) => (
              <div key={draw.drawId} className="bg-bags-dark/40 rounded-xl border border-bags-border/30 overflow-hidden">
                {/* Main row */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-bags-warning/10 flex items-center justify-center"><Crown size={14} className="text-bags-warning" /></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm font-medium">{shortenAddress(draw.winner, 6)}</p>
                        {myWallet === draw.winner && <span className="text-[10px] bg-bags-primary/10 text-bags-primary px-1.5 py-0.5 rounded">You</span>}
                      </div>
                      <p className="text-[10px] text-bags-muted">{draw.participants} players · {new Date(draw.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-bags-primary">+{formatSol(draw.amount)} SOL</p>
                    <p className="text-[10px] text-bags-muted">{draw.paidOut ? 'Paid ✓' : 'Pending'}</p>
                  </div>
                </div>

                {/* Action row — verify link + claim button */}
                <div className="flex items-center justify-between px-4 py-2 bg-bags-dark/40 border-t border-bags-border/20">
                  <div className="flex items-center gap-3">
                    {draw.drawTx ? (
                      <a
                        href={`https://solscan.io/tx/${draw.drawTx}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-bags-primary hover:underline"
                      >
                        <ShieldCheck size={12} /> Verify Draw on Solscan <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-bags-muted">
                        <ShieldCheck size={12} /> {draw.slotHash ? 'Verified via blockhash' : 'Pre-verification draw'}
                      </span>
                    )}

                    {draw.slot > 0 && (
                      <a
                        href={`https://solscan.io/block/${draw.slot}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] text-bags-muted hover:text-bags-accent"
                      >
                        Slot #{draw.slot} <ExternalLink size={8} />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {draw.slotHash && (
                      <span className="text-[10px] font-mono text-bags-muted" title={`Blockhash: ${draw.slotHash}`}>
                        {shortenAddress(draw.slotHash, 4)}
                      </span>
                    )}
                    {myWallet === draw.winner && !draw.paidOut && (
                      <button
                        onClick={() => handleClaim(draw.drawId)}
                        disabled={claimingId === draw.drawId}
                        className="flex items-center gap-1 text-xs bg-bags-primary/10 text-bags-primary px-3 py-1.5 rounded-lg hover:bg-bags-primary/20 transition-colors"
                      >
                        {claimingId === draw.drawId ? <Loader2 size={12} className="animate-spin" /> : <Gift size={12} />} Claim
                      </button>
                    )}
                  </div>
                </div>

                {/* Verification formula */}
                {(draw.drawTx || draw.slotHash) && (
                  <div className="px-4 py-2 border-t border-bags-border/10">
                    <p className="text-[10px] text-bags-muted">
                      Randomness: blockhash({shortenAddress(draw.slotHash || 'n/a', 4)}) → uint32 → mod {draw.participants} = winner index {draw.winnerIndex ?? '?'}
                      {draw.bagsFee > 0 && <> · Fee: {formatSol(draw.bagsFee)} SOL (2%)</>}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
