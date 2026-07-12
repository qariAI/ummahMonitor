// Live crypto prices — CoinGecko markets endpoint, free, no key. Not geo-
// filtered like the other live layers (price data has no location); renders
// as a ticker strip rather than map markers.
import { ok, fail } from "@/lib/http";

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/coins/markets" +
  "?vs_currency=usd&order=market_cap_desc&per_page=12&page=1&price_change_percentage=1h,24h";

export interface CryptoTicker {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change1h: number | null;
  change24h: number | null;
  marketCap: number;
}

export const revalidate = 60;

export async function GET() {
  let data: any;
  try {
    const res = await fetch(COINGECKO_URL, { next: { revalidate: 60 } } as RequestInit);
    if (!res.ok) {
      if (res.status === 429) return ok({ tickers: [], source: "CoinGecko", rateLimited: true, fetchedAt: Date.now() });
      return fail(`CoinGecko returned ${res.status}`, 502);
    }
    data = await res.json();
  } catch {
    return fail("Failed to reach CoinGecko", 502);
  }

  const tickers: CryptoTicker[] = (Array.isArray(data) ? data : []).map((c: any) => ({
    id: c.id,
    symbol: (c.symbol || "").toUpperCase(),
    name: c.name,
    price: c.current_price ?? 0,
    change1h: c.price_change_percentage_1h_in_currency ?? null,
    change24h: c.price_change_percentage_24h_in_currency ?? null,
    marketCap: c.market_cap ?? 0,
  }));

  return ok({ tickers, source: "CoinGecko", rateLimited: false, fetchedAt: Date.now() });
}
