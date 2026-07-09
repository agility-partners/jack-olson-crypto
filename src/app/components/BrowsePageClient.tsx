"use client";

import { useState } from "react";
import type { Coin } from "@/app/lib/mockData";
import type { MarketStats } from "@/app/lib/marketStats";
import TickerStrip from "@/app/components/TickerStrip";
import Navigation from "@/app/components/Navigation";
import StatsBar from "@/app/components/StatsBar";
import WatchlistClient from "@/app/components/WatchlistClient";
import styles from "@/app/page.module.css";
import browseStyles from "./BrowsePageClient.module.css";

type Props = {
  initialCoins: Coin[];
  initialMarketStats: MarketStats;
  lastUpdated?: string;
  isMock?: boolean;
};

export default function BrowsePageClient({ initialCoins, initialMarketStats, lastUpdated = "just now", isMock = false }: Props) {
  const [coinCount, setCoinCount] = useState(initialCoins.length);
  const [gainerCount, setGainerCount] = useState(
    initialCoins.filter((c) => c.change24h >= 0).length
  );

  const handleStatsChange = (count: number, gainers: number) => {
    setCoinCount(count);
    setGainerCount(gainers);
  };

  return (
    <>
      <TickerStrip coins={initialCoins} />
      <Navigation />

      {isMock && (
        <div className={browseStyles.mockBanner} role="alert">
          ⚠ Showing cached demo prices — live API is unavailable. Data may be outdated.
        </div>
      )}

      <div className={styles.pageHeader}>
        <h1>All Coins</h1>
        <p>Tracking {coinCount} assets · Last updated {lastUpdated}</p>
      </div>

      <StatsBar
        coinCount={coinCount}
        gainerCount={gainerCount}
        marketStats={initialMarketStats}
      />

      <WatchlistClient
        initialCoins={initialCoins}
        onStatsChange={handleStatsChange}
        useAllCoins={true}
      />
    </>
  );
}
