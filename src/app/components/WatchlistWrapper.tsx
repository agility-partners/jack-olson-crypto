"use client";

import { useCallback, useState } from "react";
import { Coin } from "@/app/lib/mockData";
import StatsBar from "./StatsBar";
import WatchlistClient from "./WatchlistClient";
import FlappyCrypto from "./FlappyCrypto";
import styles from "./WatchlistWrapper.module.css";
import pageStyles from "@/app/page.module.css";

type Props = {
  initialCoins: Coin[];
};

export default function WatchlistWrapper({ initialCoins }: Props) {
  const [coinCount, setCoinCount] = useState(initialCoins.length);
  const [gainerCount, setGainerCount] = useState(
    () => initialCoins.filter((c) => c.change24h >= 0).length
  );

  const handleStatsChange = useCallback((newCoinCount: number, newGainerCount: number) => {
    setCoinCount(newCoinCount);
    setGainerCount(newGainerCount);
  }, []);

  return (
    <>
      <div className={pageStyles.pageHeader}>
        <div className={pageStyles.pageHeaderContent}>
          <h1>My Watchlist</h1>
          <p className={styles.trackingText}>
            Tracking {coinCount} assets · Last updated just now
          </p>
        </div>
        <FlappyCrypto />
      </div>

      <StatsBar coinCount={coinCount} gainerCount={gainerCount} />
      <WatchlistClient initialCoins={initialCoins} onStatsChange={handleStatsChange} />
    </>
  );
}
