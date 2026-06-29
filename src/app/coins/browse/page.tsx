import TickerStrip from "@/app/components/TickerStrip";
import Navigation from "@/app/components/Navigation";
import StatsBar from "@/app/components/StatsBar";
import TopMovers from "@/app/components/TopMovers";
import WatchlistClient from "@/app/components/WatchlistClient";
import { fetchCoins, fetchTopMovers } from "@/app/lib/coinsApi";
import styles from "../../page.module.css";

export default async function BrowsePage() {
  const [coins, topMovers] = await Promise.all([fetchCoins(), fetchTopMovers()]);
  const gainerCount = coins.filter((coin) => coin.change24h >= 0).length;

  return (
    <>
      <TickerStrip coins={coins} />
      <Navigation />

      <div className={styles.pageHeader}>
        <h1>All Coins</h1>
        <p>Tracking {coins.length} assets · Last updated just now</p>
      </div>

      <StatsBar coinCount={coins.length} gainerCount={gainerCount} />

      <TopMovers topMovers={topMovers} />

      <WatchlistClient initialCoins={coins} useAllCoins={true} />
    </>
  );
}
