'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Participant {
  wallet: string;
  txSignature: string;
  entryTime: string;
}

export interface DrawResult {
  drawId: string;
  winner: string;
  amount: number;
  participants: number;
  timestamp: string;
  claimed: boolean;
}

export interface PoolState {
  roundId: string;
  participants: Participant[];
  rewardPool: number;
  participantCount: number;
  timeRemaining: number;
  totalDraws: number;
  totalVolume: number;
  recentDraws: DrawResult[];
  loading: boolean;
}

export function usePool(refreshInterval = 5000) {
  const [state, setState] = useState<PoolState>({
    roundId: '', participants: [], rewardPool: 0, participantCount: 0,
    timeRemaining: 300, totalDraws: 0, totalVolume: 0, recentDraws: [], loading: true,
  });

  const fetchPool = useCallback(async () => {
    try {
      const res = await fetch('/api/pool');
      const data = await res.json();
      if (data.success) {
        setState({
          roundId: data.pool.roundId,
          participants: data.pool.participants,
          rewardPool: data.pool.rewardPool,
          participantCount: data.pool.participantCount,
          timeRemaining: data.pool.timeRemaining,
          totalDraws: data.stats.totalDraws,
          totalVolume: data.stats.totalVolume,
          recentDraws: data.recentDraws,
          loading: false,
        });
      }
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchPool();
    const id = setInterval(fetchPool, refreshInterval);
    return () => clearInterval(id);
  }, [fetchPool, refreshInterval]);

  const joinPool = useCallback(async (wallet: string, txSignature: string) => {
    const res = await fetch('/api/pool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet, txSignature }),
    });
    const data = await res.json();
    if (data.success) await fetchPool();
    return data;
  }, [fetchPool]);

  const claimReward = useCallback(async (drawId: string, wallet: string) => {
    const res = await fetch('/api/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drawId, wallet }),
    });
    const data = await res.json();
    if (data.success) await fetchPool();
    return data;
  }, [fetchPool]);

  return { ...state, fetchPool, joinPool, claimReward };
}
