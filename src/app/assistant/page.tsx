import TickerStrip from "@/app/components/TickerStrip";
import Navigation from "@/app/components/Navigation";
import AssistantPageClient from "@/app/components/AssistantPageClient";
import { pickRandomAssistantSuggestions } from "@/app/lib/assistantSuggestions";
import { getAllCoins } from "@/app/lib/serverCoinData";

export const metadata = {
  title: "CryptoWatch — Assistant",
  description: "Ask your warehouse-backed crypto assistant anything.",
};

export const revalidate = 0;

export default async function AssistantPage() {
  const coins = await getAllCoins();
  const suggestions = pickRandomAssistantSuggestions(5);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden" }}>
      <TickerStrip coins={coins} />
      <Navigation />
      <AssistantPageClient initialSuggestions={suggestions} />
    </div>
  );
}
