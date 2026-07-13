export type Filter =
  | "value"
  | "alphabetical"
  | "percentchange"
  | "marketcap"
  | "24hvolume"
  | "gainers"
  | "losers";

export type SortDir = "asc" | "desc";

/** Default sort direction for each filter when first selected. */
export function defaultSortDir(filter: Filter): SortDir {
  return filter === "alphabetical" ? "asc" : "desc";
}

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
      filter === "alphabetical" ||
      filter === "percentchange" ||
      filter === "marketcap" ||
      filter === "24hvolume" ||
      (filter === "gainers" && c.change24h >= 0) ||
      (filter === "losers" && c.change24h < 0);

    return matchesSearch && matchesFilter;
  });
}

export function sortCoins<T extends CoinLike>(coins: T[], filter: Filter, dir?: SortDir): T[] {
  const sorted = [...coins];
  const asc = (dir ?? defaultSortDir(filter)) === "asc";

  switch (filter) {
    case "alphabetical":
      return sorted.sort((a, b) => asc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
    case "percentchange":
    case "gainers":
      return sorted.sort((a, b) => asc ? a.change24h - b.change24h : b.change24h - a.change24h);
    case "losers":
      // "desc" (default) = biggest loser (most negative) first; "asc" = smallest loser first
      return sorted.sort((a, b) => asc ? b.change24h - a.change24h : a.change24h - b.change24h);
    case "marketcap":
      return sorted.sort((a, b) => asc ? a.marketCapRaw - b.marketCapRaw : b.marketCapRaw - a.marketCapRaw);
    case "24hvolume":
      return sorted.sort((a, b) => asc ? a.volumeRaw - b.volumeRaw : b.volumeRaw - a.volumeRaw);
    case "value":
    default:
      return sorted.sort((a, b) => asc ? a.price - b.price : b.price - a.price);
  }
}
