import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ENTRY_AMOUNT_SOL } from '@/lib/constants';
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import bs58 from 'bs58';

const ROUND_DURATION_MS = 5 * 60 * 1000;
const BAGS_FEE_PERCENT = 0.02;
const WINNER_PERCENT = 0.98;
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

function getTreasuryKeypair(): Keypair | null {
  const key = process.env.TREASURY_PRIVATE_KEY;
  if (!key) return null;
  try { return Keypair.fromSecretKey(bs58.decode(key)); } catch { return null; }
}

function getConnection(): Connection {
  return new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    { commitment: 'confirmed', wsEndpoint: undefined, disableRetryOnRateLimit: false }
  );
}

// Derive winner index from slot hash — anyone can verify this
function deriveWinnerFromSlotHash(slotHash: string, participantCount: number): number {
  // Use first 4 bytes of slot hash as uint32, mod by participant count
  const hashBytes = Buffer.from(slotHash, 'base64');
  const value = hashBytes.readUInt32LE(0);
  return value % participantCount;
}

async function getOrCreateActiveRound(db: any) {
  const activeRounds = await db.collection('rounds')
    .find({ status: 'active' }).sort({ createdAt: -1 }).toArray();

  if (activeRounds.length > 1) {
    const idsToCancel = activeRounds.slice(1).map((r: any) => r._id);
    await db.collection('rounds').updateMany(
      { _id: { $in: idsToCancel } },
      { $set: { status: 'cancelled' } }
    );
  }

  let round = activeRounds[0] || null;
  if (!round) {
    const result = await db.collection('rounds').insertOne({
      status: 'active', participants: [], rewardPool: 0, createdAt: new Date(),
    });
    round = { _id: result.insertedId, status: 'active', participants: [], rewardPool: 0, createdAt: new Date() };
  }
  return round;
}

async function processExpiredRound(db: any, round: any): Promise<boolean> {
  const elapsed = Date.now() - new Date(round.createdAt).getTime();
  if (elapsed < ROUND_DURATION_MS) return false;

  const participants = round.participants || [];

  if (participants.length === 0) {
    await db.collection('rounds').updateOne({ _id: round._id }, { $set: { status: 'cancelled' } });
    await db.collection('rounds').insertOne({
      status: 'active', participants: [], rewardPool: 0, createdAt: new Date(),
    });
    return true;
  }

  // Get on-chain slot hash for verifiable randomness
  const connection = getConnection();
  let slotHash = '';
  let slot = 0;
  let winnerIndex = 0;

  try {
    slot = await connection.getSlot('confirmed');
    const slotHashes = await connection.getLatestBlockhash('confirmed');
    slotHash = slotHashes.blockhash; // blockhash is derived from slot hashes — publicly verifiable
    winnerIndex = participants.length === 1 ? 0 : deriveWinnerFromSlotHash(slotHash, participants.length);
  } catch (err) {
    console.error('[Draw] Failed to get slot hash, using fallback:', err);
    const randomBytes = new Uint32Array(1);
    crypto.getRandomValues(randomBytes);
    winnerIndex = randomBytes[0] % participants.length;
    slotHash = 'fallback-' + Date.now();
  }

  const winner = participants[winnerIndex];
  const bagsFee = round.rewardPool * BAGS_FEE_PERCENT;
  const payout = round.rewardPool * WINNER_PERCENT;

  // Record draw on-chain via memo transaction
  let drawTxSignature = '';
  const treasuryKeypair = getTreasuryKeypair();

  if (treasuryKeypair) {
    try {
      const memoText = JSON.stringify({
        type: 'LUCKYFEE_DRAW',
        winner: winner.wallet,
        payout: payout.toFixed(6),
        participants: participants.length,
        slotHash,
        slot,
        timestamp: new Date().toISOString(),
      });

      const memoIx = new TransactionInstruction({
        keys: [],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(memoText),
      });

      const tx = new Transaction().add(memoIx);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;
      tx.feePayer = treasuryKeypair.publicKey;
      tx.sign(treasuryKeypair);

      drawTxSignature = await connection.sendRawTransaction(tx.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      // Poll for confirmation instead of using WebSocket
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const status = await connection.getSignatureStatus(drawTxSignature);
        if (status?.value?.confirmationStatus === 'confirmed' || status?.value?.confirmationStatus === 'finalized') break;
      }
    } catch (err) {
      console.error('[Draw] Memo TX failed (draw still valid):', err);
    }
  }

  // Save draw to DB
  await db.collection('draws').insertOne({
    roundId: round._id,
    winner: winner.wallet,
    payout,
    bagsFee,
    totalPool: round.rewardPool,
    participantCount: participants.length,
    participants: participants.map((p: any) => p.wallet),
    claimed: false,
    paidOut: false,
    paidTx: null,
    // Verifiability data
    drawTx: drawTxSignature,
    slotHash,
    slot,
    winnerIndex,
    randomnessSource: slotHash.startsWith('fallback') ? 'crypto.getRandomValues' : 'solana-blockhash',
    createdAt: new Date(),
  });

  await db.collection('rounds').updateOne(
    { _id: round._id },
    { $set: { status: 'completed', winner: winner.wallet } }
  );

  await db.collection('rounds').insertOne({
    status: 'active', participants: [], rewardPool: 0, createdAt: new Date(),
  });

  return true;
}

