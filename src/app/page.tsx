import TickerStrip from "@/app/components/TickerStrip";
import Navigation from "@/app/components/Navigation";
import WatchlistWrapper from "@/app/components/WatchlistWrapper";
import { getAllCoins, getMarketStats, getWatchlistCoins } from "@/app/lib/serverCoinData";

export default async function WatchlistPage() {
  const [allCoins, initialCoins, marketStats] = await Promise.all([
    getAllCoins(),
    getWatchlistCoins(),
    getMarketStats(),
  ]);

  return (
    <>
      <TickerStrip coins={allCoins} />
      <Navigation />

      <WatchlistWrapper
        initialCoins={initialCoins}
        allCoins={allCoins}
        initialMarketStats={marketStats}
      />
    </>
  );
}
