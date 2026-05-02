export const SOL_TIERS = [0.01, 0.05, 0.1];
export const ENTRY_AMOUNT_SOL = 0.01; // default
export const ENTRY_AMOUNT_LAMPORTS = 10_000_000;
export const MIN_PARTICIPANTS_FOR_DRAW = 2;
export const WINNER_PAYOUT_PERCENTAGE = 1.0;
export const TREASURY_WALLET = process.env.NEXT_PUBLIC_TREASURY_WALLET || '3Rc4aiFXkAUaC8oiyyoCdX7kmYtryqM6KcueeDUKbW9W';
export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
export const LFAI_MINT = 'HjHsqykJ4ux2jNhvkkinBUfGLeCU5BnVhiegjeREBAGS';
export const SOL_MINT = 'So11111111111111111111111111111111111111112';
export const LAMPORTS_PER_SOL_CONST = 1_000_000_000;

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
export function formatSol(sol: number): string {
  if (sol >= 1000) return `${(sol / 1000).toFixed(2)}K`;
  if (sol >= 1) return sol.toFixed(4);
  return sol.toFixed(6);
}
