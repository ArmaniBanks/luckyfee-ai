'use client';

import { Wallet, Users, TrendingUp, Award, Sparkles } from 'lucide-react';
import StatCard from '@/components/StatCard';
import PoolEntry from '@/components/PoolEntry';
import ParticipantList from '@/components/ParticipantList';
import { usePool } from '@/hooks/usePool';
import { formatSol } from '@/lib/constants';

export default function HomePage() {
  const { rewardPool, participantCount, totalVolume, totalDraws, recentDraws } = usePool();
  const lastWinner = recentDraws[0];
  return (
    <div className="space-y-8">
      <section className="text-center py-8">
        <img src="/logo.jpeg" alt="LuckyFee AI" className="w-20 h-20 mx-auto mb-5 rounded-2xl object-cover shadow-xl shadow-bags-primary/15 animate-float" />
        <div className="inline-flex items-center gap-2 badge-green mb-4"><Sparkles size={12} />Powered by Bags Fee Sharing</div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"><span className="gradient-text">LuckyFee AI</span></h1>
        <p className="text-bags-muted max-w-xl mx-auto">A decentralized reward pool on Solana. Send real SOL to the pool, and a random winner takes 90% of the pot.</p>
      </section>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Reward Pool" value={`${formatSol(rewardPool)} SOL`} icon={Wallet} glow />
        <StatCard label="Participants" value={participantCount.toString()} icon={Users} subtitle="current round" />
        <StatCard label="Total Volume" value={`${formatSol(totalVolume)} SOL`} icon={TrendingUp} trend="up" />
        <StatCard label="Draws" value={totalDraws.toString()} icon={Award} subtitle={lastWinner ? `Last: ${lastWinner.winner.slice(0, 6)}…` : 'No draws yet'} />
      </section>
      <section className="grid lg:grid-cols-2 gap-6">
        <PoolEntry />
        <ParticipantList />
      </section>
    </div>
  );
}
