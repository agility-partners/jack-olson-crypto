import { createOpenAI } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  tool,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { z } from "zod";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

const github = createOpenAI({
  baseURL: "https://models.github.ai/inference",
  apiKey: process.env.GITHUB_TOKEN,
});

const MODEL = process.env.GITHUB_MODELS_MODEL ?? "openai/gpt-4o-mini";

export const maxDuration = 30;

const tools = {
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
            if (!res.ok) return { id, error: "not found" };
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

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: github.chat(MODEL),
      system:
        "You are a warehouse-aware crypto assistant. Always use the available tools to answer questions about market data, coin prices, top movers, and the user's watchlist. Never invent or estimate market values — rely solely on tool results. If data is unavailable, say so clearly.",
      messages: await convertToModelMessages(messages, { tools }),
      tools,
      stopWhen: isStepCount(5),
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        onError: (error) => {
          const message =
            error instanceof Error ? error.message : String(error);
          console.error("[chat/route] stream error:", message);
          return message;
        },
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[chat/route] handler error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
