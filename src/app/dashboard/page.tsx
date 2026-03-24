'use client';

import { Wallet, TrendingUp, Award, Percent, Coins, Activity } from 'lucide-react';
import StatCard from '@/components/StatCard';
import BagsIntegration from '@/components/BagsIntegration';
import { usePool } from '@/hooks/usePool';
import { formatSol, shortenAddress } from '@/lib/constants';

export default function DashboardPage() {
  const { rewardPool, participantCount, totalVolume, totalDraws, recentDraws } = usePool();
  const totalPaidOut = recentDraws.reduce((s: number, d: any) => s + d.amount, 0);
  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-bold">Dashboard</h1><p className="text-bags-muted mt-1">Real-time pool analytics and Bags fee sharing data.</p></div>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Reward Pool" value={`${formatSol(rewardPool)} SOL`} icon={Wallet} glow />
        <StatCard label="Total Volume" value={`${formatSol(totalVolume)} SOL`} icon={TrendingUp} trend="up" />
        <StatCard label="Total Paid Out" value={`${formatSol(totalPaidOut)} SOL`} icon={Award} />
        <StatCard label="Bags Fees" value={`${formatSol(totalVolume * 0.02)} SOL`} icon={Percent} subtitle="2% per trade" />
      </section>
      <section className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="card">
            <div className="flex items-center gap-2 mb-4"><Activity size={18} className="text-bags-primary" /><h3 className="font-semibold">Pool Analytics</h3></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Participants', value: participantCount.toString(), color: 'text-bags-accent' },
                { label: 'Total Draws', value: totalDraws.toString(), color: 'text-bags-warning' },
                { label: 'Pool Size', value: `${formatSol(rewardPool)} SOL`, color: 'text-bags-primary' },
                { label: 'Volume', value: `${formatSol(totalVolume)} SOL`, color: 'text-white' },
              ].map((s) => (
                <div key={s.label} className="bg-bags-dark/40 rounded-xl p-3 text-center border border-bags-border/30">
                  <p className={`font-mono font-bold text-lg ${s.color}`}>{s.value}</p><p className="text-[10px] text-bags-muted mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-4"><Coins size={18} className="text-bags-warning" /><h3 className="font-semibold">Fee Breakdown (per entry)</h3></div>
            <div className="space-y-3">
              {[
                { label: 'Entry Amount', value: '0.01 SOL', pct: '100%', bar: 100, color: 'from-white/20 to-white/10' },
                { label: 'Bags Trading Fee', value: '0.0002 SOL', pct: '2%', bar: 50, color: 'from-bags-accent to-purple-500' },
                { label: 'Reward Pool', value: '0.0098 SOL', pct: '98%', bar: 98, color: 'from-bags-primary to-bags-accent' },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-xs mb-1"><span className="text-bags-muted">{row.label}</span><span className="font-mono">{row.value} <span className="text-bags-muted">({row.pct})</span></span></div>
                  <div className="h-1.5 bg-bags-dark rounded-full overflow-hidden"><div className={`h-full bg-gradient-to-r ${row.color} rounded-full transition-all duration-700`} style={{ width: `${row.bar}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-4"><Award size={18} className="text-bags-warning" /><h3 className="font-semibold">Recent Winners</h3></div>
            {recentDraws.length === 0 ? <p className="text-center py-8 text-sm text-bags-muted">No draws yet.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-bags-muted text-xs border-b border-bags-border/30"><th className="pb-2">Winner</th><th className="pb-2">Payout</th><th className="pb-2">Players</th><th className="pb-2">Time</th></tr></thead>
                  <tbody>{recentDraws.map((d: any) => (
                    <tr key={d.drawId} className="border-b border-bags-border/10">
                      <td className="py-2.5 font-mono">{shortenAddress(d.winner, 6)}</td>
                      <td className="py-2.5 font-mono text-bags-primary">+{formatSol(d.amount)} SOL</td>
                      <td className="py-2.5">{d.participants}</td>
                      <td className="py-2.5 text-bags-muted text-xs">{new Date(d.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-2"><BagsIntegration /></div>
      </section>
    </div>
  );
}
