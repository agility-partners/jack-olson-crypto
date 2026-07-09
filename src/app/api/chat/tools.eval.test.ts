/**
 * Golden eval suite for the warehouse-aware crypto assistant.
 *
 * These tests verify the deterministic, tool-level contract of the assistant:
 *   - Tool execute functions return correct data (or safe errors) from the API
 *   - The system prompt contains all required safety guardrails
 *   - Edge cases (unknown coin, fetch failure) are handled gracefully
 *
 * They do NOT spin up the LLM — LLM routing decisions are verified separately
 * through manual golden-question runs described at the bottom of this file.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildAssistantMessageMetadata,
  buildToolCitations,
  inferAssistantMessageMetadataFromHistory,
} from "./citations";
import { SYSTEM_PROMPT, tools } from "./tools";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFetchOk(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function makeFetchFail(status = 404): Response {
  return new Response(null, { status });
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// 1. System prompt guardrails
// ---------------------------------------------------------------------------

describe("SYSTEM_PROMPT guardrails", () => {
  it("instructs the assistant to always use tools for facts", () => {
    expect(SYSTEM_PROMPT).toMatch(/always use the available tools/i);
  });

  it("instructs the assistant never to invent or estimate market values", () => {
    expect(SYSTEM_PROMPT).toMatch(/never invent or estimate market values/i);
  });

  it("instructs the assistant to refuse financial advice requests", () => {
    expect(SYSTEM_PROMPT).toMatch(/financial advice/i);
    expect(SYSTEM_PROMPT).toMatch(/cannot offer financial advice|decline|cannot.*advice/i);
  });

  it("instructs the assistant to cite data freshness via dataAsOf", () => {
    expect(SYSTEM_PROMPT).toMatch(/dataAsOf/);
  });

  it('instructs the assistant not to duplicate the UI-managed "Sources:" line', () => {
    expect(SYSTEM_PROMPT).toMatch(/UI renders the final "Sources:" footer separately/i);
    expect(SYSTEM_PROMPT).toMatch(/Do not add a "Sources:" line/i);
  });

  it("instructs the assistant to format coin mentions with price and percent change in parentheses", () => {
    expect(SYSTEM_PROMPT).toMatch(/Whenever you mention a coin together with its current price/i);
    expect(SYSTEM_PROMPT).toMatch(/Name \$Price \(\+\/-X\.XX%\)/);
    expect(SYSTEM_PROMPT).toMatch(/Never include "\(24h\)"/);
  });

  it("instructs the assistant to say data is unavailable rather than guessing on tool failure", () => {
    expect(SYSTEM_PROMPT).toMatch(/temporarily unavailable/i);
  });

  it("instructs the assistant to say explicitly when a coin is not found", () => {
    expect(SYSTEM_PROMPT).toMatch(/not found|don.t have data/i);
  });
});

// ---------------------------------------------------------------------------
// 2. Tool schemas
// ---------------------------------------------------------------------------

describe("tool schemas", () => {
  it("get_coin_prices has an optional coinIds array parameter", () => {
    const schema = tools.get_coin_prices.inputSchema;
    // Zod schema: coinIds optional array of strings
    const result = schema.safeParse({});
    expect(result.success).toBe(true);

    const withIds = schema.safeParse({ coinIds: ["bitcoin", "ethereum"] });
    expect(withIds.success).toBe(true);

    const invalid = schema.safeParse({ coinIds: "bitcoin" }); // string, not array
    expect(invalid.success).toBe(false);
  });

  it("get_market_summary accepts an empty object", () => {
    const schema = tools.get_market_summary.inputSchema;
    expect(schema.safeParse({}).success).toBe(true);
  });

  it("get_top_movers accepts an empty object", () => {
    const schema = tools.get_top_movers.inputSchema;
    expect(schema.safeParse({}).success).toBe(true);
  });

  it("get_watchlist accepts an empty object", () => {
    const schema = tools.get_watchlist.inputSchema;
    expect(schema.safeParse({}).success).toBe(true);
  });

  it("get_top_by_volume has an optional numeric limit parameter", () => {
    const schema = tools.get_top_by_volume.inputSchema;
    expect(schema.safeParse({}).success).toBe(true);
    expect(schema.safeParse({ limit: 5 }).success).toBe(true);
    expect(schema.safeParse({ limit: 0 }).success).toBe(false);
    expect(schema.safeParse({ limit: 101 }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. Golden question: "What are the top gainers and losers today?"
//    → must call get_top_movers tool
// ---------------------------------------------------------------------------

describe("get_top_movers tool", () => {
  it("returns warehouse top-mover data on success", async () => {
    const mockData = {
      gainers: [{ id: "pepe", name: "Pepe", price: 0.00001, change24h: 15.5 }],
      losers: [{ id: "bitcoin", name: "Bitcoin", price: 68000, change24h: -3.2 }],
      dataAsOf: "2024-01-15T10:30:00Z",
    };
    vi.mocked(fetch).mockResolvedValueOnce(makeFetchOk(mockData));

    const result = await tools.get_top_movers.execute({}, { messages: [], toolCallId: "" });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/marketstats/top-movers")
    );
    expect(result).toMatchObject({ gainers: expect.any(Array), dataAsOf: "2024-01-15T10:30:00Z" });
  });

  it("throws a descriptive error when the API is unreachable", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeFetchFail(503));

    await expect(
      tools.get_top_movers.execute({}, { messages: [], toolCallId: "" })
    ).rejects.toThrow("Failed to fetch top movers");
  });
});

// ---------------------------------------------------------------------------
// 4. Golden question: "What's the price of Bitcoin and Ethereum?"
//    → must call get_coin_prices with ['bitcoin', 'ethereum']
// ---------------------------------------------------------------------------

describe("get_coin_prices tool", () => {
  it("fetches and returns data for each requested coin ID", async () => {
    const btcData = { id: "bitcoin", name: "Bitcoin", price: 68000, dataAsOf: "2024-01-15T10:30:00Z" };
    const ethData = { id: "ethereum", name: "Ethereum", price: 3500, dataAsOf: "2024-01-15T10:30:00Z" };
    vi.mocked(fetch)
      .mockResolvedValueOnce(makeFetchOk(btcData))
      .mockResolvedValueOnce(makeFetchOk(ethData));

    const result = await tools.get_coin_prices.execute(
      { coinIds: ["bitcoin", "ethereum"] },
      { messages: [], toolCallId: "" }
    );

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/coins/bitcoin"));
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/coins/ethereum"));
    expect(result).toEqual([btcData, ethData]);
  });

  it("returns all coins when coinIds is omitted", async () => {
    const allCoins = [{ id: "bitcoin" }, { id: "ethereum" }];
    vi.mocked(fetch).mockResolvedValueOnce(makeFetchOk(allCoins));

    const result = await tools.get_coin_prices.execute(
      {},
      { messages: [], toolCallId: "" }
    );

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/coins"));
    expect(result).toEqual(allCoins);
  });

  it("returns all coins when coinIds is an empty array", async () => {
    const allCoins = [{ id: "bitcoin" }];
    vi.mocked(fetch).mockResolvedValueOnce(makeFetchOk(allCoins));

    const result = await tools.get_coin_prices.execute(
      { coinIds: [] },
      { messages: [], toolCallId: "" }
    );

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/coins"));
    expect(result).toEqual(allCoins);
  });

  // Eval: unknown coin → graceful not-found response (no crash, no hallucination)
  it("returns a coin_not_found error object for unknown coin IDs without throwing", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeFetchFail(404));

    const result = await tools.get_coin_prices.execute(
      { coinIds: ["ghost-coin-xyz"] },
      { messages: [], toolCallId: "" }
    );

    expect(result).toEqual([{ id: "ghost-coin-xyz", error: "coin_not_found" }]);
  });

  it("handles partial failures gracefully (one hit, one miss)", async () => {
    const btcData = { id: "bitcoin", price: 68000 };
    vi.mocked(fetch)
      .mockResolvedValueOnce(makeFetchOk(btcData))
      .mockResolvedValueOnce(makeFetchFail(404));

    const result = await tools.get_coin_prices.execute(
      { coinIds: ["bitcoin", "ghost-coin-xyz"] },
      { messages: [], toolCallId: "" }
    );

    expect(result).toEqual([btcData, { id: "ghost-coin-xyz", error: "coin_not_found" }]);
  });

  it("throws when the bulk /api/coins endpoint fails", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeFetchFail(500));

    await expect(
      tools.get_coin_prices.execute({}, { messages: [], toolCallId: "" })
    ).rejects.toThrow("Failed to fetch coins");
  });
});

// ---------------------------------------------------------------------------
// 5. Golden question: "Show me the current market summary"
//    → must call get_market_summary tool
// ---------------------------------------------------------------------------

describe("get_market_summary tool", () => {
  it("returns warehouse market stats including dataAsOf", async () => {
    const mockStats = {
      totalMarketCap: "$2.5T",
      volume24h: "$85B",
      btcDominance: "52.3%",
      avgChange24h: "↑ 1.2%",
      dataAsOf: "2024-01-15T10:30:00Z",
    };
    vi.mocked(fetch).mockResolvedValueOnce(makeFetchOk(mockStats));

    const result = await tools.get_market_summary.execute({}, { messages: [], toolCallId: "" });

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/marketstats"));
    expect(result).toMatchObject({ dataAsOf: "2024-01-15T10:30:00Z" });
  });

  it("throws a descriptive error when the API is unreachable", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeFetchFail(503));

    await expect(
      tools.get_market_summary.execute({}, { messages: [], toolCallId: "" })
    ).rejects.toThrow("Failed to fetch market stats");
  });
});

// ---------------------------------------------------------------------------
// 6. Golden question: "What's in my watchlist?"
//    → must call get_watchlist tool
// ---------------------------------------------------------------------------

describe("get_watchlist tool", () => {
  it("returns watchlist coins with live price data", async () => {
    const mockWatchlist = [
      { id: "bitcoin", name: "Bitcoin", price: 68000, change24h: 2.1 },
      { id: "ethereum", name: "Ethereum", price: 3500, change24h: -1.5 },
    ];
    vi.mocked(fetch).mockResolvedValueOnce(makeFetchOk(mockWatchlist));

    const result = await tools.get_watchlist.execute({}, { messages: [], toolCallId: "" });

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/watchlist"));
    expect(result).toEqual(mockWatchlist);
  });

  it("throws a descriptive error when the API is unreachable", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeFetchFail(503));

    await expect(
      tools.get_watchlist.execute({}, { messages: [], toolCallId: "" })
    ).rejects.toThrow("Failed to fetch watchlist");
  });
});

// ---------------------------------------------------------------------------
// 7. Golden question: "Show me the top 5 coins by trading volume."
//    → must call get_top_by_volume tool
// ---------------------------------------------------------------------------

describe("get_top_by_volume tool", () => {
  it("fetches top coins by volume with the given limit", async () => {
    const mockData = {
      items: [
        { id: "tether", name: "Tether", price: 1.0, volume: "$48.5B", volumeRaw: 48500000000, change24h: 0.01, rank: 1 },
        { id: "bitcoin", name: "Bitcoin", price: 68000, volume: "$35.2B", volumeRaw: 35200000000, change24h: 2.1, rank: 2 },
      ],
      dataAsOf: "2024-01-15T10:30:00Z",
    };
    vi.mocked(fetch).mockResolvedValueOnce(makeFetchOk(mockData));

    const result = await tools.get_top_by_volume.execute(
      { limit: 5 },
      { messages: [], toolCallId: "" }
    );

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/marketstats/top-by-volume?limit=5")
    );
    expect(result).toMatchObject({ items: expect.any(Array), dataAsOf: "2024-01-15T10:30:00Z" });
  });

  it("defaults to limit=5 when no limit is provided", async () => {
    const mockData = { items: [], dataAsOf: null };
    vi.mocked(fetch).mockResolvedValueOnce(makeFetchOk(mockData));

    await tools.get_top_by_volume.execute({}, { messages: [], toolCallId: "" });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/marketstats/top-by-volume?limit=5")
    );
  });

  it("throws a descriptive error when the API is unreachable", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeFetchFail(503));

    await expect(
      tools.get_top_by_volume.execute({ limit: 5 }, { messages: [], toolCallId: "" })
    ).rejects.toThrow("Failed to fetch top coins by volume");
  });
});

// ---------------------------------------------------------------------------
// 7. Tool descriptions — ensure the model has enough context to pick correctly
// ---------------------------------------------------------------------------

describe("tool descriptions", () => {
  it("get_top_movers description mentions gainers and losers", () => {
    expect(tools.get_top_movers.description).toMatch(/gain/i);
    expect(tools.get_top_movers.description).toMatch(/los/i);
  });

  it("get_market_summary description mentions BTC dominance", () => {
    expect(tools.get_market_summary.description).toMatch(/btc dominance/i);
  });

  it("get_coin_prices description mentions symbol lookup", () => {
    expect(tools.get_coin_prices.description).toMatch(/coin/i);
  });

  it("get_watchlist description mentions watchlist", () => {
    expect(tools.get_watchlist.description).toMatch(/watchlist/i);
  });

  it("get_top_by_volume description mentions trading volume", () => {
    expect(tools.get_top_by_volume.description).toMatch(/trading volume/i);
  });
});

// ---------------------------------------------------------------------------
// 8. Deterministic citation metadata
// ---------------------------------------------------------------------------

describe("citation metadata", () => {
  it("builds a single-tool sources line with dataAsOf", () => {
    const metadata = buildAssistantMessageMetadata([
      {
        toolName: "get_market_summary",
        output: { dataAsOf: "2024-01-15T10:30:00Z" },
      },
    ]);

    expect(metadata).toMatchObject({
      sourcesLine: "Sources: get_market_summary as of Jan 15, 2024, 5:30 AM EST",
    });
  });

  it("builds a multi-tool sources line with one entry per tool", () => {
    const metadata = buildAssistantMessageMetadata([
      {
        toolName: "get_watchlist",
        output: [{ id: "bitcoin", dataAsOf: "2024-01-15T10:30:00Z" }],
      },
      {
        toolName: "get_market_summary",
        output: { dataAsOf: "2024-01-15T10:35:00Z" },
      },
    ]);

    expect(metadata?.sourcesLine).toBe(
      "Sources: get_watchlist as of Jan 15, 2024, 5:30 AM EST; get_market_summary as of Jan 15, 2024, 5:35 AM EST"
    );
  });

  it("marks null or missing dataAsOf values as unavailable", () => {
    const metadata = buildAssistantMessageMetadata([
      {
        toolName: "get_coin_prices",
        output: [
          { id: "bitcoin", dataAsOf: "2024-01-15T10:30:00Z" },
          { id: "ethereum", dataAsOf: null },
        ],
      },
      {
        toolName: "get_watchlist",
        output: [{ id: "bitcoin", price: 68000 }],
      },
    ]);

    expect(metadata?.sourcesLine).toBe(
      "Sources: get_coin_prices as of Jan 15, 2024, 5:30 AM EST; some results had no dataAsOf; get_watchlist dataAsOf unavailable"
    );
  });

  it("deduplicates repeated tool calls and distinct timestamps", () => {
    const citations = buildToolCitations([
      {
        toolName: "get_coin_prices",
        output: { id: "bitcoin", dataAsOf: "2024-01-15T10:30:00Z" },
      },
      {
        toolName: "get_coin_prices",
        output: { id: "ethereum", dataAsOf: "2024-01-15T10:35:00Z" },
      },
    ]);

    expect(citations).toEqual([
      {
        toolName: "get_coin_prices",
        dataAsOfValues: [
          "2024-01-15T10:30:00Z",
          "2024-01-15T10:35:00Z",
        ],
        hasUnavailableDataAsOf: false,
      },
    ]);
  });

  it("returns no citation metadata when no tools were used", () => {
    expect(buildAssistantMessageMetadata([])).toBeUndefined();
  });

  it("reuses the most relevant prior tool citation for tool-free follow-up market questions", () => {
    const metadata = inferAssistantMessageMetadataFromHistory([
      {
        id: "assistant-top-movers",
        role: "assistant",
        parts: [{ type: "text", text: "Top movers response" }],
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
        parts: [{ type: "text", text: "Watchlist response" }],
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
        parts: [{ type: "text", text: "Which coins are down more than 5% today?" }],
      },
    ]);

    expect(metadata?.sourcesLine).toBe(
      "Sources: get_top_movers as of Jan 15, 2024, 5:30 AM EST"
    );
  });

  it("reuses the most recent assistant sources line for source questions", () => {
    const metadata = inferAssistantMessageMetadataFromHistory([
      {
        id: "assistant-prices",
        role: "assistant",
        parts: [{ type: "text", text: "Bitcoin $68,000.00 (+2.10%)" }],
        metadata: {
          citations: [
            {
              toolName: "get_coin_prices",
              dataAsOfValues: ["2024-01-15T10:30:00Z"],
              hasUnavailableDataAsOf: false,
            },
          ],
          sourcesLine:
            "Sources: get_coin_prices as of Jan 15, 2024, 5:30 AM EST",
        },
      },
      {
        id: "user-source",
        role: "user",
        parts: [{ type: "text", text: "what is the source for that data?" }],
      },
    ]);

    expect(metadata?.sourcesLine).toBe(
      "Sources: get_coin_prices as of Jan 15, 2024, 5:30 AM EST"
    );
  });
});

/*
 * ---------------------------------------------------------------------------
 * MANUAL GOLDEN-QUESTION EVAL LOG
 * ---------------------------------------------------------------------------
 * Run these against a live assistant to verify end-to-end LLM behaviour.
 * Record pass/fail and note the tool calls observed in server logs.
 *
 * Q1  "What are the top gainers and losers today?"
 *     EXPECT: calls get_top_movers, lists gainers + losers as Name $Price (+/-X.XX%), footer renders sources once
 *     FAIL IF: fabricated prices, no tool call, uses (24h), duplicate sources
 *
 * Q2  "What is the current market summary?"
 *     EXPECT: calls get_market_summary, shows total market cap / vol / BTC dominance, footer renders sources once
 *     FAIL IF: no tool call, missing fields, invented numbers, duplicate sources
 *
 * Q3  "What's the price of Bitcoin and Ethereum?"
 *     EXPECT: calls get_coin_prices(['bitcoin','ethereum']), shows both prices as Name $Price (+/-X.XX%), footer renders sources once
 *     FAIL IF: only one coin fetched, invented prices, no tool call, uses (24h), duplicate sources
 *
 * Q4  "What's in my watchlist?"
 *     EXPECT: calls get_watchlist, lists each coin as Name $Price (+/-X.XX%), footer renders sources once
 *     FAIL IF: no tool call, empty response, fabricated data, uses (24h), duplicate sources
 *
 * Q5  "How is my watchlist doing compared to the overall market?"
 *     EXPECT: calls get_watchlist AND get_market_summary (multi-tool), compares results, footer renders sources once
 *     FAIL IF: only one tool called, comparison invented, duplicate sources
 *
 * Q6  "Should I buy Solana right now?"
 *     EXPECT: politely declines to give financial advice, does NOT call any tool
 *     FAIL IF: gives a buy/sell recommendation, invents price targets
 *
 * Q7  "What's the price of ZZZNOTACOIN?"
 *     EXPECT: calls get_coin_prices(['zzznotacoin']), returns coin_not_found, tells user clearly, footer renders sources once
 *     FAIL IF: fabricates a price, ignores the error response, duplicate sources
 *
 * Q8  "Compare Bitcoin and Ethereum"
 *     EXPECT: calls get_coin_prices twice (or with both IDs), presents side-by-side comparison with Name $Price (+/-X.XX%), footer renders sources once
 *     FAIL IF: one coin missing, invented data, uses (24h), duplicate sources
 *
 * Q9  "Top 5 gainers right now"
 *     EXPECT: calls get_top_movers, lists top 5 gainers only as Name $Price (+/-X.XX%), footer renders sources once
 *     FAIL IF: shows losers too, shows > or < 5, invented prices, uses (24h), duplicate sources
 *
 * Q10 "Give me the BTC dominance and the biggest loser today"
 *     EXPECT: calls get_market_summary AND get_top_movers (multi-tool), footer renders sources once
 *     FAIL IF: only one tool used, invented values, duplicate sources
 * ---------------------------------------------------------------------------
 */
