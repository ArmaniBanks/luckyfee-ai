import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import bs58 from 'bs58';

function getTreasuryKeypair(): Keypair | null {
  const key = process.env.TREASURY_PRIVATE_KEY;
  if (!key) {
    console.error('[Claim] TREASURY_PRIVATE_KEY not set');
    return null;
  }
  try {
    return Keypair.fromSecretKey(bs58.decode(key));
  } catch (err) {
    console.error('[Claim] Invalid TREASURY_PRIVATE_KEY:', err);
    return null;
  }
}

function getConnection(): Connection {
  const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  return new Connection(rpc, { commitment: 'confirmed', wsEndpoint: undefined });
}

// POST /api/claim — winner claims, server sends SOL from treasury
export async function POST(req: NextRequest) {
  try {
    const { drawId, wallet } = await req.json();
    if (!drawId || !wallet) {
      return NextResponse.json({ success: false, error: 'drawId and wallet required' }, { status: 400 });
    }

    const db = await getDb();

    // Atomic lock — only one claim can succeed
    // findOneAndUpdate returns the doc BEFORE update, so if paidOut is already true, it won't match
    const lockResult = await db.collection('draws').findOneAndUpdate(
      {
        _id: new ObjectId(drawId),
        winner: wallet,
        paidOut: { $ne: true },
      },
      {
        $set: { paidOut: true, claimStartedAt: new Date() },
      },
      { returnDocument: 'before' }
    );

    const draw = lockResult?.value || lockResult;
    if (!draw || !draw.payout) {
      return NextResponse.json({ success: false, error: 'Already claimed or draw not found' }, { status: 400 });
    }

    // Get treasury keypair
    const treasuryKeypair = getTreasuryKeypair();
    if (!treasuryKeypair) {
      // Unlock if treasury not configured
      await db.collection('draws').updateOne(
        { _id: new ObjectId(drawId) },
        { $set: { paidOut: false }, $unset: { claimStartedAt: '' } }
      );
      return NextResponse.json({ success: false, error: 'Treasury not configured' }, { status: 500 });
    }

    const connection = getConnection();
    const winnerPubkey = new PublicKey(wallet);
    const payoutLamports = Math.floor(draw.payout * LAMPORTS_PER_SOL);

    // Check treasury balance
    const balance = await connection.getBalance(treasuryKeypair.publicKey);
    if (balance < payoutLamports + 10000) {
      // Unlock
      await db.collection('draws').updateOne(
        { _id: new ObjectId(drawId) },
        { $set: { paidOut: false }, $unset: { claimStartedAt: '' } }
      );
      return NextResponse.json({ success: false, error: 'Insufficient treasury balance' }, { status: 500 });
    }

    // Send SOL
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: treasuryKeypair.publicKey,
        toPubkey: winnerPubkey,
        lamports: payoutLamports,
      })
    );

    let signature: string;
    try {
      // Get blockhash and sign
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;
      tx.feePayer = treasuryKeypair.publicKey;
      tx.sign(treasuryKeypair);

      // Send raw transaction
      signature = await connection.sendRawTransaction(tx.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      // Poll for confirmation — no WebSocket
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const status = await connection.getSignatureStatus(signature);
        if (status?.value?.confirmationStatus === 'confirmed' || status?.value?.confirmationStatus === 'finalized') break;
      }
    } catch (txErr: any) {
      // Unlock on transaction failure
      await db.collection('draws').updateOne(
        { _id: new ObjectId(drawId) },
        { $set: { paidOut: false }, $unset: { claimStartedAt: '' } }
      );
      console.error('[Claim] TX failed:', txErr);
      return NextResponse.json({ success: false, error: 'Transaction failed: ' + (txErr?.message || 'unknown') }, { status: 500 });
    }

    // Confirm payment in DB
    await db.collection('draws').updateOne(
      { _id: new ObjectId(drawId) },
      {
        $set: {
          claimed: true,
          paidOut: true,
          paidTx: signature,
          paidAt: new Date(),
          paidAmount: draw.payout,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: `${draw.payout} SOL sent to ${wallet}`,
      signature,
      payout: draw.payout,
      explorerUrl: `https://solscan.io/tx/${signature}`,
    });
  } catch (err: any) {
    console.error('[Claim] Error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Payout failed' }, { status: 500 });
  }
}

// GET /api/claim?wallet=xxx — check pending claims
export async function GET(req: NextRequest) {
  try {
    const wallet = req.nextUrl.searchParams.get('wallet');
    if (!wallet) return NextResponse.json({ success: false, error: 'wallet required' }, { status: 400 });

    const db = await getDb();
    const pendingClaims = await db.collection('draws').find({
      winner: wallet,
      paidOut: { $ne: true },
    }).toArray();

    return NextResponse.json({
      success: true,
      claims: pendingClaims.map((d) => ({
        drawId: d._id.toString(),
        payout: d.payout,
        participantCount: d.participantCount,
        timestamp: d.createdAt,
      })),
    });
  } catch (err) {
    console.error('[Claim] GET error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
