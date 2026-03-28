import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ENTRY_AMOUNT_SOL } from '@/lib/constants';

const ROUND_DURATION_MS = 5 * 60 * 1000;
const BAGS_FEE_PERCENT = 0.02;
const WINNER_PERCENT = 0.98;

async function getOrCreateActiveRound(db: any) {
  // Clean up: if multiple active rounds exist (shouldn't happen but just in case),
  // keep only the newest one
  const activeRounds = await db.collection('rounds')
    .find({ status: 'active' })
    .sort({ createdAt: -1 })
    .toArray();

  if (activeRounds.length > 1) {
    // Cancel all but the newest
    const idsToCancel = activeRounds.slice(1).map((r: any) => r._id);
    await db.collection('rounds').updateMany(
      { _id: { $in: idsToCancel } },
      { $set: { status: 'cancelled' } }
    );
  }

  let round = activeRounds[0] || null;

  if (!round) {
    const result = await db.collection('rounds').insertOne({
      status: 'active',
      participants: [],
      rewardPool: 0,
      createdAt: new Date(),
    });
    round = {
      _id: result.insertedId,
      status: 'active',
      participants: [],
      rewardPool: 0,
      createdAt: new Date(),
    };
  }

  return round;
}

async function processExpiredRound(db: any, round: any): Promise<boolean> {
  const elapsed = Date.now() - new Date(round.createdAt).getTime();
  if (elapsed < ROUND_DURATION_MS) return false; // Not expired yet

  const participants = round.participants || [];

  if (participants.length === 0) {
    // No participants — just cancel and create fresh
    await db.collection('rounds').updateOne(
      { _id: round._id },
      { $set: { status: 'cancelled' } }
    );
    await db.collection('rounds').insertOne({
      status: 'active',
      participants: [],
      rewardPool: 0,
      createdAt: new Date(),
    });
    return true;
  }

  // Has participants — pick winner
  let winnerIndex = 0;
  if (participants.length > 1) {
    const randomBytes = new Uint32Array(1);
    crypto.getRandomValues(randomBytes);
    winnerIndex = randomBytes[0] % participants.length;
  }

  const winner = participants[winnerIndex];
  const bagsFee = round.rewardPool * BAGS_FEE_PERCENT;
  const payout = round.rewardPool * WINNER_PERCENT;

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
    createdAt: new Date(),
  });

  await db.collection('rounds').updateOne(
    { _id: round._id },
    { $set: { status: 'completed', winner: winner.wallet } }
  );

  // Fresh round
  await db.collection('rounds').insertOne({
    status: 'active',
    participants: [],
    rewardPool: 0,
    createdAt: new Date(),
  });

  return true;
}

// GET /api/pool
export async function GET() {
  try {
    const db = await getDb();

    // Get active round, process if expired
    let round = await getOrCreateActiveRound(db);
    const wasExpired = await processExpiredRound(db, round);

    // If round was expired, get the fresh one
    if (wasExpired) {
      round = await getOrCreateActiveRound(db);
    }

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

    // Process expired round first if needed
    let round = await getOrCreateActiveRound(db);
    const wasExpired = await processExpiredRound(db, round);
    if (wasExpired) {
      round = await getOrCreateActiveRound(db);
    }

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
