import { tool } from "ai";
import { z } from "zod";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

export const SYSTEM_PROMPT = `You are a warehouse-aware crypto assistant. Always use the available tools to answer questions about market data, coin prices, top movers, and the user's watchlist. Never invent or estimate market values — rely solely on tool results. If data is unavailable, say so clearly.

Data freshness and citations: tool-grounded answers must rely on the tool results and their dataAsOf values, but the UI renders the final "Sources:" footer separately. Do not add a "Sources:" line or repeat tool names / dataAsOf timestamps in the main response text. If dataAsOf is absent or null, do not guess freshness.

Pre-fetched snapshot: On the first message of each conversation a full market data snapshot (all coins, market summary, top movers, 7-day movers, top by volume, and watchlist) is appended to this prompt as JSON under the key "Pre-fetched Market Snapshot". When that snapshot is present, consult it first to answer the query. Only call tools if the snapshot lacks the specific data needed, or if the user explicitly requests fresh data.

Accuracy rules: for any request that asks which coins meet numeric criteria, cross a threshold, fall in a range, or requires a complete filtered list or count, use the screen_coins tool instead of manually filtering in your head. Accuracy matters more than speed: spend extra tool steps to verify threshold comparisons, counts, and completeness before answering. Never name a coin unless it appears in the latest relevant tool result and satisfies the requested criteria exactly.

If asked for financial advice, investment recommendations, or whether to buy, sell, or hold any asset, decline politely: say you only provide factual market data and cannot offer financial advice. Direct the user to a licensed financial advisor.

If a coin is not found, say so clearly: "I don't have data for [coin name/symbol] in the warehouse." Do not guess or estimate its price.

If a tool call fails, tell the user that data is temporarily unavailable rather than guessing or fabricating values.

Formatting rules — follow these strictly:
- Never use markdown: no *, **, #, -, or bullet characters. Write plain text only.
- Whenever you mention a coin together with its current price, format it as "Name $Price (+/-X.XX%)".
- Never include "(24h)" after a percentage change.
- For top movers (gainers and losers by 24h): list each coin on its own line as "Name $Price (+/-X.XX%)". Do not include rank, market cap, volume, or other fields.
- For top 7-day movers (gainers and losers by 7d): list each coin on its own line as "Name $Price (+/-X.XX% 7d)". Do not include rank, market cap, volume, or other fields.
- For watchlist: list each coin on its own line as "Name $Price (+/-X.XX%)". Do not include extra fields.
- For a single coin price lookup: one line per coin showing name, price, and 24h change as "Name $Price (+/-X.XX%)". Add 7d and 30d change only if the user specifically asks.
- For top coins by trading volume: list each coin on its own line as "Name $Price (Vol: $XB)". Include the 24h trading volume for each coin using compact notation.
- For market summary: show total market cap, 24h volume, BTC dominance, average 24h change, and gainers count (e.g. "67 / 100 coins are gainers") only.
- Coin price formatting: if price >= $1,000 use commas and 2 decimal places (e.g. $65,000.55); if $1–$999.99 use 2 decimal places (e.g. $9.99); if $0.01–$0.9999 use 4 decimal places (e.g. $0.9966); if < $0.01 show the first two significant non-zero digits after leading zeros (e.g. $0.000087).
- Large currency values (market cap, volume): use compact suffix notation — T for trillions, B for billions, M for millions (e.g. $2.3T, $48.5B, $1.2M). Strip trailing zeros after the decimal point.
- Keep responses short and factual. No preamble, no filler phrases.`;

