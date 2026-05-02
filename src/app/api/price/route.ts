import { NextResponse } from 'next/server';

const LFAI_MINT = 'HjHsqykJ4ux2jNhvkkinBUfGLeCU5BnVhiegjeREBAGS';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

export async function GET() {
  try {
    // Try Jupiter price API first (most reliable)
    const jupRes = await fetch(
      `https://api.jup.ag/price/v2?ids=${LFAI_MINT}&vsToken=${SOL_MINT}`,
      { next: { revalidate: 30 } }
    );

    if (jupRes.ok) {
      const jupData = await jupRes.json();
      const priceData = jupData?.data?.[LFAI_MINT];
      if (priceData?.price) {
        return NextResponse.json({
          success: true,
          lfaiPriceInSol: parseFloat(priceData.price),
          source: 'jupiter',
        });
      }
    }

    // Fallback: try Bags trade quote (1 SOL worth of LFAI)
    const bagsApiKey = process.env.NEXT_PUBLIC_BAGS_API_KEY || '';
    if (bagsApiKey) {
      const headers: Record<string, string> = { 'x-api-key': bagsApiKey };
      const quoteRes = await fetch(
        `https://public-api-v2.bags.fm/api/v1/trade/quote?inputMint=${SOL_MINT}&outputMint=${LFAI_MINT}&amount=1000000000&slippageMode=auto`,
        { headers }
      );
      if (quoteRes.ok) {
        const quoteData = await quoteRes.json();
        if (quoteData.success && quoteData.response?.outAmount) {
          // 1 SOL = X LFAI, so 1 LFAI = 1/X SOL
          const lfaiPerSol = parseFloat(quoteData.response.outAmount);
          const lfaiPriceInSol = 1 / lfaiPerSol;
          return NextResponse.json({
            success: true,
            lfaiPriceInSol,
            lfaiPerSol,
            source: 'bags',
          });
        }
      }
    }

    return NextResponse.json({ success: false, error: 'Price unavailable' }, { status: 503 });
  } catch (err) {
    console.error('[Price] Error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
