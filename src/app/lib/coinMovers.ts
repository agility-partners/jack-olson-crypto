import type { Coin } from "@/app/lib/mockData";

export function findBiggestGainer(coins: Coin[]): Coin | null {
  return coins.reduce<Coin | null>(
    (best, candidate) => (
      candidate.change24h > 0 && (!best || candidate.change24h > best.change24h)
        ? candidate
        : best
    ),
    null,
  );
}

export function findBiggestLoser(coins: Coin[]): Coin | null {
  return coins.reduce<Coin | null>(
    (worst, candidate) => (
      candidate.change24h < 0 && (!worst || candidate.change24h < worst.change24h)
        ? candidate
        : worst
    ),
    null,
  );
}
