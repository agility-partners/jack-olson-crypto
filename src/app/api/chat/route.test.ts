import { beforeEach, describe, expect, it, vi } from "vitest";

const mockConvertToModelMessages = vi.fn(async () => []);
const mockStreamText = vi.fn();
type MockChunk = { type: string; metadata?: { sourcesLine?: string }; text?: string };

const mockCreateUIMessageStream = vi.fn(
  ({
    execute,
  }: {
    execute: (options: { writer: { write: (chunk: MockChunk) => void } }) => Promise<void>;
  }) => {
    const chunks: MockChunk[] = [];

    const stream = execute({
      writer: {
        write: (chunk: MockChunk) => {
          chunks.push(chunk);
        },
      },
    }).then(() => chunks);

    return stream;
  }
);

const mockCreateUIMessageStreamResponse = vi.fn(
  ({ stream }: { stream: Promise<MockChunk[]> }) => ({ stream })
);
const mockToUIMessageChunk = vi.fn(
  (
    part: { type: string; textDelta?: string },
    { messageMetadata }: { messageMetadata?: { sourcesLine?: string } }
  ) => {
    if (part.type === "text-delta") {
      return { type: "text", text: part.textDelta };
    }

    if (part.type === "finish") {
      return { type: "finish", metadata: messageMetadata };
    }

    return { type: part.type };
  }
);

vi.mock("@ai-sdk/anthropic", () => ({
  createAnthropic: vi.fn(() => vi.fn()),
}));

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();

  return {
    ...actual,
    convertToModelMessages: mockConvertToModelMessages,
    createUIMessageStream: mockCreateUIMessageStream,
    createUIMessageStreamResponse: mockCreateUIMessageStreamResponse,
    isStepCount: vi.fn((count: number) => count),
    streamText: mockStreamText,
    toUIMessageChunk: mockToUIMessageChunk,
  };
});

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("includes sources metadata from onStepEnd tool results even when the stream has no tool-result part", async () => {
    mockStreamText.mockImplementation(
      ({
        onStepEnd,
      }: {
        onStepEnd?: (event: {
          toolResults: Array<{ toolName: string; output: unknown }>;
        }) => void;
      }) => {
        onStepEnd?.({
          toolResults: [
            {
              toolName: "get_market_summary",
              output: { dataAsOf: "2024-01-15T10:30:00Z" },
            },
          ],
        });

        return {
          stream: (async function* () {
            yield { type: "start" };
            yield { type: "text-delta", textDelta: "Market summary" };
            yield { type: "finish" };
          })(),
        };
      }
    );

    const { POST } = await import("./route");
    const response = (await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: [] }),
        headers: { "Content-Type": "application/json" },
      })
    )) as { stream: Promise<Array<{ type: string; metadata?: { sourcesLine?: string } }>> };

    const chunks = await response.stream;
    const finishChunk = chunks.find((chunk) => chunk.type === "finish");

    expect(finishChunk?.metadata?.sourcesLine).toBe(
      "Sources: get_market_summary as of Jan 15, 2024, 5:30 AM EST"
    );
  });

  it("falls back to relevant prior citations when a follow-up answer streams without tool results", async () => {
    mockStreamText.mockReturnValue({
      stream: (async function* () {
        yield { type: "start" };
        yield {
          type: "text-delta",
          textDelta:
            "Based on the top movers data already retrieved, none of the tracked losers are down more than 5% today.",
        };
        yield { type: "finish" };
      })(),
    });

    const { POST } = await import("./route");
    const response = (await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [
            {
              id: "assistant-top-movers",
              role: "assistant",
              parts: [{ type: "text", text: "Earlier top movers answer" }],
              metadata: {
                citations: [
                  {
                    toolName: "get_top_movers",
                    dataAsOfValues: ["2024-01-15T10:30:00Z"],
                    hasUnavailableDataAsOf: false,
                  },
                ],
                sourcesLine:
                  "Sources: get_top_movers as of Jan 15, 2024, 5:30 AM EST",
              },
            },
            {
              id: "assistant-watchlist",
              role: "assistant",
              parts: [{ type: "text", text: "Watchlist answer" }],
              metadata: {
                citations: [
                  {
                    toolName: "get_watchlist",
                    dataAsOfValues: ["2024-01-15T10:35:00Z"],
                    hasUnavailableDataAsOf: false,
                  },
                ],
                sourcesLine:
                  "Sources: get_watchlist as of Jan 15, 2024, 5:35 AM EST",
              },
            },
            {
              id: "user-follow-up",
              role: "user",
              parts: [
                {
                  type: "text",
                  text: "Which coins are down more than 5% today?",
                },
              ],
            },
          ],
        }),
        headers: { "Content-Type": "application/json" },
      })
    )) as { stream: Promise<Array<{ type: string; metadata?: { sourcesLine?: string } }>> };

    const chunks = await response.stream;
    const finishChunk = chunks.find((chunk) => chunk.type === "finish");

    expect(finishChunk?.metadata?.sourcesLine).toBe(
      "Sources: get_top_movers as of Jan 15, 2024, 5:30 AM EST"
    );
  });
});
