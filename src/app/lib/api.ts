import { Coin, watchlistCoins } from "@/app/lib/mockData";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

async function fetchCoins(path: string): Promise<Coin[] | null> {
  try {
    const response = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    return (await response.json()) as Coin[];
  } catch {
    return null;
  }
}

export async function getAllCoins(): Promise<Coin[]> {
  return (await fetchCoins("/api/coins")) ?? watchlistCoins;
}

export async function getWatchlistCoins(): Promise<Coin[]> {
  return (await fetchCoins("/api/watchlist")) ?? [];
}