// GET /api/pool
export async function GET() {
  try {
    const db = await getDb();
    let round = await getOrCreateActiveRound(db);
    const wasExpired = await processExpiredRound(db, round);
    if (wasExpired) round = await getOrCreateActiveRound(db);

    const elapsed = Date.now() - new Date(round.createdAt).getTime();
    const timeRemaining = Math.max(0, Math.floor((ROUND_DURATION_MS - elapsed) / 1000));

    const totalDraws = await db.collection('draws').countDocuments();
    const volumeAgg = await db.collection('draws').aggregate([
      { $group: { _id: null, total: { $sum: '$totalPool' } } },
    ]).toArray();

    const recentDraws = await db.collection('draws')
      .find().sort({ createdAt: -1 }).limit(20).toArray();

    return NextResponse.json({
      success: true,
      pool: {
        roundId: round._id.toString(),
        participants: round.participants || [],
        rewardPool: round.rewardPool || 0,
        participantCount: (round.participants || []).length,
        timeRemaining,
      },
      stats: { totalDraws, totalVolume: volumeAgg[0]?.total || 0 },
      recentDraws: recentDraws.map((d: any) => ({
        drawId: d._id.toString(),
        winner: d.winner,
        amount: d.payout,
        bagsFee: d.bagsFee,
        totalPool: d.totalPool,
        participants: d.participantCount,
        timestamp: d.createdAt,
        claimed: d.claimed || false,
        paidOut: d.paidOut || false,
        drawTx: d.drawTx || '',
        slotHash: d.slotHash || '',
        slot: d.slot || 0,
        winnerIndex: d.winnerIndex ?? null,
        randomnessSource: d.randomnessSource || '',
      })),
    });
  } catch (err) {
    console.error('[API] Pool GET error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// POST /api/pool — join
export async function POST(req: NextRequest) {
  try {
    const { wallet, txSignature } = await req.json();
    if (!wallet || !txSignature) {
      return NextResponse.json({ success: false, error: 'wallet and txSignature required' }, { status: 400 });
    }

    const db = await getDb();
    let round = await getOrCreateActiveRound(db);
    const wasExpired = await processExpiredRound(db, round);
    if (wasExpired) round = await getOrCreateActiveRound(db);

    if ((round.participants || []).find((p: any) => p.wallet === wallet)) {
      return NextResponse.json({ success: false, error: 'Already in this round' }, { status: 400 });
    }

    await db.collection('rounds').updateOne(
      { _id: round._id },
      {
        $push: { participants: { wallet, txSignature, entryTime: new Date() } } as any,
        $inc: { rewardPool: ENTRY_AMOUNT_SOL },
      }
    );

    await db.collection('entries').insertOne({
      wallet, txSignature, roundId: round._id, amount: ENTRY_AMOUNT_SOL, createdAt: new Date(),
    });

    return NextResponse.json({ success: true, message: 'Joined pool' });
  } catch (err) {
    console.error('[API] Pool POST error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
