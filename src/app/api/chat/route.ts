import { createOpenAI } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageChunk,
} from "ai";
import {
  buildAssistantMessageMetadata,
  type AssistantChatMessage,
} from "./citations";
import { SYSTEM_PROMPT, tools } from "./tools";

const github = createOpenAI({
  baseURL: "https://models.github.ai/inference",
  apiKey: process.env.GITHUB_TOKEN,
});

const MODEL = process.env.GITHUB_MODELS_MODEL ?? "openai/gpt-4o-mini";

export const maxDuration = 30;

function toClientErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: AssistantChatMessage[] } = await req.json();

    const result = streamText({
      model: github.chat(MODEL),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages, { tools }),
      tools,
      stopWhen: isStepCount(5),
    });

    return createUIMessageStreamResponse({
      stream: createUIMessageStream<AssistantChatMessage>({
        execute: async ({ writer }) => {
          const toolResults: Array<{ toolName: string; output: unknown }> = [];

          for await (const part of result.stream) {
            if (part.type === "tool-result") {
              toolResults.push({
                toolName: part.toolName,
                output: part.output,
              });
            }

            const chunk = toUIMessageChunk<typeof tools, AssistantChatMessage>(
              part,
              {
                tools,
                onError: toClientErrorMessage,
                messageMetadata:
                  part.type === "finish"
                    ? buildAssistantMessageMetadata(toolResults)
                    : undefined,
              }
            );

            if (chunk) {
              writer.write(chunk);
            }
          }
        },
        onError: (error) => {
          const message = toClientErrorMessage(error);
          console.error("[chat/route] stream error:", message);
          return message;
        },
      }),
    });
  } catch (error) {
    const message = toClientErrorMessage(error);
    console.error("[chat/route] handler error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
