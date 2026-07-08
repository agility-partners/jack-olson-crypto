import { describe, expect, it } from "vitest";
import { watchlistCoins } from "@/app/lib/mockData";
import { findBiggestGainer, findBiggestLoser } from "./coinMovers";

describe("coinMovers", () => {
  it("returns the highest positive 24h mover as biggest gainer", () => {
    const coins = [
      watchlistCoins.find((coin) => coin.id === "ethereum")!,
      watchlistCoins.find((coin) => coin.id === "bitcoin")!,
      watchlistCoins.find((coin) => coin.id === "solana")!,
    ];

    const biggestGainer = findBiggestGainer(coins);
    expect(biggestGainer?.change24h).toBeGreaterThan(0);
    expect(biggestGainer?.change24h).toBe(
      Math.max(...coins.filter((coin) => coin.change24h > 0).map((coin) => coin.change24h)),
    );
  });

  it("returns the lowest negative 24h mover as biggest loser", () => {
    const coins = [
      watchlistCoins.find((coin) => coin.id === "bitcoin")!,
      watchlistCoins.find((coin) => coin.id === "ethereum")!,
      watchlistCoins.find((coin) => coin.id === "bnb")!,
    ];

    const biggestLoser = findBiggestLoser(coins);
    expect(biggestLoser?.change24h).toBeLessThan(0);
    expect(biggestLoser?.change24h).toBe(
      Math.min(...coins.filter((coin) => coin.change24h < 0).map((coin) => coin.change24h)),
    );
  });

  it("returns null when no positive or negative movers exist", () => {
    const onlyLosers = watchlistCoins
      .filter((coin) => coin.change24h < 0)
      .slice(0, 3);
    const onlyGainers = watchlistCoins
      .filter((coin) => coin.change24h > 0)
      .slice(0, 3);

    expect(findBiggestGainer(onlyLosers)).toBeNull();
    expect(findBiggestLoser(onlyGainers)).toBeNull();
  });
});
