import BrowsePageClient from "@/app/components/BrowsePageClient";
import { getAllCoins, getMarketStats } from "@/app/lib/serverCoinData";

export default async function BrowsePage() {
  const [initialCoins, marketStats] = await Promise.all([
    getAllCoins(),
    getMarketStats(),
  ]);

  return <BrowsePageClient initialCoins={initialCoins} initialMarketStats={marketStats} />;
}
