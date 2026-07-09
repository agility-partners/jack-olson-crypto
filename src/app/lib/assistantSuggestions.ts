export const ALL_ASSISTANT_SUGGESTIONS = [
  "What are the top gainers and losers today?",
  "Show me the current market summary",
  "What's the price of Bitcoin and Ethereum?",
  "What's in my watchlist?",
  "Which coin has the highest market cap right now?",
  "What are the top 5 biggest losers in the last 24 hours?",
  "How many coins are currently gainers?",
  "How is Solana performing compared to Ethereum?",
  "What coins are trending up right now?",
  "Show me the top 5 coins by trading volume",
  "Provide a detailed summary of Bitcoin's current stats",
  "Which coins in my watchlist moved the most today?",
  "Compare Ethereum, Solana, and Cardano by market cap",
  "What are the top gainers with volume over $1B?",
  "Which coins are down more than 5% today?",
];

export const DEFAULT_ASSISTANT_SUGGESTIONS = ALL_ASSISTANT_SUGGESTIONS.slice(0, 5);

export function pickRandomAssistantSuggestions(
  count: number,
  exclude: string[] = [],
  random: () => number = Math.random
): string[] {
  const pool = ALL_ASSISTANT_SUGGESTIONS.filter((s) => !exclude.includes(s));
  const source = pool.length >= count ? pool : [...ALL_ASSISTANT_SUGGESTIONS];
  const shuffled = [...source];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const swapIndex = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[i]];
  }

  return shuffled.slice(0, Math.min(count, shuffled.length));
}
