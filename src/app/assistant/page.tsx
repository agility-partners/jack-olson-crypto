import TickerStrip from "@/app/components/TickerStrip";
import Navigation from "@/app/components/Navigation";
import AssistantPageClient from "@/app/components/AssistantPageClient";
import { getAllCoins } from "@/app/lib/serverCoinData";

export const metadata = {
  title: "CryptoWatch — Assistant",
  description: "Ask your warehouse-backed crypto assistant anything.",
};

export default async function AssistantPage() {
  const coins = await getAllCoins();

  return (
    <>
      <TickerStrip coins={coins} />
      <Navigation />
      <AssistantPageClient />
    </>
  );
}
