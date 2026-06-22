"use client";

import { useMemo } from "react";
import { Coin } from "@/app/lib/mockData";
import { formatPrice } from "@/app/lib/utils";
import styles from "./TickerStrip.module.css";

type Props = { coins: Coin[] };

export default function TickerStrip({ coins }: Props) {
  // Shuffle coins on each render using Fisher-Yates algorithm
  const shuffledCoins = useMemo(() => {
    const shuffled = [...coins];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [coins]);

  // Duplicate items for seamless loop
  const items = [...shuffledCoins, ...shuffledCoins];

  return (
    <div className={styles.tickerWrap} aria-hidden="true">
      <div className={styles.tickerTrack}>
        {items.map((coin, i) => {
          const up = coin.change24h >= 0;
          return (
            <span key={`${coin.id}-${i}`} className={styles.tickerItem}>
              <span className={styles.sym}>{coin.symbol}</span>
              <span className={styles.price}>{formatPrice(coin.price)}</span>
              <span className={up ? styles.up : styles.dn}>
                {up ? "+" : ""}{coin.change24h.toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
