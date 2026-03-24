import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ENTRY_AMOUNT_SOL } from '@/lib/constants';

const ROUND_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const BAGS_FEE_PERCENT = 0.02; // 2% stays in treasury
const WINNER_PERCENT = 0.98; // 98% goes to winner

async function checkAndExecuteAutoDraw(db: any) {
  const round = await db.collection('rounds').findOne({ status: 'active' });
  if (!round) return null;

  const elapsed = Date.now() - new Date(round.createdAt).getTime();
  const participants = round.participants || [];

  // Auto-draw if time is up
  if (elapsed >= ROUND_DURATION_MS) {
    // If no participants, just reset
    if (participants.length === 0) {
      await db.collection('rounds').updateOne(
        { _id: round._id },
        { $set: { status: 'cancelled' } }
      );
      await db.collection('rounds').insertOne({
        status: 'active', participants: [], rewardPool: 0, createdAt: new Date(),
      });
      return null;
    }

    // 1 or more participants — pick a winner
    // If only 1 participant, they win automatically
    let winnerIndex = 0;
    if (participants.length > 1) {
      const randomBytes = new Uint32Array(1);
      crypto.getRandomValues(randomBytes);
      winnerIndex = randomBytes[0] % participants.length;
    }

    const winner = participants[winnerIndex];
    const bagsFee = round.rewardPool * BAGS_FEE_PERCENT; // 2% kept in treasury
    const payout = round.rewardPool * WINNER_PERCENT; // 98% to winner

    // Record draw
    const draw = await db.collection('draws').insertOne({
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

    // Close round
    await db.collection('rounds').updateOne(
      { _id: round._id },
      { $set: { status: 'completed', winner: winner.wallet, drawId: draw.insertedId } }
    );

    // Start fresh round — 0 balance
    await db.collection('rounds').insertOne({
      status: 'active', participants: [], rewardPool: 0, createdAt: new Date(),
    });

    return {
      winner: winner.wallet,
      payout,
      bagsFee,
      participantCount: participants.length,
      drawId: draw.insertedId.toString(),
    };
  }

  return null;
}

// GET /api/pool
export async function GET() {
  try {
    const db = await getDb();
    await checkAndExecuteAutoDraw(db);

    let round = await db.collection('rounds').findOne({ status: 'active' });
    if (!round) {
      const result = await db.collection('rounds').insertOne({
        status: 'active', participants: [], rewardPool: 0, createdAt: new Date(),
      });
      round = { _id: result.insertedId, status: 'active', participants: [], rewardPool: 0, createdAt: new Date() };
    }

    const timeRemaining = Math.max(0, ROUND_DURATION_MS - (Date.now() - new Date(round.createdAt).getTime()));
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
        timeRemaining: Math.floor(timeRemaining / 1000),
      },
      stats: { totalDraws, totalVolume: volumeAgg[0]?.total || 0 },
      recentDraws: recentDraws.map((d) => ({
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
    await checkAndExecuteAutoDraw(db);

    let round = await db.collection('rounds').findOne({ status: 'active' });
    if (!round) {
      const result = await db.collection('rounds').insertOne({
        status: 'active', participants: [], rewardPool: 0, createdAt: new Date(),
      });
      round = { _id: result.insertedId, participants: [], rewardPool: 0 };
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
