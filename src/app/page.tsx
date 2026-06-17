"use client";

import { useState, useCallback } from "react";
import { watchlistCoins, getRandomWatchList } from "@/app/lib/mockData";
import TickerStrip from "@/app/components/TickerStrip";
import Navigation from "@/app/components/Navigation";
import StatsBar from "@/app/components/StatsBar";
import WatchlistClient from "@/app/components/WatchlistClient";
import styles from "./page.module.css";

export default function WatchlistPage() {
  const [coinCount, setCoinCount] = useState(0);
  const [gainerCount, setGainerCount] = useState(0);

  // Pre-shuffle coins on server render (before hydration)
  const initialWatchlist = getRandomWatchList(12);

  const handleStatsChange = useCallback((count: number, gainers: number) => {
    setCoinCount(count);
    setGainerCount(gainers);
  }, []);

  return (
    <>
      <TickerStrip coins={watchlistCoins} />
      <Navigation />

      <div className={styles.pageHeader}>
        <h1>My Watchlist</h1>
        <p>Tracking {coinCount} assets · Last updated just now</p>
      </div>

      <StatsBar coinCount={coinCount} gainerCount={gainerCount} />

      <WatchlistClient initialCoins={initialWatchlist} onStatsChange={handleStatsChange} />
    </>
  );
}
