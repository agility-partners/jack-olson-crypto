"use client";

import { useMemo } from "react";
import { Coin } from "@/app/lib/mockData";
import { formatPrice } from "@/app/lib/utils";
import styles from "./TickerStrip.module.css";

type Props = { coins: Coin[] };

export default function TickerStrip({ coins }: Props) {
  // Sort coins by price value (descending) — memoised so order is stable across re-renders
  const sortedCoins = useMemo(
    () => [...coins].sort((a, b) => b.price - a.price),
    [coins],
  );

  const renderCoins = (suffix: string) =>
    sortedCoins.map((coin) => {
      const up = coin.change24h >= 0;
      return (
        <span key={`${coin.id}-${suffix}`} className={styles.tickerItem}>
          <span className={styles.sym}>{coin.symbol}</span>
          <span className={styles.price}>{formatPrice(coin.price)}</span>
          <span className={up ? styles.up : styles.dn}>
            {up ? "+" : ""}{coin.change24h.toFixed(2)}%
          </span>
        </span>
      );
    });

  return (
    <div className={styles.tickerWrap} aria-hidden="true">
      <div className={styles.tickerTrack}>
        {renderCoins("a")}
        <span className={styles.cycleMarker}>✦</span>
        {renderCoins("b")}
        <span className={styles.cycleMarker}>✦</span>
      </div>
    </div>
  );
}
