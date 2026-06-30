import TickerStrip from "@/app/components/TickerStrip";
import Navigation from "@/app/components/Navigation";
import BrowseWrapper from "@/app/components/BrowseWrapper";
import { getAllCoins } from "@/app/lib/api";

export default async function BrowsePage() {
  const allCoins = await getAllCoins();

  return (
    <>
      <TickerStrip coins={allCoins} />
      <Navigation />
      <BrowseWrapper initialCoins={allCoins} />
    </>
  );
}
