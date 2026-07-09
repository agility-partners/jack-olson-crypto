import TickerStrip from "@/app/components/TickerStrip";
import Navigation from "@/app/components/Navigation";
import WatchlistWrapper from "@/app/components/WatchlistWrapper";
import { getAllCoins, getMarketStats, getWatchlistCoins, getLastUpdated } from "@/app/lib/serverCoinData";

export default async function WatchlistPage() {
  const [allCoins, initialCoins, marketStats] = await Promise.all([
    getAllCoins(),
    getWatchlistCoins(),
    getMarketStats(),
  ]);
  const lastUpdated = getLastUpdated(allCoins);

  return (
    <>
      <TickerStrip coins={allCoins} />
      <Navigation />

      <WatchlistWrapper
        initialCoins={initialCoins}
        allCoins={allCoins}
        initialMarketStats={marketStats}
        lastUpdated={lastUpdated}
      />
    </>
  );
}
