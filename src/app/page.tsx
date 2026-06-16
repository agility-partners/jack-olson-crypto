import { watchlistCoins } from "@/app/lib/mockData";
import TickerStrip from "@/app/components/TickerStrip";
import Navigation from "@/app/components/Navigation";
import StatsBar from "@/app/components/StatsBar";
import WatchlistClient from "@/app/components/WatchlistClient";
import styles from "./page.module.css";

export default function WatchlistPage() {
  return (
    <>
      <TickerStrip coins={watchlistCoins} />
      <Navigation />

      <div className={styles.pageHeader}>
        <h1>My Watchlist</h1>
        <p>Tracking {watchlistCoins.length} assets · Last updated just now</p>
      </div>

      <StatsBar />

      <WatchlistClient coins={watchlistCoins} />
    </>
  );
}
