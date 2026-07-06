import Navigation from "@/app/components/Navigation";
import TickerStrip from "@/app/components/TickerStrip";
import AssistantChat from "@/app/components/AssistantChat";
import { getAllCoins } from "@/app/lib/serverCoinData";

export default async function AssistantPage() {
  const allCoins = await getAllCoins();

  return (
    <>
      <TickerStrip coins={allCoins} />
      <Navigation />
      <AssistantChat />
    </>
  );
}
