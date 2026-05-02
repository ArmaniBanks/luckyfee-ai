'use client';

import React, { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Zap, Loader2, CheckCircle2, AlertCircle, Users, Trophy } from 'lucide-react';
import { usePool } from '@/hooks/usePool';
import { SOL_TIERS, TREASURY_WALLET, shortenAddress, formatSol } from '@/lib/constants';

type EntryState = 'idle' | 'confirming' | 'sending' | 'registering' | 'success' | 'error';

export default function PoolEntry() {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { pools, joinPool } = usePool();
  const [entryState, setEntryState] = useState<EntryState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedTier, setSelectedTier] = useState(0.01);

  const currentPool = pools.find((p) => p.tier === selectedTier);
  const alreadyIn = publicKey && currentPool ? currentPool.participants.some((p) => p.wallet === publicKey.toBase58()) : false;

  async function handleEnterPool() {
    if (!publicKey || !connected) return;
    setEntryState('confirming'); setErrorMsg('');
    try {
      const tx = new Transaction().add(SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: new PublicKey(TREASURY_WALLET), lamports: Math.floor(selectedTier * LAMPORTS_PER_SOL) }));
      setEntryState('sending');
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash; tx.feePayer = publicKey;
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
      setEntryState('registering');
      const result = await joinPool(publicKey.toBase58(), sig, selectedTier);
      if (result.success) setEntryState('success'); else { setErrorMsg(result.error || 'Failed'); setEntryState('error'); }
      setTimeout(() => setEntryState('idle'), 3000);
    } catch (err: any) {
      if (err?.message?.includes('rejected')) { setEntryState('idle'); return; }
      setErrorMsg(err?.message?.slice(0, 60) || 'Failed'); setEntryState('error');
      setTimeout(() => setEntryState('idle'), 4000);
    }
  }

  if (!connected) {
    return (
      <div className="card-glow text-center py-12">
        <img src="/logo.jpeg" alt="LuckyFee AI" className="w-16 h-16 mx-auto mb-6 rounded-2xl object-cover shadow-lg shadow-bags-primary/10" />
        <h2 className="text-2xl font-bold mb-3">Join the Reward Pool</h2>
        <p className="text-bags-muted mb-6 max-w-md mx-auto">Connect your Solana wallet. Choose your pool tier and enter to win 98% of the pot.</p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {SOL_TIERS.map((tier) => {
          const pool = pools.find((p) => p.tier === tier);
          return (
            <button key={tier} onClick={() => setSelectedTier(tier)}
              className={`card text-center transition-all cursor-pointer ${selectedTier === tier ? 'border-bags-primary/50 bg-bags-primary/5' : 'hover:border-bags-primary/20'}`}>
              <p className="font-mono font-bold text-xl mb-1">{tier} SOL</p>
              <div className="flex items-center justify-center gap-1 text-[10px] text-bags-muted mb-1"><Users size={10} /> {pool?.participantCount || 0} players</div>
              <div className="flex items-center justify-center gap-1 text-xs text-bags-primary font-mono"><Trophy size={10} /> {formatSol(pool?.rewardPool || 0)} SOL</div>
            </button>
          );
        })}
      </div>
      <div className="card-glow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-bags-primary to-bags-accent flex items-center justify-center"><Zap size={20} className="text-bags-dark" /></div>
          <div><h2 className="text-lg font-bold">{selectedTier} SOL Pool</h2><p className="text-xs text-bags-muted">{shortenAddress(publicKey!.toBase58())} · {currentPool?.participantCount || 0} in pool</p></div>
        </div>
        {alreadyIn ? (
          <div className="flex items-center justify-center gap-2 py-3 text-bags-primary"><CheckCircle2 size={18} /><span className="font-medium">You&apos;re in this round!</span></div>
        ) : (
          <button onClick={handleEnterPool} disabled={entryState !== 'idle'} className="btn-primary w-full flex items-center justify-center gap-2 text-base">
            {entryState === 'idle' && <><Zap size={18} /> Enter {selectedTier} SOL Pool</>}
            {entryState === 'confirming' && <><Loader2 size={18} className="animate-spin" /> Approve in wallet…</>}
            {entryState === 'sending' && <><Loader2 size={18} className="animate-spin" /> Confirming on-chain…</>}
            {entryState === 'registering' && <><Loader2 size={18} className="animate-spin" /> Registering…</>}
            {entryState === 'success' && <><CheckCircle2 size={18} /> Entry confirmed!</>}
            {entryState === 'error' && <><AlertCircle size={18} /> {errorMsg || 'Failed'}</>}
          </button>
        )}
      </div>
    </div>
  );
}
