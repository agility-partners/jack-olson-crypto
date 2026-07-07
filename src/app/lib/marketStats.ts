import type { Coin } from "@/app/lib/mockData";

export type MarketStats = {
  totalMarketCap: string;
  marketCapChange: string;
  marketCapChangeDir: string;
  volume24h: string;
  btcDominance: string;
  avgChange24h: string;
  avgChange24hDir: string;
};

export function createFallbackMarketStats(coins: Coin[]): MarketStats {
  if (coins.length === 0) {
    return createMarketStats(0, 0, 0, 0);
  }

  const totalMarketCap = coins.reduce((sum, coin) => sum + coin.marketCapRaw, 0);
  const volume24h = coins.reduce((sum, coin) => sum + coin.volumeRaw, 0);
  const avgChange24h = coins.reduce((sum, coin) => sum + coin.change24h, 0) / coins.length;
  const bitcoinMarketCap = coins.find((coin) => coin.id === "bitcoin")?.marketCapRaw ?? 0;
  const btcDominance = totalMarketCap > 0 ? (bitcoinMarketCap * 100) / totalMarketCap : 0;

  return createMarketStats(totalMarketCap, volume24h, avgChange24h, btcDominance);
}

function createMarketStats(
  totalMarketCap: number,
  volume24h: number,
  avgChange24h: number,
  btcDominance: number,
): MarketStats {
  const isUp = avgChange24h >= 0;
  const change = `${isUp ? "↑" : "↓"} ${Math.abs(avgChange24h).toFixed(1)}%`;

  return {
    totalMarketCap: formatCurrencyCompact(totalMarketCap),
    marketCapChange: change,
    marketCapChangeDir: isUp ? "up" : "down",
    volume24h: formatCurrencyCompact(volume24h),
    btcDominance: `${btcDominance.toFixed(1)}%`,
    avgChange24h: change,
    avgChange24hDir: isUp ? "up" : "down",
  };
}

function formatCurrencyCompact(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);

  if (abs >= 1_000_000_000_000) {
    return `${sign}$${(abs / 1_000_000_000_000).toFixed(2).replace(/\.?0+$/, "")}T`;
  }

  if (abs >= 1_000_000_000) {
    return `${sign}$${(abs / 1_000_000_000).toFixed(2).replace(/\.?0+$/, "")}B`;
  }

  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  }

  if (abs >= 1_000) {
    return `${sign}$${(abs / 1_000).toFixed(2).replace(/\.?0+$/, "")}K`;
  }

  return `${sign}$${abs.toFixed(2).replace(/\.?0+$/, "")}`;
}
