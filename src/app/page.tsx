import TickerStrip from "@/app/components/TickerStrip";
import Navigation from "@/app/components/Navigation";
import WatchlistWrapper from "@/app/components/WatchlistWrapper";
import { getAllCoins, getWatchlistCoins } from "@/app/lib/serverCoinData";

export default async function WatchlistPage() {
  const [allCoins, initialCoins] = await Promise.all([
    getAllCoins(),
    getWatchlistCoins(),
  ]);

  return (
    <>
      <TickerStrip coins={allCoins} />
      <Navigation />

      <WatchlistWrapper initialCoins={initialCoins} />
    </>
  );
}
