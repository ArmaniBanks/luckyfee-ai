'use client';

import { Wallet, TrendingUp, Award, Percent, Coins, Activity } from 'lucide-react';
import StatCard from '@/components/StatCard';
import BagsIntegration from '@/components/BagsIntegration';
import { usePool } from '@/hooks/usePool';
import { formatSol, shortenAddress, SOL_TIERS } from '@/lib/constants';

export default function DashboardPage() {
  const { pools, totalVolume, totalDraws, recentDraws } = usePool();
  const totalRewardPool = pools.reduce((s, p) => s + p.rewardPool, 0);
  const totalParticipants = pools.reduce((s, p) => s + p.participantCount, 0);
  const totalPaidOut = recentDraws.reduce((s: number, d: any) => s + d.amount, 0);

  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-bold">Dashboard</h1><p className="text-bags-muted mt-1">Real-time analytics across all pool tiers.</p></div>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total in Pools" value={`${formatSol(totalRewardPool)} SOL`} icon={Wallet} glow />
        <StatCard label="Total Volume" value={`${formatSol(totalVolume)} SOL`} icon={TrendingUp} trend="up" />
        <StatCard label="Total Paid Out" value={`${formatSol(totalPaidOut)} SOL`} icon={Award} />
        <StatCard label="Bags Fees" value={`${formatSol(totalVolume * 0.02)} SOL`} icon={Percent} subtitle="2% per entry" />
      </section>
      <section className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Pool status per tier */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4"><Activity size={18} className="text-bags-primary" /><h3 className="font-semibold">Pool Status</h3></div>
            <div className="grid grid-cols-3 gap-3">
              {pools.map((pool) => (
                <div key={pool.tier} className="bg-bags-dark/40 rounded-xl p-3 border border-bags-border/30 text-center">
                  <p className="font-mono font-bold text-sm text-bags-accent mb-1">{pool.tier} SOL</p>
                  <p className="font-mono font-bold text-lg text-bags-primary">{formatSol(pool.rewardPool)}</p>
                  <p className="text-[10px] text-bags-muted">{pool.participantCount} players</p>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-4"><Coins size={18} className="text-bags-warning" /><h3 className="font-semibold">Fee Breakdown (per entry)</h3></div>
            <div className="space-y-3">
              {[
                { label: 'Entry Amount', value: 'Varies by tier', pct: '100%', bar: 100, color: 'from-white/20 to-white/10' },
                { label: 'Bags Trading Fee', value: '2%', pct: '2%', bar: 50, color: 'from-bags-accent to-purple-500' },
                { label: 'Winner Payout', value: '98%', pct: '98%', bar: 98, color: 'from-bags-primary to-bags-accent' },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-xs mb-1"><span className="text-bags-muted">{row.label}</span><span className="font-mono">{row.value} <span className="text-bags-muted">({row.pct})</span></span></div>
                  <div className="h-1.5 bg-bags-dark rounded-full overflow-hidden"><div className={`h-full bg-gradient-to-r ${row.color} rounded-full`} style={{ width: `${row.bar}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-4"><Award size={18} className="text-bags-warning" /><h3 className="font-semibold">Recent Winners</h3></div>
            {recentDraws.length === 0 ? <p className="text-center py-8 text-sm text-bags-muted">No draws yet.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-bags-muted text-xs border-b border-bags-border/30"><th className="pb-2">Tier</th><th className="pb-2">Winner</th><th className="pb-2">Payout</th><th className="pb-2">Players</th><th className="pb-2">Time</th></tr></thead>
                  <tbody>{recentDraws.slice(0, 15).map((d: any) => (
                    <tr key={d.drawId} className="border-b border-bags-border/10">
                      <td className="py-2.5 font-mono text-bags-accent">{d.tier} SOL</td>
                      <td className="py-2.5 font-mono">{shortenAddress(d.winner, 6)}</td>
                      <td className="py-2.5 font-mono text-bags-primary">+{formatSol(d.amount)}</td>
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
