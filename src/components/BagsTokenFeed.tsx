'use client';

import React from 'react';
import { Coins, ExternalLink, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useBagsTokenFeed } from '@/hooks/useBags';
import { hasBagsApiKey } from '@/lib/bags-api';
import { shortenAddress } from '@/lib/constants';

const DEMO_TOKENS = [
  { name: 'LuckyFee', symbol: 'LFEE', status: 'ACTIVE', tokenMint: 'LFee111111111111111111111111111demo1', image: '' },
  { name: 'BagsBuilder', symbol: 'BLDX', status: 'ACTIVE', tokenMint: 'BBld111111111111111111111111111demo2', image: '' },
  { name: 'SolPool', symbol: 'SPOOL', status: 'PRE_LAUNCH', tokenMint: 'SPoo111111111111111111111111111demo3', image: '' },
  { name: 'FeeShare', symbol: 'FSHR', status: 'MIGRATED', tokenMint: 'FShr111111111111111111111111111demo4', image: '' },
];

export default function BagsTokenFeed() {
  const { tokens, loading, refetch } = useBagsTokenFeed();
  const apiKeySet = hasBagsApiKey();
  const hasLiveData = tokens.length > 0;
  const displayTokens = hasLiveData ? tokens.slice(0, 20) : DEMO_TOKENS;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Coins size={18} className="text-bags-primary" />
          <h3 className="font-semibold">Bags Token Feed</h3>
          {hasLiveData ? <span className="badge-green text-[10px]">Live</span> : <span className="badge-yellow text-[10px]">Demo</span>}
        </div>
        <button onClick={refetch} className="p-2 hover:bg-white/5 rounded-lg transition-colors"><RefreshCw size={14} className="text-bags-muted" /></button>
      </div>

      <p className="text-xs text-bags-muted mb-4">Real-time token launches from the Bags ecosystem. Click any token to view on Bags.</p>

      {!apiKeySet && (
        <div className="flex items-start gap-2 bg-bags-warning/5 border border-bags-warning/15 rounded-xl p-3 mb-4">
          <AlertCircle size={14} className="text-bags-warning mt-0.5 flex-shrink-0" />
          <p className="text-xs text-bags-muted">
            <span className="text-bags-warning font-medium">API key needed for live data.</span>{' '}
            Add <code className="bg-bags-dark px-1 py-0.5 rounded text-bags-primary text-[10px]">NEXT_PUBLIC_BAGS_API_KEY</code> to your environment.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-bags-primary" /></div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {displayTokens.map((token: any, i: number) => (
            <TokenRow key={token.tokenMint || i} token={token} demo={!hasLiveData} />
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-bags-border/50">
        <a href="https://bags.fm/apps" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-sm text-bags-muted hover:text-bags-primary transition-colors">
          View all on Bags <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}

function TokenRow({ token, demo }: { token: any; demo?: boolean }) {
  const statusColors: Record<string, string> = { PRE_LAUNCH: 'badge-yellow', ACTIVE: 'badge-green', COMPLETED: 'badge-purple', MIGRATED: 'badge-green' };
  const tokenUrl = token.tokenMint && !demo
    ? `https://bags.fm/${token.tokenMint}`
    : `https://bags.fm/apps`;

  return (
    <a
      href={tokenUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between bg-bags-dark/40 rounded-xl px-4 py-3 border border-bags-border/30 hover:border-bags-primary/20 hover:bg-bags-dark/60 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-3">
        {token.image ? (
          <img src={token.image} alt={token.name} className="w-9 h-9 rounded-lg object-cover bg-bags-dark" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-bags-primary/20 to-bags-accent/20 flex items-center justify-center text-xs font-bold text-bags-primary">{token.symbol?.charAt(0) || '?'}</div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm group-hover:text-bags-primary transition-colors">{token.name}</span>
            <span className="font-mono text-xs text-bags-muted">${token.symbol}</span>
          </div>
          {token.tokenMint && <p className="font-mono text-[10px] text-bags-muted">{shortenAddress(token.tokenMint, 6)}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {demo && <span className="text-[10px] text-bags-muted">Demo</span>}
        <span className={statusColors[token.status] || 'badge-purple'}>{token.status}</span>
        <ExternalLink size={12} className="text-bags-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </a>
  );
}
