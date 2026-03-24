const BAGS_BASE_URL = '/bags-api';

function getApiKey(): string {
  return process.env.NEXT_PUBLIC_BAGS_API_KEY || '';
}

export function hasBagsApiKey(): boolean {
  return getApiKey().length > 0;
}

function headers(): Record<string, string> {
  const h: Record<string, string> = {};
  const key = getApiKey();
  if (key) h['x-api-key'] = key;
  return h;
}

export interface TokenLaunch {
  name: string;
  symbol: string;
  description: string;
  image: string;
  tokenMint: string;
  status: string;
  twitter?: string;
  website?: string;
}

export async function getTokenLaunchFeed(): Promise<TokenLaunch[]> {
  const key = getApiKey();
  if (!key) return [];
  try {
    const res = await fetch(`${BAGS_BASE_URL}/token-launch/feed`, { headers: headers() });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.success) return data.response || [];
    return [];
  } catch { return []; }
}
