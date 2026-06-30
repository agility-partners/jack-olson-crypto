"use client";

import { useCallback, useState } from "react";
import type { Coin } from "@/app/lib/mockData";
import pageStyles from "@/app/page.module.css";
import StatsBar from "./StatsBar";
import WatchlistClient from "./WatchlistClient";

type Props = {
  initialCoins: Coin[];
};

export default function BrowseWrapper({ initialCoins }: Props) {
  const [coinCount, setCoinCount] = useState(initialCoins.length);
  const [gainerCount, setGainerCount] = useState(
    () => initialCoins.filter((coin) => coin.change24h >= 0).length
  );

  const handleStatsChange = useCallback((newCoinCount: number, newGainerCount: number) => {
    setCoinCount(newCoinCount);
    setGainerCount(newGainerCount);
  }, []);

  return (
    <>
      <div className={pageStyles.pageHeader}>
        <h1>All Coins</h1>
        <p>Tracking {coinCount} assets · Last updated just now</p>
      </div>

      <StatsBar coinCount={coinCount} gainerCount={gainerCount} />
      <WatchlistClient initialCoins={initialCoins} onStatsChange={handleStatsChange} useAllCoins />
    </>
  );
}
