import BrowsePageClient from "@/app/components/BrowsePageClient";
import { getAllCoins, getMarketStats, getLastUpdated, isMockData } from "@/app/lib/serverCoinData";

export default async function BrowsePage() {
  const [initialCoins, marketStats] = await Promise.all([
    getAllCoins(),
    getMarketStats(),
  ]);
  const lastUpdated = getLastUpdated(initialCoins);

  return (
    <BrowsePageClient
      initialCoins={initialCoins}
      initialMarketStats={marketStats}
      lastUpdated={lastUpdated}
      isMock={isMockData(initialCoins)}
    />
  );
}
