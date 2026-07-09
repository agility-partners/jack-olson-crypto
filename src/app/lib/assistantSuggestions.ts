export const ALL_ASSISTANT_SUGGESTIONS = [
  "What are the top gainers and losers today?",
  "Show me the current market summary",
  "What's the price of Bitcoin and Ethereum?",
  "What's in my watchlist?",
  "Which coin has the highest market cap right now?",
  "What are the biggest losers in the last 24 hours?",
  "Give me an overview of the crypto market today",
  "How is Solana performing compared to Ethereum?",
  "What coins are trending up right now?",
  "Show me the top 5 coins by trading volume",
  "How has Bitcoin dominance changed this week?",
  "Which coins in my watchlist moved the most today?",
  "Compare Ethereum, Solana, and Cardano by market cap",
  "What are the top gainers with volume over $1B?",
  "Which large-cap coins are down more than 5% today?",
];

export const DEFAULT_ASSISTANT_SUGGESTIONS = ALL_ASSISTANT_SUGGESTIONS.slice(0, 5);

export function pickRandomAssistantSuggestions(
  count: number,
  random: () => number = Math.random
): string[] {
  const shuffled = [...ALL_ASSISTANT_SUGGESTIONS];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const swapIndex = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[i]];
  }

  return shuffled.slice(0, Math.min(count, shuffled.length));
}
