import type { Coin } from "@/app/lib/mockData";
import TickerStrip from "@/app/components/TickerStrip";
import Navigation from "@/app/components/Navigation";
import WatchlistWrapper from "@/app/components/WatchlistWrapper";
import { fetchCoins } from "@/app/lib/coinsApi";

export default async function WatchlistPage() {
  const apiUrl = process.env.API_URL ?? "http://localhost:8080";
  let initialCoins: Coin[] = [];

  try {
    const res = await fetch(`${apiUrl}/api/watchlist`, { cache: "no-store" });
    if (res.ok) {
      initialCoins = await res.json() as Coin[];
    }
  } catch {
    // API unavailable — render with empty list
  }

  const tickerCoins = await fetchCoins();

  return (
    <>
      <TickerStrip coins={tickerCoins} />
      <Navigation />

      <WatchlistWrapper initialCoins={initialCoins} />
    </>
  );
}
