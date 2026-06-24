export function parseValue(str: string): number {
  const match = str.match(/(\d+\.?\d*)\s*([MBT])/i);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const suffix = match[2].toUpperCase();

  const multipliers: Record<string, number> = {
    M: 1_000_000,
    B: 1_000_000_000,
    T: 1_000_000_000_000,
  };

  return value * (multipliers[suffix] || 1);
}

export type Filter =
  | "value"
  | "percentchange"
  | "marketcap"
  | "24hvolume"
  | "gainers"
  | "losers";

export type CoinLike = {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap: string;
  marketCapRaw: number;
  volume: string;
  volumeRaw: number;
};

export function filterCoins<T extends CoinLike>(
  coins: T[],
  search: string,
  filter: Filter
): T[] {
  return coins.filter((c) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q);
    const matchesFilter =
      filter === "value" ||
      filter === "percentchange" ||
      filter === "marketcap" ||
      filter === "24hvolume" ||
      (filter === "gainers" && c.change24h >= 0) ||
      (filter === "losers" && c.change24h < 0);

    return matchesSearch && matchesFilter;
  });
}

export function sortCoins<T extends CoinLike>(coins: T[], filter: Filter): T[] {
  const sorted = [...coins];

  switch (filter) {
    case "percentchange":
      return sorted.sort((a, b) => b.change24h - a.change24h);
    case "marketcap":
      return sorted.sort((a, b) => b.marketCapRaw - a.marketCapRaw);
    case "24hvolume":
      return sorted.sort((a, b) => b.volumeRaw - a.volumeRaw);
    case "value":
    default:
      return sorted.sort((a, b) => b.price - a.price);
  }
}
