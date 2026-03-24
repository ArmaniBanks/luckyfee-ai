'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTokenLaunchFeed, type TokenLaunch } from '@/lib/bags-api';

export function useBagsTokenFeed(refreshInterval = 30000) {
  const [tokens, setTokens] = useState<TokenLaunch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = useCallback(async () => {
    try {
      const feed = await getTokenLaunchFeed();
      setTokens(feed);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
    const id = setInterval(fetchFeed, refreshInterval);
    return () => clearInterval(id);
  }, [fetchFeed, refreshInterval]);

  return { tokens, loading, refetch: fetchFeed };
}
