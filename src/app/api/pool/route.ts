export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { SOL_TIERS } from '@/lib/constants';
import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import bs58 from 'bs58';

const ROUND_MS = 5 * 60 * 1000;
const FEE = 0.02;
const WINNER_CUT = 0.98;
const MEMO_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

function treasury(): Keypair | null {
  const k = process.env.TREASURY_PRIVATE_KEY;
  if (!k) return null;
  try { return Keypair.fromSecretKey(bs58.decode(k)); } catch { return null; }
}

function rpc(): Connection {
  return new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com', { commitment: 'confirmed', wsEndpoint: undefined });
}

// The entire system has ONE document in "global_round" that tracks the current round start time.
// All tiers share this single timestamp.

async function getGlobalRound(db: any) {
  let doc = await db.collection('global_round').findOne({ key: 'current' });
  if (!doc) {
    await db.collection('global_round').insertOne({ key: 'current', startedAt: new Date() });
    doc = await db.collection('global_round').findOne({ key: 'current' });
  }
  return doc;
}

async function drawTier(db: any, tier: number, roundStart: Date, slotHash: string, slot: number) {
  // Find all entries for this tier in the current round (after roundStart)
  const entries = await db.collection('pool_entries').find({
    tier,
    createdAt: { $gte: roundStart },
  }).toArray();

  if (entries.length === 0) return;

  // Pick winner
  let winnerIndex = 0;
  if (entries.length > 1) {
    const seed = slotHash + tier.toString();
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
    winnerIndex = Math.abs(h) % entries.length;
  }

  const winner = entries[winnerIndex];
  const totalPool = entries.length * tier;
  const payout = totalPool * WINNER_CUT;
  const bagsFee = totalPool * FEE;

  // On-chain memo
  let drawTx = '';
  const tk = treasury();
  if (tk && payout > 0) {
    try {
      const conn = rpc();
      const memo = JSON.stringify({ type: 'LUCKYFEE_DRAW', tier, winner: winner.wallet, payout: payout.toFixed(6), players: entries.length, slotHash, slot });
      const ix = new TransactionInstruction({ keys: [], programId: MEMO_ID, data: Buffer.from(memo) });
      const tx = new Transaction().add(ix);
      const { blockhash } = await conn.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash; tx.feePayer = tk.publicKey; tx.sign(tk);
      drawTx = await conn.sendRawTransaction(tx.serialize(), { skipPreflight: false, preflightCommitment: 'confirmed' });
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) { console.error(`[Draw] memo failed for ${tier}:`, e); }
  }

  await db.collection('draws').insertOne({
    tier, winner: winner.wallet, payout, bagsFee, totalPool,
    participantCount: entries.length, participants: entries.map((e: any) => e.wallet),
    claimed: false, paidOut: false, paidTx: null, drawTx, slotHash, slot, winnerIndex,
    randomnessSource: slotHash.startsWith('fallback') ? 'fallback' : 'solana-blockhash',
    roundStartedAt: roundStart, createdAt: new Date(),
  });
}

async function checkAndDraw(db: any): Promise<boolean> {
  const global = await getGlobalRound(db);
  const elapsed = Date.now() - new Date(global.startedAt).getTime();

  if (elapsed < ROUND_MS) return false;

  // Atomic lock — only one caller processes the draw
  const lockResult = await db.collection('global_round').findOneAndUpdate(
    { key: 'current', startedAt: global.startedAt },
    { $set: { startedAt: new Date() } },
    { returnDocument: 'before' }
  );

  // If startedAt already changed, someone else handled it
  if (!lockResult || new Date(lockResult.startedAt).getTime() !== new Date(global.startedAt).getTime()) {
    return true; // still need to re-fetch
  }

  const roundStart = new Date(lockResult.startedAt);

  // Get randomness
  let slotHash = 'fallback-' + Date.now(), slot = 0;
  try {
    const conn = rpc();
    slot = await conn.getSlot('confirmed');
    const bh = await conn.getLatestBlockhash('confirmed');
    slotHash = bh.blockhash;
  } catch {}

  // Draw each tier
  for (const tier of SOL_TIERS) {
    await drawTier(db, tier, roundStart, slotHash, slot);
  }

  return true;
}

// GET
export async function GET() {
  try {
    const db = await getDb();
    await checkAndDraw(db);

    const global = await getGlobalRound(db);
    const startedAt = new Date(global.startedAt).toISOString();
    const elapsed = Date.now() - new Date(global.startedAt).getTime();
    const timeRemaining = Math.max(0, Math.floor((ROUND_MS - elapsed) / 1000));

    // Build pools from pool_entries since roundStart
    const roundStart = new Date(global.startedAt);
    const pools = [];
    for (const tier of SOL_TIERS) {
      const entries = await db.collection('pool_entries').find({ tier, createdAt: { $gte: roundStart } }).toArray();
      pools.push({
        tier,
        participants: entries.map((e: any) => ({ wallet: e.wallet, txSignature: e.txSignature, entryTime: e.createdAt })),
        rewardPool: entries.length * tier,
        participantCount: entries.length,
      });
    }

    const totalDraws = await db.collection('draws').countDocuments();
    const volAgg = await db.collection('draws').aggregate([{ $group: { _id: null, t: { $sum: '$totalPool' } } }]).toArray();
    const recentDraws = await db.collection('draws').find().sort({ createdAt: -1 }).limit(30).toArray();

    return NextResponse.json({
      success: true, timeRemaining, startedAt, pools,
      stats: { totalDraws, totalVolume: volAgg[0]?.t || 0 },
      recentDraws: recentDraws.map((d: any) => ({
        drawId: d._id.toString(), tier: d.tier, winner: d.winner, amount: d.payout,
        bagsFee: d.bagsFee, totalPool: d.totalPool, participants: d.participantCount,
        timestamp: d.createdAt, claimed: d.claimed || false, paidOut: d.paidOut || false,
        drawTx: d.drawTx || '', slotHash: d.slotHash || '', slot: d.slot || 0,
        winnerIndex: d.winnerIndex ?? null, randomnessSource: d.randomnessSource || '',
      })),
    });
  } catch (err) {
    console.error('[Pool] GET error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// POST
export async function POST(req: NextRequest) {
  try {
    const { wallet, txSignature, tier } = await req.json();
    if (!wallet || !txSignature || !tier) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
    if (!SOL_TIERS.includes(tier)) return NextResponse.json({ success: false, error: 'Invalid tier' }, { status: 400 });

    const db = await getDb();
    await checkAndDraw(db);

    const global = await getGlobalRound(db);
    const roundStart = new Date(global.startedAt);

    // Check duplicate
    const existing = await db.collection('pool_entries').findOne({ wallet, tier, createdAt: { $gte: roundStart } });
    if (existing) return NextResponse.json({ success: false, error: 'Already in this round' }, { status: 400 });

    await db.collection('pool_entries').insertOne({ wallet, txSignature, tier, amount: tier, createdAt: new Date() });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Pool] POST error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
