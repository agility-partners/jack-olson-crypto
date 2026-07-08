import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import AssistantPageClient from "./AssistantPageClient";

vi.mock("@ai-sdk/react", () => ({
  useChat: vi.fn(),
}));

vi.mock("ai", () => ({
  DefaultChatTransport: class {
    constructor(_options: unknown) {}
  },
}));

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe("AssistantPageClient", () => {
  it("renders assistant sources only in the footer metadata line", async () => {
    const { useChat } = await import("@ai-sdk/react");

    vi.mocked(useChat).mockReturnValue({
      messages: [
        {
          id: "assistant-1",
          role: "assistant",
          parts: [
            {
              type: "text",
              text: "Bitcoin $65,000 (-2.79%)\nSources: get_watchlist as of 2024-01-15T10:30:00Z",
            },
          ],
          metadata: {
            sourcesLine: "Sources: get_watchlist as of 2024-01-15T10:30:00Z",
          },
        },
      ],
      sendMessage: vi.fn(),
      status: "ready",
      error: undefined,
    });

    render(<AssistantPageClient />);

    expect(screen.getByText("Bitcoin $65,000 (-2.79%)")).toBeInTheDocument();
    expect(
      screen.getByText("Sources: get_watchlist as of 2024-01-15T10:30:00Z")
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Sources:/)).toHaveLength(1);
  });
});
