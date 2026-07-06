import { convertToModelMessages, streamText, tool, type UIMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const API_BASE_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const MODEL_ID = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

type ToolSuccess<T> = {
  available: true;
  source: string;
  freshness: string;
  data: T;
};

type ToolFailure = {
  available: false;
  source: string;
  freshness: string;
  error: string;
};

async function fetchWarehouseData<T>(path: string): Promise<ToolSuccess<T> | ToolFailure> {
  const freshness = new Date().toISOString();
  const source = `warehouse-api:${path}`;

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" });
    if (!response.ok) {
      return {
        available: false,
        source,
        freshness,
        error: `upstream_${response.status}`,
      };
    }

    const data = (await response.json()) as T;
    return {
      available: true,
      source,
      freshness,
      data,
    };
  } catch {
    return {
      available: false,
      source,
      freshness,
      error: "network_failure",
    };
  }
}

const systemPrompt = `
You are the Warehouse-Aware Crypto Assistant for a production product surface.

Rules:
1) Never invent or estimate prices, dominance, movers, or watchlist values.
2) Use tools for factual crypto data questions.
3) If a tool returns { available: false }, clearly say the data is unavailable right now and do not guess.
4) Keep responses factual and descriptive only. Never give buy/sell recommendations.
5) In every factual answer, include:
   - Sources: list the tool source values used.
   - Freshness: include freshness timestamps from tool output.
`.trim();

type CoinSnapshot = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  rank: number;
  marketCap: string;
  volume: string;
};

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      {
        error: "ai_not_configured",
        message: "OPENAI_API_KEY is required for /api/chat",
      },
      { status: 500 },
    );
  }

  let messages: UIMessage[];
  try {
    const body = await request.json() as { messages?: UIMessage[] };
    if (!Array.isArray(body.messages)) {
      return Response.json({ error: "invalid_request", message: "messages array is required" }, { status: 400 });
    }
    messages = body.messages;
  } catch {
    return Response.json({ error: "invalid_request", message: "request body must be valid JSON" }, { status: 400 });
  }

  const result = streamText({
    model: openai(MODEL_ID),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    maxSteps: 5,
    tools: {
      getMarketSummary: tool({
        description: "Get latest market-wide warehouse summary values.",
        inputSchema: z.object({}),
        execute: async () => fetchWarehouseData("/api/marketstats"),
      }),
      getTopMovers: tool({
        description: "Get top gainers and losers from warehouse-backed market stats.",
        inputSchema: z.object({
          limit: z.number().int().min(1).max(10).default(5),
          category: z.enum(["gainers", "losers", "both"]).default("both"),
        }),
        execute: async ({ limit, category }) => {
          const moversResult = await fetchWarehouseData<{
            gainers: CoinSnapshot[];
            losers: CoinSnapshot[];
          }>("/api/marketstats/top-movers");

          if (!moversResult.available) {
            return moversResult;
          }

          const data = moversResult.data;
          const sliced = {
            gainers: data.gainers.slice(0, limit),
            losers: data.losers.slice(0, limit),
          };

          return {
            available: true,
            source: moversResult.source,
            freshness: moversResult.freshness,
            data: category === "both" ? sliced : { [category]: sliced[category] },
          };
        },
      }),
      getCoinBySymbol: tool({
        description: "Get latest warehouse-backed coin snapshot by ticker symbol (e.g., BTC, ETH).",
        inputSchema: z.object({
          symbol: z.string().trim().min(2).max(10),
        }),
        execute: async ({ symbol }) => {
          const symbolUpper = symbol.toUpperCase();
          const coinsResult = await fetchWarehouseData<CoinSnapshot[]>("/api/coins");
          if (!coinsResult.available) {
            return coinsResult;
          }

          const coin = coinsResult.data.find((entry) => entry.symbol.toUpperCase() === symbolUpper);
          if (!coin) {
            return {
              available: false,
              source: coinsResult.source,
              freshness: coinsResult.freshness,
              error: `coin_not_found:${symbolUpper}`,
            };
          }

          return {
            available: true,
            source: coinsResult.source,
            freshness: coinsResult.freshness,
            data: coin,
          };
        },
      }),
      getWatchlist: tool({
        description: "Get current user watchlist from warehouse-backed API.",
        inputSchema: z.object({}),
        execute: async () => fetchWarehouseData<CoinSnapshot[]>("/api/watchlist"),
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
