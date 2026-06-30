import { type Coin, watchlistCoins } from "@/app/lib/mockData";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

function cloneCoins(coins: Coin[]): Coin[] {
  return coins.map((coin) => ({ ...coin }));
}

async function fetchCoins(path: string, fallback: Coin[]): Promise<Coin[]> {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    if (!res.ok) {
      return cloneCoins(fallback);
    }

    return await res.json() as Coin[];
  } catch {
    return cloneCoins(fallback);
  }
}

export async function getAllCoins(): Promise<Coin[]> {
  return fetchCoins("/api/coins", watchlistCoins);
}

export async function getWatchlistCoins(): Promise<Coin[]> {
  return fetchCoins("/api/watchlist", []);
}
