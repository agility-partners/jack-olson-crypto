import { createOpenAI } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { z } from "zod";

const API_URL = process.env.API_URL ?? "http://localhost:8080";
const GITHUB_MODELS_BASE_URL = "https://models.github.ai/inference";
const GITHUB_MODELS_DEFAULT_MODEL = "openai/gpt-4.1";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();
    const githubModelsApiKey =
      process.env.GITHUB_MODELS_TOKEN ?? process.env.GITHUB_TOKEN;

    if (!githubModelsApiKey) {
      throw new Error(
        "Missing GitHub Models token. Set GITHUB_MODELS_TOKEN or GITHUB_TOKEN with a PAT that has the models scope.",
      );
    }

    const githubModels = createOpenAI({
      name: "github-models",
      baseURL: GITHUB_MODELS_BASE_URL,
      apiKey: githubModelsApiKey,
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    const result = streamText({
      model: githubModels.chat(
        process.env.GITHUB_MODELS_MODEL ?? GITHUB_MODELS_DEFAULT_MODEL,
      ),
      system:
        "You are a warehouse-aware crypto assistant. Use tools for factual data, never invent market values, and explicitly say when data is unavailable.",
      messages: await convertToModelMessages(messages),
      stopWhen: isStepCount(5),
      tools: {
        getMarketSummary: {
          description:
            "Get the latest market summary from the warehouse-backed API.",
          inputSchema: z.object({}),
          execute: async () => {
            try {
              const response = await fetch(`${API_URL}/api/marketstats`, {
                cache: "no-store",
              });

              if (!response.ok) {
                return {
                  ok: false,
                  error: "market_summary_unavailable",
                  status: response.status,
                } as const;
              }

              const data = await response.json();

              return {
                ok: true,
                source: "api/marketstats",
                fetchedAt: new Date().toISOString(),
                data,
              } as const;
            } catch {
              return {
                ok: false,
                error: "market_summary_unavailable",
              } as const;
            }
          },
        },
      },
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
