import { render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeAll, describe, expect, it, vi } from "vitest";
import AssistantPageClient from "./AssistantPageClient";

vi.mock("@ai-sdk/react", () => ({
  useChat: vi.fn(),
}));

vi.mock("ai", () => ({
  DefaultChatTransport: class {},
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
    await waitFor(() => {
      const steerButtons = screen
        .getAllByRole("button")
        .filter((button) => button.getAttribute("aria-label") !== "Send message");
      expect(steerButtons).toHaveLength(3);
    });
  });

  it("avoids random suggestion selection during server render", async () => {
    const { useChat } = await import("@ai-sdk/react");
    const randomSpy = vi.spyOn(Math, "random");

    vi.mocked(useChat).mockReturnValue({
      messages: [],
      sendMessage: vi.fn(),
      status: "ready",
      error: undefined,
    });

    const html = renderToString(<AssistantPageClient />);

    expect(randomSpy).not.toHaveBeenCalled();
    expect(html).toContain("What are the top gainers and losers today?");
    expect(html).toContain("Show me the current market summary");
    expect(html).toContain("Bitcoin and Ethereum?");

    randomSpy.mockRestore();
  });
});
