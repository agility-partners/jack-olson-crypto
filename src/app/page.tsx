import { watchlistCoins, getRandomWatchList } from "@/app/lib/mockData";
import TickerStrip from "@/app/components/TickerStrip";
import Navigation from "@/app/components/Navigation";
import WatchlistWrapper from "@/app/components/WatchlistWrapper";
import styles from "./page.module.css";

export default function WatchlistPage() {
  // Pre-shuffle coins on server ONLY (no client-side execution)
  const initialWatchlist = getRandomWatchList(12);

  return (
    <>
      <TickerStrip coins={watchlistCoins} />
      <Navigation />

      <WatchlistWrapper initialCoins={initialWatchlist} />
    </>
  );
}
