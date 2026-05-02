export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getDb();

    const topEntries = await db.collection('pool_entries').aggregate([
      { $group: { _id: '$wallet', entries: { $sum: 1 }, totalVolume: { $sum: '$amount' } } },
      { $sort: { entries: -1 } },
      { $limit: 20 },
      { $project: { wallet: '$_id', entries: 1, totalVolume: 1, _id: 0 } },
    ]).toArray();

    const topWins = await db.collection('draws').aggregate([
      { $group: { _id: '$winner', wins: { $sum: 1 }, totalWon: { $sum: '$payout' } } },
      { $sort: { wins: -1 } },
      { $limit: 20 },
      { $project: { wallet: '$_id', wins: 1, totalWon: 1, _id: 0 } },
    ]).toArray();

    const topVolume = await db.collection('pool_entries').aggregate([
      { $group: { _id: '$wallet', totalVolume: { $sum: '$amount' }, entries: { $sum: 1 } } },
      { $sort: { totalVolume: -1 } },
      { $limit: 20 },
      { $project: { wallet: '$_id', totalVolume: 1, entries: 1, _id: 0 } },
    ]).toArray();

    const totalPlayers = await db.collection('pool_entries').distinct('wallet');
    const totalEntries = await db.collection('pool_entries').countDocuments();
    const totalDraws = await db.collection('draws').countDocuments();

    return NextResponse.json({
      success: true,
      topEntries,
      topWins,
      topVolume,
      stats: { totalPlayers: totalPlayers.length, totalEntries, totalDraws },
    });
  } catch (err) {
    console.error('[API] Leaderboard error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
