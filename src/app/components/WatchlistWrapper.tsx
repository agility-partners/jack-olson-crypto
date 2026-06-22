"use client";

import { useState } from "react";
import { Coin } from "@/app/lib/mockData";
import StatsBar from "./StatsBar";
import WatchlistClient from "./WatchlistClient";
import styles from "./WatchlistWrapper.module.css";

type Props = {
  initialCoins: Coin[];
};

export default function WatchlistWrapper({ initialCoins }: Props) {
  const [coinCount, setCoinCount] = useState(initialCoins.length);
  const [gainerCount, setGainerCount] = useState(
    () => initialCoins.filter((c) => c.change24h >= 0).length
  );

  const handleStatsChange = (newCoinCount: number, newGainerCount: number) => {
    setCoinCount(newCoinCount);
    setGainerCount(newGainerCount);
  };

  return (
    <>
      <p className={styles.trackingText}>
        Tracking {coinCount} assets · Last updated just now
      </p>
      <StatsBar coinCount={coinCount} gainerCount={gainerCount} />
      <WatchlistClient initialCoins={initialCoins} onStatsChange={handleStatsChange} />
    </>
  );
}
