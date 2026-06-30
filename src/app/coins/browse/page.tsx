import type { Coin } from "@/app/lib/mockData";
import BrowsePageClient from "./BrowsePageClient";

export default async function BrowsePage() {
  const apiUrl = process.env.API_URL ?? "http://localhost:8080";
  let initialCoins: Coin[] = [];

  try {
    const response = await fetch(`${apiUrl}/api/coins`, { cache: "no-store" });
    if (response.ok) {
      initialCoins = await response.json() as Coin[];
    }
  } catch {
    // API unavailable — render with empty list
  }

  return <BrowsePageClient initialCoins={initialCoins} />;
}