async function fetchAllCoins() {
  const res = await fetch(`${API_URL}/api/coins`);
  if (!res.ok) throw new Error("Failed to fetch coins");
  return res.json();
}

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
      return fetchAllCoins();
    },
  }),

  screen_coins: tool({
    description:
      "Deterministically screen the full tracked coin universe for exact numeric criteria. Use this for questions like which coins are above or below a price, within a price range, above or below a 24h/7d change threshold, within rank limits, or when you need a complete matching list or count without omissions.",
    inputSchema: z.object({
      coinIds: z
        .array(z.string())
        .optional()
        .describe("Optional subset of canonical coin IDs to screen before applying numeric filters."),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      minChange24h: z.number().optional(),
      maxChange24h: z.number().optional(),
      minChange7d: z.number().optional(),
      maxChange7d: z.number().optional(),
      minMarketCap: z.number().optional(),
      maxMarketCap: z.number().optional(),
      minVolume: z.number().optional(),
      maxVolume: z.number().optional(),
      minRank: z.number().int().positive().optional(),
      maxRank: z.number().int().positive().optional(),
      sortBy: z
        .enum(["price", "change24h", "change7d", "marketCap", "volume", "rank", "name"])
        .optional(),
      sortDirection: z.enum(["asc", "desc"]).optional(),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Maximum number of matching coins to return after filtering and sorting."),
    }),
    execute: async ({
      coinIds,
      minPrice,
      maxPrice,
      minChange24h,
      maxChange24h,
      minChange7d,
      maxChange7d,
      minMarketCap,
      maxMarketCap,
      minVolume,
      maxVolume,
      minRank,
      maxRank,
      sortBy = "rank",
      sortDirection = "asc",
      limit,
    }) => {
      const allCoins = (await fetchAllCoins()) as Array<{
        id: string;
        name: string;
        price: number;
        change24h: number;
        change7d: number;
        marketCapRaw: number;
        volumeRaw: number;
        rank: number;
      }>;

      const requestedCoinIds = coinIds ? new Set(coinIds) : undefined;
      const filtered = allCoins.filter((coin) => {
        if (requestedCoinIds && !requestedCoinIds.has(coin.id)) return false;
        if (minPrice !== undefined && coin.price < minPrice) return false;
        if (maxPrice !== undefined && coin.price > maxPrice) return false;
        if (minChange24h !== undefined && coin.change24h < minChange24h) return false;
        if (maxChange24h !== undefined && coin.change24h > maxChange24h) return false;
        if (minChange7d !== undefined && coin.change7d < minChange7d) return false;
        if (maxChange7d !== undefined && coin.change7d > maxChange7d) return false;
        if (minMarketCap !== undefined && coin.marketCapRaw < minMarketCap) return false;
        if (maxMarketCap !== undefined && coin.marketCapRaw > maxMarketCap) return false;
        if (minVolume !== undefined && coin.volumeRaw < minVolume) return false;
        if (maxVolume !== undefined && coin.volumeRaw > maxVolume) return false;
        if (minRank !== undefined && coin.rank < minRank) return false;
        if (maxRank !== undefined && coin.rank > maxRank) return false;
        return true;
      });

      const direction = sortDirection === "asc" ? 1 : -1;
      filtered.sort((left, right) => {
        const leftValue =
          sortBy === "marketCap"
            ? left.marketCapRaw
            : sortBy === "volume"
              ? left.volumeRaw
              : left[sortBy];
        const rightValue =
          sortBy === "marketCap"
            ? right.marketCapRaw
            : sortBy === "volume"
              ? right.volumeRaw
              : right[sortBy];

        if (typeof leftValue === "string" && typeof rightValue === "string") {
          return leftValue.localeCompare(rightValue) * direction;
        }

        return ((Number(leftValue) || 0) - (Number(rightValue) || 0)) * direction;
      });

      return {
        items: limit ? filtered.slice(0, limit) : filtered,
        totalMatches: filtered.length,
      };
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

  get_top_movers_7d: tool({
    description:
      "Get the top 10 gaining and top 10 losing coins by 7-day price change percentage. Use this when the user asks about weekly performance, 7-day movers, or best/worst performers over the past week.",
    inputSchema: z.object({}),
    execute: async () => {
      const res = await fetch(`${API_URL}/api/marketstats/top-movers-7d`);
      if (!res.ok) throw new Error("Failed to fetch 7-day top movers");
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

/**
 * Fetches a full data snapshot from every API endpoint in parallel at the
 * start of a conversation.  Failed individual sources are silently omitted so
 * a single unavailable endpoint never blocks the rest.
 */
export async function fetchInitialSnapshot(): Promise<Record<string, unknown>> {
  const [allCoins, marketSummary, topMovers, topMovers7d, topByVolume, watchlist] =
    await Promise.allSettled([
      fetchAllCoins(),
      fetch(`${API_URL}/api/marketstats`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API_URL}/api/marketstats/top-movers`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API_URL}/api/marketstats/top-movers-7d`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API_URL}/api/marketstats/top-by-volume?limit=10`).then((r) =>
        r.ok ? r.json() : null
      ),
      fetch(`${API_URL}/api/watchlist`).then((r) => (r.ok ? r.json() : null)),
    ]);

  const snapshot: Record<string, unknown> = {};
  if (allCoins.status === "fulfilled" && allCoins.value != null)
    snapshot.allCoins = allCoins.value;
  if (marketSummary.status === "fulfilled" && marketSummary.value != null)
    snapshot.marketSummary = marketSummary.value;
  if (topMovers.status === "fulfilled" && topMovers.value != null)
    snapshot.topMovers = topMovers.value;
  if (topMovers7d.status === "fulfilled" && topMovers7d.value != null)
    snapshot.topMovers7d = topMovers7d.value;
  if (topByVolume.status === "fulfilled" && topByVolume.value != null)
    snapshot.topByVolume = topByVolume.value;
  if (watchlist.status === "fulfilled" && watchlist.value != null)
    snapshot.watchlist = watchlist.value;
  return snapshot;
}
