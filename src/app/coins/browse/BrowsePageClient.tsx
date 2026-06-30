"use client";

import { useCallback, useState } from "react";
import type { Coin } from "@/app/lib/mockData";
import TickerStrip from "@/app/components/TickerStrip";
import Navigation from "@/app/components/Navigation";
import StatsBar from "@/app/components/StatsBar";
import WatchlistClient from "@/app/components/WatchlistClient";
import styles from "../../page.module.css";

type Props = {
  initialCoins: Coin[];
};

export default function BrowsePageClient({ initialCoins }: Props) {
  const [coinCount, setCoinCount] = useState(initialCoins.length);
  const [gainerCount, setGainerCount] = useState(
    () => initialCoins.filter((coin) => coin.change24h >= 0).length
  );

  const handleStatsChange = useCallback((count: number, gainers: number) => {
    setCoinCount(count);
    setGainerCount(gainers);
  }, []);

  return (
    <>
      <TickerStrip coins={initialCoins} />
      <Navigation />

      <div className={styles.pageHeader}>
        <h1>All Coins</h1>
        <p>Tracking {coinCount} assets · Last updated just now</p>
      </div>

      <StatsBar coinCount={coinCount} gainerCount={gainerCount} />

      <WatchlistClient
        initialCoins={initialCoins}
        onStatsChange={handleStatsChange}
        useAllCoins={true}
      />
    </>
  );
}
