import type { Coin } from "@/app/lib/mockData";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

async function fetchCoinCollection(path: string): Promise<Coin[]> {
  try {
    const response = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    if (!response.ok) {
      return [];
    }

    return await response.json() as Coin[];
  } catch {
    return [];
  }
}

export function fetchAllCoins() {
  return fetchCoinCollection("/api/coins");
}

export function fetchWatchlistCoins() {
  return fetchCoinCollection("/api/watchlist");
}
