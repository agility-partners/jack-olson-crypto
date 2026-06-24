import { Coin, watchlistCoins } from "@/app/lib/mockData";
import TickerStrip from "@/app/components/TickerStrip";
import Navigation from "@/app/components/Navigation";
import WatchlistWrapper from "@/app/components/WatchlistWrapper";
import styles from "./page.module.css";

export default async function WatchlistPage() {
  const apiUrl = process.env.API_URL ?? "http://localhost:8080";
  let initialCoins: Coin[] = [];

  try {
    const res = await fetch(`${apiUrl}/api/watchlist`, { cache: "no-store" });
    if (res.ok) {
      const watchlistEntries = await res.json();
      // Map watchlist entries to full Coin objects using coinId
      initialCoins = watchlistEntries
        .map((entry: any) => watchlistCoins.find((c) => c.id === entry.coinId))
        .filter((coin: Coin | undefined): coin is Coin => coin !== undefined);
    }
  } catch {
    // API unavailable — render with empty list
  }

  return (
    <>
      <TickerStrip coins={watchlistCoins} />
      <Navigation />

      <WatchlistWrapper initialCoins={initialCoins} />
    </>
  );
}
