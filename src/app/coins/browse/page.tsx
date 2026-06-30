import BrowseWrapper from "@/app/components/BrowseWrapper";
import TickerStrip from "@/app/components/TickerStrip";
import Navigation from "@/app/components/Navigation";
import { fetchAllCoins } from "@/app/lib/coinData";

export default async function BrowsePage() {
  const allCoins = await fetchAllCoins();

  return (
    <>
      <TickerStrip coins={allCoins} />
      <Navigation />
      <BrowseWrapper initialCoins={allCoins} />
    </>
  );
}
