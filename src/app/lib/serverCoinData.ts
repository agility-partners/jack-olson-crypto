import { type Coin, watchlistCoins } from "@/app/lib/mockData";
import { createFallbackMarketStats, type MarketStats } from "@/app/lib/marketStats";
import { formatRelativeTime } from "@/app/lib/formatTime";

const API_URL = process.env.API_URL ?? "http://localhost:8080";
const CATALOG_REVALIDATE_SECONDS = 60;
const REQUEST_INIT_REVALIDATE = { next: { revalidate: CATALOG_REVALIDATE_SECONDS } } satisfies RequestInit;
const REQUEST_INIT_NO_STORE = { cache: "no-store" } satisfies RequestInit;

function cloneCoins(coins: Coin[]): Coin[] {
  return coins.map((coin) => ({ ...coin }));
}

async function fetchCoins(path: string, fallback: Coin[], init: RequestInit): Promise<Coin[]> {
  try {
    const res = await fetch(`${API_URL}${path}`, init);
    if (!res.ok) {
      return cloneCoins(fallback);
    }

    return await res.json() as Coin[];
  } catch {
    return cloneCoins(fallback);
  }
}

export async function getAllCoins(): Promise<Coin[]> {
  return fetchCoins("/api/coins", watchlistCoins, REQUEST_INIT_REVALIDATE);
}

export async function getWatchlistCoins(): Promise<Coin[]> {
  return fetchCoins("/api/watchlist", [], REQUEST_INIT_NO_STORE);
}

export async function getCoinById(id: string): Promise<Coin | null> {
  try {
    const res = await fetch(`${API_URL}/api/coins/${id}`, REQUEST_INIT_REVALIDATE);
    if (!res.ok) {
      return watchlistCoins.find((c) => c.id === id) ?? null;
    }

    return await res.json() as Coin;
  } catch {
    return watchlistCoins.find((c) => c.id === id) ?? null;
  }
}

export async function getMarketStats(): Promise<MarketStats> {
  try {
    const res = await fetch(`${API_URL}/api/marketstats`, REQUEST_INIT_REVALIDATE);
    if (!res.ok) {
      return createFallbackMarketStats(watchlistCoins);
    }

    return await res.json() as MarketStats;
  } catch {
    return createFallbackMarketStats(watchlistCoins);
  }
}

export function getLastUpdated(coins: Coin[]): string {
  const timestamps = coins
    .map((c) => c.dataAsOf)
    .filter((d): d is string => !!d);
  if (timestamps.length === 0) return "just now";
  const latest = timestamps.sort().at(-1)!;
  return formatRelativeTime(latest);
}
