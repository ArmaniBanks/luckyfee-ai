'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Medal, TrendingUp, Users, Crown, Loader2 } from 'lucide-react';
import { shortenAddress, formatSol } from '@/lib/constants';
import { useWallet } from '@solana/wallet-adapter-react';

type Tab = 'entries' | 'wins' | 'volume';

export default function LeaderboardPage() {
  const { publicKey } = useWallet();
  const [tab, setTab] = useState<Tab>('entries');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const myWallet = publicKey?.toBase58();

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tabs: { key: Tab; label: string; icon: typeof Trophy }[] = [
    { key: 'entries', label: 'Most Active', icon: TrendingUp },
    { key: 'wins', label: 'Top Winners', icon: Crown },
    { key: 'volume', label: 'Top Volume', icon: Medal },
  ];

  const rows = data
    ? tab === 'entries' ? data.topEntries
    : tab === 'wins' ? data.topWins
    : data.topVolume
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Trophy size={28} className="text-bags-warning" /> Leaderboard
        </h1>
        <p className="text-bags-muted mt-1">Top participants across all rounds.</p>
      </div>

      {data && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center">
            <Users size={20} className="mx-auto mb-2 text-bags-accent" />
            <p className="font-mono font-bold text-2xl">{data.stats.totalPlayers}</p>
            <p className="text-xs text-bags-muted mt-1">Total Players</p>
          </div>
          <div className="card text-center">
            <TrendingUp size={20} className="mx-auto mb-2 text-bags-primary" />
            <p className="font-mono font-bold text-2xl">{data.stats.totalEntries}</p>
            <p className="text-xs text-bags-muted mt-1">Total Entries</p>
          </div>
          <div className="card text-center">
            <Trophy size={20} className="mx-auto mb-2 text-bags-warning" />
            <p className="font-mono font-bold text-2xl">{data.stats.totalDraws}</p>
            <p className="text-xs text-bags-muted mt-1">Total Draws</p>
          </div>
        </div>
      )}

      <div className="flex gap-1 bg-bags-card rounded-xl p-1 border border-bags-border">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all
              ${tab === key ? 'bg-bags-primary/10 text-bags-primary' : 'text-bags-muted hover:text-white'}`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-bags-primary" /></div>
        ) : rows.length === 0 ? (
          <p className="text-center py-12 text-bags-muted text-sm">No data yet. Join a pool to appear on the leaderboard!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-bags-muted text-xs border-b border-bags-border/30">
                  <th className="pb-3 font-medium w-12">#</th>
                  <th className="pb-3 font-medium">Wallet</th>
                  {tab === 'entries' && <><th className="pb-3 font-medium text-right">Entries</th><th className="pb-3 font-medium text-right">Volume</th></>}
                  {tab === 'wins' && <><th className="pb-3 font-medium text-right">Wins</th><th className="pb-3 font-medium text-right">Total Won</th></>}
                  {tab === 'volume' && <><th className="pb-3 font-medium text-right">Volume</th><th className="pb-3 font-medium text-right">Entries</th></>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any, i: number) => {
                  const isMe = row.wallet === myWallet;
                  return (
                    <tr key={row.wallet} className={`border-b border-bags-border/10 ${isMe ? 'bg-bags-primary/5' : ''}`}>
                      <td className="py-3">
                        {i === 0 ? <span className="text-lg">🥇</span>
                        : i === 1 ? <span className="text-lg">🥈</span>
                        : i === 2 ? <span className="text-lg">🥉</span>
                        : <span className="text-bags-muted font-mono">{i + 1}</span>}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{shortenAddress(row.wallet, 6)}</span>
                          {isMe && <span className="text-[10px] bg-bags-primary/10 text-bags-primary px-1.5 py-0.5 rounded">You</span>}
                        </div>
                      </td>
                      {tab === 'entries' && (
                        <>
                          <td className="py-3 text-right font-mono font-bold">{row.entries}</td>
                          <td className="py-3 text-right font-mono text-bags-primary">{formatSol(row.totalVolume)} SOL</td>
                        </>
                      )}
                      {tab === 'wins' && (
                        <>
                          <td className="py-3 text-right font-mono font-bold text-bags-warning">{row.wins}</td>
                          <td className="py-3 text-right font-mono text-bags-primary">{formatSol(row.totalWon)} SOL</td>
                        </>
                      )}
                      {tab === 'volume' && (
                        <>
                          <td className="py-3 text-right font-mono font-bold text-bags-primary">{formatSol(row.totalVolume)} SOL</td>
                          <td className="py-3 text-right font-mono">{row.entries}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
