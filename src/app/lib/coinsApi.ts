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
