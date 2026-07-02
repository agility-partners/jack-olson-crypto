"use client";

import { useEffect, useState } from "react";
import styles from "./StatsBar.module.css";

type MarketStats = {
  totalMarketCap: string;
  marketCapChange: string;
  marketCapChangeDir: string;
  volume24h: string;
  btcDominance: string;
  avgChange24h: string;
  avgChange24hDir: string;
};

type Stat = {
  label: string;
  value: string;
  change?: string;
  changeDir?: "up" | "dn";
};

type Props = {
  coinCount?: number;
  gainerCount?: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default function StatsBar({ coinCount, gainerCount }: Props) {
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/marketstats`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch market stats");
        return res.json() as Promise<MarketStats>;
      })
      .then((data) => setMarketStats(data))
      .catch(() => {});
  }, []);

  const gainersValue =
    coinCount !== undefined && gainerCount !== undefined
      ? `${gainerCount} / ${coinCount}`
      : "— / —";

  const stats: Stat[] = [
    {
      label: "Total market cap",
      value: marketStats?.totalMarketCap ?? "—",
      change: marketStats?.marketCapChange,
      changeDir: marketStats?.marketCapChangeDir === "up" ? "up" : "dn",
    },
    { label: "24h volume",         value: marketStats?.volume24h ?? "—" },
    { label: "BTC dominance",      value: marketStats?.btcDominance ?? "—" },
    { label: "Gainers",            value: gainersValue, changeDir: "up" },
  ];

  const legend = [
    { label: "Gainer",         className: styles.legendGainer },
    { label: "Loser",          className: styles.legendLoser },
    { label: "Biggest Gainer", className: styles.legendBiggestGainer },
    { label: "Biggest Loser",  className: styles.legendBiggestLoser },
  ];

  return (
    <div className={styles.statsBar}>
      <div className={styles.statsItems}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.statItem}>
            <div className={styles.statLabel}>{stat.label}</div>
            <div className={styles.statValue}>
              {stat.value}
              {stat.change && (
                <span className={`${styles.statChange} ${stat.changeDir === "up" ? styles.up : styles.dn}`}>
                  {stat.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.legend}>
        <div className={styles.legendLabel}>Key</div>
        <div className={styles.legendItems}>
          {legend.map((item) => (
            <div key={item.label} className={`${styles.legendItem} ${item.className}`}>
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
