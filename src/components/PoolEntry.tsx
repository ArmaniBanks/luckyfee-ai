'use client';

import React, { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { SystemProgram, Transaction, PublicKey } from '@solana/web3.js';
import { Zap, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePool } from '@/hooks/usePool';
import { ENTRY_AMOUNT_SOL, ENTRY_AMOUNT_LAMPORTS, TREASURY_WALLET, shortenAddress } from '@/lib/constants';

type EntryState = 'idle' | 'confirming' | 'sending' | 'registering' | 'success' | 'error';

export default function PoolEntry() {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { participants, rewardPool, joinPool, participantCount } = usePool();
  const [entryState, setEntryState] = useState<EntryState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const alreadyIn = publicKey ? participants.some((p: any) => p.wallet === publicKey.toBase58()) : false;

  async function handleEnterPool() {
    if (!publicKey || !connected) return;
    setEntryState('confirming');
    setErrorMsg('');
    try {
      const treasury = new PublicKey(TREASURY_WALLET);
      const tx = new Transaction().add(
        SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: treasury, lamports: ENTRY_AMOUNT_LAMPORTS })
      );
      setEntryState('sending');
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
      setEntryState('registering');
      const result = await joinPool(publicKey.toBase58(), signature);
      if (result.success) { setEntryState('success'); } else { setErrorMsg(result.error || 'Failed'); setEntryState('error'); }
      setTimeout(() => setEntryState('idle'), 3000);
    } catch (err: any) {
      if (err?.message?.includes('rejected')) { setEntryState('idle'); return; }
      setErrorMsg(err?.message?.slice(0, 60) || 'Transaction failed');
      setEntryState('error');
      setTimeout(() => setEntryState('idle'), 4000);
    }
  }

  if (!connected) {
    return (
      <div className="card-glow text-center py-12">
        <img src="/logo.jpeg" alt="LuckyFee AI" className="w-16 h-16 mx-auto mb-6 rounded-2xl object-cover shadow-lg shadow-bags-primary/10" />
        <h2 className="text-2xl font-bold mb-3">Join the Reward Pool</h2>
        <p className="text-bags-muted mb-6 max-w-md mx-auto">Connect your Solana wallet to participate. Entry fee of {ENTRY_AMOUNT_SOL} SOL goes into the shared reward pool.</p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="card-glow">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-bags-primary to-bags-accent flex items-center justify-center"><Zap size={20} className="text-bags-dark" /></div>
        <div><h2 className="text-lg font-bold">Enter Pool</h2><p className="text-xs text-bags-muted">{shortenAddress(publicKey!.toBase58())} · {participantCount} in pool</p></div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-bags-dark/60 rounded-xl p-4 border border-bags-border/50"><p className="text-xs text-bags-muted mb-1">Entry Fee</p><p className="font-mono font-bold text-lg">{ENTRY_AMOUNT_SOL} SOL</p></div>
        <div className="bg-bags-dark/60 rounded-xl p-4 border border-bags-border/50"><p className="text-xs text-bags-muted mb-1">Current Pool</p><p className="font-mono font-bold text-lg text-bags-primary">{rewardPool.toFixed(4)} SOL</p></div>
      </div>
      {alreadyIn ? (
        <div className="flex items-center justify-center gap-2 py-3 text-bags-primary"><CheckCircle2 size={18} /><span className="font-medium">You&apos;re in this round!</span></div>
      ) : (
        <button onClick={handleEnterPool} disabled={entryState !== 'idle'} className="btn-primary w-full flex items-center justify-center gap-2 text-base">
          {entryState === 'idle' && <><Zap size={18} /> Enter Pool · {ENTRY_AMOUNT_SOL} SOL</>}
          {entryState === 'confirming' && <><Loader2 size={18} className="animate-spin" /> Approve in wallet…</>}
          {entryState === 'sending' && <><Loader2 size={18} className="animate-spin" /> Confirming on-chain…</>}
          {entryState === 'registering' && <><Loader2 size={18} className="animate-spin" /> Registering…</>}
          {entryState === 'success' && <><CheckCircle2 size={18} /> Entry confirmed!</>}
          {entryState === 'error' && <><AlertCircle size={18} /> {errorMsg || 'Failed'}</>}
        </button>
      )}
    </div>
  );
}
