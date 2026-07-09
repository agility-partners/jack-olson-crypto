"use client";

import { useCallback, useState } from "react";
import { Coin } from "@/app/lib/mockData";
import type { MarketStats } from "@/app/lib/marketStats";
import StatsBar from "./StatsBar";
import WatchlistClient from "./WatchlistClient";
import FlappyCrypto from "./FlappyCrypto";
import styles from "./WatchlistWrapper.module.css";
import pageStyles from "@/app/page.module.css";

type Props = {
  initialCoins: Coin[];
  allCoins: Coin[];
  initialMarketStats: MarketStats;
  lastUpdated?: string;
  isMock?: boolean;
};

export default function WatchlistWrapper({ initialCoins, allCoins, initialMarketStats, lastUpdated = "just now", isMock = false }: Props) {
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
      {isMock && (
        <div className={styles.mockBanner} role="alert">
          ⚠ Showing cached demo prices — live API is unavailable. Data may be outdated.
        </div>
      )}

      <div className={pageStyles.pageHeader}>
        <div className={pageStyles.pageHeaderContent}>
          <h1>My Watchlist</h1>
          <p className={styles.trackingText}>
            Tracking {coinCount} assets · Last updated {lastUpdated}
          </p>
        </div>
        <FlappyCrypto />
      </div>

      <StatsBar
        coinCount={coinCount}
        gainerCount={gainerCount}
        marketStats={initialMarketStats}
      />
      <WatchlistClient
        initialCoins={initialCoins}
        allCoins={allCoins}
        onStatsChange={handleStatsChange}
      />
    </>
  );
}
