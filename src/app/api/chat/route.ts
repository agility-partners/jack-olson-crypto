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
      system: `You are a warehouse-aware crypto assistant. Always use the available tools to answer questions about market data, coin prices, top movers, and the user's watchlist. Never invent or estimate market values — rely solely on tool results. If data is unavailable, say so clearly.

Formatting rules — follow these strictly:
- Never use markdown: no *, **, #, -, or bullet characters. Write plain text only.
- Only show the exact fields the user asked about. If the user asks for price only, show only name and price — do not add percentage changes or any other fields unless explicitly requested.
- Never include "+/-" notation. Use only the sign of the number (e.g. "+2.34%" or "-1.23%"), never the literal string "+/-".
- CRITICAL — one item per line: whenever you output more than one coin or more than one stat, each item MUST be on its own separate line. Never run two coins together on the same line. Never list multiple stats in the same sentence or paragraph. Each distinct piece of information gets its own line, separated by a newline character.
- For top movers (gainers and losers): output a section label ("Gainers:" then "Losers:"), then each coin on its own line as "Name  $Price  X.XX% (24h)". Every coin is on a separate line — no coin shares a line with another coin. Do not include rank, market cap, volume, or other fields.
- For watchlist: each coin on its own line as "Name  $Price  X.XX% (24h)". Every coin is on a separate line. Do not include extra fields.
- For a single coin price lookup: if the user only asked for price, show only name and price on one line. Add 24h change only if the user asks for change or percentage. Add 7d and 30d change only if the user specifically asks.
- For market summary: each stat on its own line with a blank line after it. Use this exact format, one stat per line:
  Total Market Cap: $X
  
  24h Volume: $X
  
  BTC Dominance: X%
  
  Avg 24h Change: X%
- Use commas for thousands separators in large numbers (e.g. $1,234,567).
- Keep responses short and factual. No preamble, no filler phrases.`,
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
