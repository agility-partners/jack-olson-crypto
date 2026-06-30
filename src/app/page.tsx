import TickerStrip from "@/app/components/TickerStrip";
import Navigation from "@/app/components/Navigation";
import WatchlistWrapper from "@/app/components/WatchlistWrapper";
import { fetchAllCoins, fetchWatchlistCoins } from "@/app/lib/coinData";

export default async function WatchlistPage() {
  const [tickerCoins, initialCoins] = await Promise.all([
    fetchAllCoins(),
    fetchWatchlistCoins(),
  ]);

  return (
    <>
      <TickerStrip coins={tickerCoins} />
      <Navigation />

      <WatchlistWrapper initialCoins={initialCoins} />
    </>
  );
}
