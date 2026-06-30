import BrowsePageClient from "@/app/components/BrowsePageClient";
import { getAllCoins } from "@/app/lib/serverCoinData";

export default async function BrowsePage() {
  const initialCoins = await getAllCoins();

  return <BrowsePageClient initialCoins={initialCoins} />;
}
