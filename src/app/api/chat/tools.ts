import { tool } from "ai";
import { z } from "zod";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

export const SYSTEM_PROMPT = `You are a warehouse-aware crypto assistant. Always use the available tools to answer questions about market data, coin prices, top movers, and the user's watchlist. Never invent or estimate market values — rely solely on tool results. If data is unavailable, say so clearly.

Data freshness and citations: tool-grounded answers must rely on the tool results and their dataAsOf values, but the UI renders the final "Sources:" footer separately. Do not add a "Sources:" line or repeat tool names / dataAsOf timestamps in the main response text. If dataAsOf is absent or null, do not guess freshness.

If asked for financial advice, investment recommendations, or whether to buy, sell, or hold any asset, decline politely: say you only provide factual market data and cannot offer financial advice. Direct the user to a licensed financial advisor.

If a coin is not found, say so clearly: "I don't have data for [coin name/symbol] in the warehouse." Do not guess or estimate its price.

If a tool call fails, tell the user that data is temporarily unavailable rather than guessing or fabricating values.

Formatting rules — follow these strictly:
- Never use markdown: no *, **, #, -, or bullet characters. Write plain text only.
- Whenever you mention a coin together with its current price, format it as "Name $Price (+/-X.XX%)".
- Never include "(24h)" after a percentage change.
- For top movers (gainers and losers): list each coin on its own line as "Name $Price (+/-X.XX%)". Do not include rank, market cap, volume, or other fields.
- For watchlist: list each coin on its own line as "Name $Price (+/-X.XX%)". Do not include extra fields.
- For a single coin price lookup: one line per coin showing name, price, and 24h change as "Name $Price (+/-X.XX%)". Add 7d and 30d change only if the user specifically asks.
- For top coins by trading volume: list each coin on its own line as "Name $Price (Vol: $XB)". Include the 24h trading volume for each coin using compact notation.
- For market summary: show total market cap, 24h volume, BTC dominance, average 24h change, and gainers count (e.g. "67 / 100 coins are gainers") only.
- Coin price formatting: if price >= $1,000 use commas and 2 decimal places (e.g. $65,000.55); if $1–$999.99 use 2 decimal places (e.g. $9.99); if $0.01–$0.9999 use 4 decimal places (e.g. $0.9966); if < $0.01 show the first two significant non-zero digits after leading zeros (e.g. $0.000087).
- Large currency values (market cap, volume): use compact suffix notation — T for trillions, B for billions, M for millions (e.g. $2.3T, $48.5B, $1.2M). Strip trailing zeros after the decimal point.
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
      "Get overall crypto market statistics: total market cap, 24h volume, BTC dominance, average 24h price change, and gainers count (number of coins with a positive 24h change out of total tracked coins).",
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

  get_top_by_volume: tool({
    description:
      "Get the top N coins ranked by 24h trading volume. Returns each coin's name, price, 24h volume, and 24h price change. Use this when asked about trading volume rankings.",
    inputSchema: z.object({
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Number of top coins to return (default: 5, max: 100)."),
    }),
    execute: async ({ limit = 5 }) => {
      const res = await fetch(
        `${API_URL}/api/marketstats/top-by-volume?limit=${limit}`
      );
      if (!res.ok) throw new Error("Failed to fetch top coins by volume");
      return res.json();
    },
  }),
};
