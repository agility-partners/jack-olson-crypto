import TickerStrip from "@/app/components/TickerStrip";
import Navigation from "@/app/components/Navigation";
import WatchlistWrapper from "@/app/components/WatchlistWrapper";
import { getAllCoins, getWatchlistCoins } from "@/app/lib/api";

export default async function WatchlistPage() {
  const [tickerCoins, initialCoins] = await Promise.all([
    getAllCoins(),
    getWatchlistCoins(),
  ]);

  return (
    <>
      <TickerStrip coins={tickerCoins} />
      <Navigation />

      <WatchlistWrapper initialCoins={initialCoins} />
    </>
  );
}
