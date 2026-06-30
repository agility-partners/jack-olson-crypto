"use client";

import { useCallback, useState } from "react";
import { Coin } from "@/app/lib/mockData";
import StatsBar from "./StatsBar";
import WatchlistClient from "./WatchlistClient";
import styles from "@/app/page.module.css";

type Props = {
  initialCoins: Coin[];
};

export default function BrowseWrapper({ initialCoins }: Props) {
  const [coinCount, setCoinCount] = useState(initialCoins.length);
  const [gainerCount, setGainerCount] = useState(
    () => initialCoins.filter((coin) => coin.change24h >= 0).length
  );

  const handleStatsChange = useCallback((nextCoinCount: number, nextGainerCount: number) => {
    setCoinCount(nextCoinCount);
    setGainerCount(nextGainerCount);
  }, []);

  return (
    <>
      <div className={styles.pageHeader}>
        <h1>All Coins</h1>
        <p>Tracking {coinCount} assets · Last updated just now</p>
      </div>

      <StatsBar coinCount={coinCount} gainerCount={gainerCount} />

      <WatchlistClient
        initialCoins={initialCoins}
        onStatsChange={handleStatsChange}
        useAllCoins
      />
    </>
  );
}
