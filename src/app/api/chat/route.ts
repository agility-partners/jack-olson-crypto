import { streamText, tool, isStepCount, convertToModelMessages } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const SYSTEM_PROMPT = `You are a crypto market assistant powered by a live warehouse-backed data pipeline.

RULES:
- Always call the appropriate tool(s) to answer questions about coin prices, market data, or top movers. Never invent or estimate prices.
- If a tool returns an error or the data is unavailable, say so explicitly — do not guess.
- Include the freshness context from the data (e.g. when it was last updated) when available.
- Refuse requests for financial advice. You may describe data, trends, and facts, but do not recommend buying or selling.
- Keep answers concise, factual, and grounded in the tool results.
- This is an educational tool — remind users of that context when appropriate.`;

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8081";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4.1-mini"),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    stopWhen: isStepCount(5),
    tools: {
      getMarketSummary: tool({
        description:
          "Get the latest overall market summary including total market cap, 24h volume, BTC dominance, and average 24h change. Call this for macro market questions.",
        inputSchema: z.object({}),
        execute: async () => {
          const res = await fetch(`${API_BASE}/api/marketstats`);
          if (!res.ok) {
            return { error: "market_summary_unavailable", status: res.status };
          }
          return res.json();
        },
      }),

      getTopMovers: tool({
        description:
          "Get the top gaining and losing coins in the last 24 hours. Call this for questions about best/worst performers, top gainers, or biggest losers.",
        inputSchema: z.object({}),
        execute: async () => {
          const res = await fetch(`${API_BASE}/api/marketstats/top-movers`);
          if (!res.ok) {
            return { error: "top_movers_unavailable", status: res.status };
          }
          return res.json();
        },
      }),

      getCoinBySymbol: tool({
        description:
          "Get current price and market data for a specific coin by its ticker symbol (e.g. 'btc', 'eth', 'sol'). Call this for questions about a specific coin.",
        inputSchema: z.object({
          symbol: z
            .string()
            .min(2)
            .max(10)
            .describe(
              "Ticker symbol of the coin, e.g. 'btc', 'eth'. Will be lowercased automatically."
            ),
        }),
        execute: async ({ symbol }) => {
          const res = await fetch(
            `${API_BASE}/api/coins/${symbol.toLowerCase()}`
          );
          if (res.status === 404) {
            return { error: "coin_not_found", symbol };
          }
          if (!res.ok) {
            return { error: "coin_fetch_failed", symbol, status: res.status };
          }
          return res.json();
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
