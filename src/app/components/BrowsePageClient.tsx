"use client";

import { useState } from "react";
import type { Coin } from "@/app/lib/mockData";
import type { MarketStats } from "@/app/lib/marketStats";
import TickerStrip from "@/app/components/TickerStrip";
import Navigation from "@/app/components/Navigation";
import StatsBar from "@/app/components/StatsBar";
import WatchlistClient from "@/app/components/WatchlistClient";
import styles from "@/app/page.module.css";

type Props = {
  initialCoins: Coin[];
  initialMarketStats: MarketStats;
};

export default function BrowsePageClient({ initialCoins, initialMarketStats }: Props) {
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

      <div className={styles.pageHeader}>
        <h1>All Coins</h1>
        <p>Tracking {coinCount} assets · Last updated just now</p>
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
