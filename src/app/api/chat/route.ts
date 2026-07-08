import { createOpenAI } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { SYSTEM_PROMPT, tools } from "./tools";

const github = createOpenAI({
  baseURL: "https://models.github.ai/inference",
  apiKey: process.env.GITHUB_TOKEN,
});

const MODEL = process.env.GITHUB_MODELS_MODEL ?? "openai/gpt-4o-mini";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: github.chat(MODEL),
      system: SYSTEM_PROMPT,
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
