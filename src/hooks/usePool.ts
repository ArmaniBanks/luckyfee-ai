'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Participant { wallet: string; txSignature: string; entryTime: string; }
export interface DrawResult {
  drawId: string; tier: number; winner: string; amount: number; bagsFee: number;
  totalPool: number; participants: number; timestamp: string; claimed: boolean;
  paidOut: boolean; drawTx: string; slotHash: string; slot: number;
  winnerIndex: number | null; randomnessSource: string;
}
export interface TierPool { tier: number; participants: Participant[]; rewardPool: number; participantCount: number; }

export function usePool(refreshInterval = 5000) {
  const [pools, setPools] = useState<TierPool[]>([]);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [totalDraws, setTotalDraws] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [recentDraws, setRecentDraws] = useState<DrawResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPool = useCallback(async () => {
    try {
      const res = await fetch('/api/pool');
      const data = await res.json();
      if (data.success) {
        setPools(data.pools);
        setStartedAt(data.startedAt);
        setTotalDraws(data.stats.totalDraws);
        setTotalVolume(data.stats.totalVolume);
        setRecentDraws(data.recentDraws);
      }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPool(); const id = setInterval(fetchPool, refreshInterval); return () => clearInterval(id); }, [fetchPool, refreshInterval]);

  const joinPool = useCallback(async (wallet: string, txSignature: string, tier: number) => {
    const res = await fetch('/api/pool', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wallet, txSignature, tier }) });
    const data = await res.json();
    if (data.success) await fetchPool();
    return data;
  }, [fetchPool]);

  const claimReward = useCallback(async (drawId: string, wallet: string) => {
    const res = await fetch('/api/claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ drawId, wallet }) });
    const data = await res.json();
    if (data.success) await fetchPool();
    return data;
  }, [fetchPool]);

  return { pools, startedAt, totalDraws, totalVolume, recentDraws, loading, joinPool, claimReward, fetchPool };
}
