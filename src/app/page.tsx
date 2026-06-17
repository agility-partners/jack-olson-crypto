import { watchlistCoins, getRandomWatchList } from "@/app/lib/mockData";
import TickerStrip from "@/app/components/TickerStrip";
import Navigation from "@/app/components/Navigation";
import StatsBar from "@/app/components/StatsBar";
import WatchlistClient from "@/app/components/WatchlistClient";
import styles from "./page.module.css";

export default function WatchlistPage() {
  // Pre-shuffle coins on server ONLY (no client-side execution)
  const initialWatchlist = getRandomWatchList(12);
  
  // Calculate gainer count from initial watchlist
  const gainerCount = initialWatchlist.filter((c) => c.change24h >= 0).length;

  return (
    <>
      <TickerStrip coins={watchlistCoins} />
      <Navigation />

      <div className={styles.pageHeader}>
        <h1>My Watchlist</h1>
        <p>Tracking {initialWatchlist.length} assets · Last updated just now</p>
      </div>

      <StatsBar coinCount={initialWatchlist.length} gainerCount={gainerCount} />

      <WatchlistClient initialCoins={initialWatchlist} />
    </>
  );
}
