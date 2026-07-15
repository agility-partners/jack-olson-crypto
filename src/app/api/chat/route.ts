import { createAnthropic } from "@ai-sdk/anthropic";
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
  inferAssistantMessageMetadataFromHistory,
} from "./citations";
import { SYSTEM_PROMPT, tools, fetchInitialSnapshot } from "./tools";

const anthropic = createAnthropic({
  baseURL: process.env.ANTHROPIC_BASE_URL,
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL =
  process.env.CLAUDE_MID_DEPLOYMENT ?? "claude-sonnet-4-6";
const MAX_TOOL_STEPS = 7;

export const maxDuration = 30;

function toClientErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: AssistantChatMessage[] } = await req.json();
    const toolResults: Array<{ toolName: string; output: unknown }> = [];
    const fallbackMetadata = inferAssistantMessageMetadataFromHistory(messages);

    // On the first user message, pre-fetch all data sources so the model has
    // the full market snapshot in context before it reasons about the query.
    const isFirstMessage = messages.length === 1;
    let systemPrompt = SYSTEM_PROMPT;
    if (isFirstMessage) {
      try {
        const snapshot = await fetchInitialSnapshot();
        if (Object.keys(snapshot).length > 0) {
          systemPrompt = `${SYSTEM_PROMPT}\n\n## Pre-fetched Market Snapshot\n${JSON.stringify(snapshot)}`;
        }
      } catch {
        // snapshot fetch failed; the model will fall back to tool-calling
      }
    }

    const result = streamText({
      model: anthropic(MODEL),
      system: systemPrompt,
      messages: await convertToModelMessages(messages, { tools }),
      tools,
      stopWhen: isStepCount(MAX_TOOL_STEPS),
      onStepEnd: ({ toolResults: stepToolResults }) => {
        toolResults.push(
          ...stepToolResults.map(({ toolName, output }) => ({
            toolName,
            output,
          }))
        );
      },
    });

    return createUIMessageStreamResponse({
      stream: createUIMessageStream<AssistantChatMessage>({
        execute: async ({ writer }) => {
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
                    ? buildAssistantMessageMetadata(toolResults) ?? fallbackMetadata
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
