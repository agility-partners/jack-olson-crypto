import type { Coin } from "@/app/lib/mockData";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

export async function fetchCoins(): Promise<Coin[]> {
  try {
    const response = await fetch(`${API_URL}/api/coins`, { cache: "no-store" });

    if (!response.ok) {
      return [];
    }

    return await response.json() as Coin[];
  } catch {
    return [];
  }
}

export type TopMover = {
  id: string;
  symbol: string;
  name: string;
  iconClass: string;
  price: number;
  change24h: number;
  marketCap: string;
  marketCapRaw: number;
  categoryRank: number;
  category: "gainer" | "loser";
};

export async function fetchTopMovers(): Promise<TopMover[]> {
  try {
    const response = await fetch(`${API_URL}/api/topmovers`, { cache: "no-store" });

    if (!response.ok) {
      return [];
    }

    return await response.json() as TopMover[];
  } catch {
    return [];
  }
}
