import { watchlistCoins, getRandomWatchList } from "@/app/lib/mockData";
import TickerStrip from "@/app/components/TickerStrip";
import Navigation from "@/app/components/Navigation";
import WatchlistWrapper from "@/app/components/WatchlistWrapper";
import FlappyCrypto from "@/app/components/FlappyCrypto";
import styles from "./page.module.css";

export default function WatchlistPage() {
  // Pre-shuffle coins on server ONLY (no client-side execution)
  const initialWatchlist = getRandomWatchList(12);

  return (
    <>
      <TickerStrip coins={watchlistCoins} />
      <Navigation />

      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderContent}>
          <h1>My Watchlist</h1>
        </div>
        <FlappyCrypto />
      </div>

      <WatchlistWrapper initialCoins={initialWatchlist} />
    </>
  );
}
