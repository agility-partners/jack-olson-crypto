import { afterEach, describe, expect, it, vi } from "vitest";
import { getAllCoins, getWatchlistCoins } from "./api";
import { watchlistCoins } from "./mockData";

describe("api helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches all coins from the API", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [watchlistCoins[0]],
    } as Response);

    const coins = await getAllCoins();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/coins",
      { cache: "no-store" }
    );
    expect(coins).toEqual([watchlistCoins[0]]);
  });

  it("falls back to mock coin data when the all-coins API fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
    } as Response);

    const coins = await getAllCoins();

    expect(coins).toEqual(watchlistCoins);
  });

  it("returns an empty watchlist when the watchlist API fails", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("offline"));

    const coins = await getWatchlistCoins();

    expect(coins).toEqual([]);
  });
});
