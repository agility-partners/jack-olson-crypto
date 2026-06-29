import TickerStrip from "@/app/components/TickerStrip";
import Navigation from "@/app/components/Navigation";
import StatsBar from "@/app/components/StatsBar";
import WatchlistClient from "@/app/components/WatchlistClient";
import { fetchCoins } from "@/app/lib/coinsApi";
import styles from "../../page.module.css";

export default async function BrowsePage() {
  const coins = await fetchCoins();
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

      <WatchlistClient initialCoins={coins} useAllCoins={true} />
    </>
  );
}
