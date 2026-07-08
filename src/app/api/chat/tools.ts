import { tool } from "ai";
import { z } from "zod";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

export const SYSTEM_PROMPT = `You are a warehouse-aware crypto assistant. Always use the available tools to answer questions about market data, coin prices, top movers, and the user's watchlist. Never invent or estimate market values — rely solely on tool results. If data is unavailable, say so clearly.

Data freshness and citations: every tool-grounded answer must end with a plain-text "Sources:" line naming each tool used and the corresponding dataAsOf value(s). Whenever a tool result includes a "dataAsOf" field, always mention it so users know how current the data is. Example: "Sources: get_market_summary as of 2024-01-15T10:30:00Z". If dataAsOf is absent or null, say "dataAsOf unavailable" and note when the data is from a catalog fallback rather than a live warehouse result.

If asked for financial advice, investment recommendations, or whether to buy, sell, or hold any asset, decline politely: say you only provide factual market data and cannot offer financial advice. Direct the user to a licensed financial advisor.

If a coin is not found, say so clearly: "I don't have data for [coin name/symbol] in the warehouse." Do not guess or estimate its price.

If a tool call fails, tell the user that data is temporarily unavailable rather than guessing or fabricating values.

Formatting rules — follow these strictly:
- Never use markdown: no *, **, #, -, or bullet characters. Write plain text only.
- For top movers (gainers and losers): list each coin on its own line as "Name  $Price  +/-X.XX% (24h)". Do not include rank, market cap, volume, or other fields.
- For watchlist: list each coin on its own line as "Name  $Price  +/-X.XX% (24h)". Do not include extra fields.
- For a single coin price lookup: one line per coin showing name, price, and 24h change. Add 7d and 30d change only if the user specifically asks.
- For market summary: show total market cap, 24h volume, BTC dominance, and average 24h change only.
- Use commas for thousands separators in large numbers (e.g. $1,234,567).
- End every tool-grounded response with a final plain-text line that begins exactly with "Sources:".
- Keep responses short and factual. No preamble, no filler phrases.`;

export const tools = {
  get_coin_prices: tool({
    description:
      "Fetch current price, 24h/7d/30d change, rank, and market cap for one or more coins. If no coinIds are provided, returns all coins.",
    inputSchema: z.object({
      coinIds: z
        .array(z.string())
        .optional()
        .describe(
          "List of canonical coin IDs (e.g. ['bitcoin', 'ethereum']). Omit to get all coins."
        ),
    }),
    execute: async ({ coinIds }) => {
      if (coinIds && coinIds.length > 0) {
        const results = await Promise.all(
          coinIds.map(async (id) => {
            const res = await fetch(`${API_URL}/api/coins/${id}`);
            if (!res.ok) return { id, error: "coin_not_found" };
            return res.json();
          })
        );
        return results;
      }
      const res = await fetch(`${API_URL}/api/coins`);
      if (!res.ok) throw new Error("Failed to fetch coins");
      return res.json();
    },
  }),

  get_market_summary: tool({
    description:
      "Get overall crypto market statistics: total market cap, 24h volume, BTC dominance, and average 24h price change across all tracked coins.",
    inputSchema: z.object({}),
    execute: async () => {
      const res = await fetch(`${API_URL}/api/marketstats`);
      if (!res.ok) throw new Error("Failed to fetch market stats");
      return res.json();
    },
  }),

  get_top_movers: tool({
    description:
      "Get the top 10 gaining and top 10 losing coins by 24h price change percentage.",
    inputSchema: z.object({}),
    execute: async () => {
      const res = await fetch(`${API_URL}/api/marketstats/top-movers`);
      if (!res.ok) throw new Error("Failed to fetch top movers");
      return res.json();
    },
  }),

  get_watchlist: tool({
    description:
      "Get the coins in the user's watchlist with live price data for each.",
    inputSchema: z.object({}),
    execute: async () => {
      const res = await fetch(`${API_URL}/api/watchlist`);
      if (!res.ok) throw new Error("Failed to fetch watchlist");
      return res.json();
    },
  }),
};
