"use client";

import { useEffect, useState } from "react";
import { Coin } from "@/app/lib/mockData";
import AddCoinModal from "./AddCoinModal";
import styles from "./WatchlistClient.module.css";
import CryptoCard from "./CryptoCard";

type Filter = "all" | "gainers" | "losers";

type Props = {
  initialCoins: Coin[];
  onStatsChange?: (coinCount: number, gainerCount: number) => void;
  useAllCoins?: boolean;
};

export default function WatchlistClient({ initialCoins, onStatsChange, useAllCoins = false }: Props) {
  const [coins, setCoins] = useState<Coin[]>(initialCoins);

  useEffect(() => {
    const gainerCount = coins.filter((c) => c.change24h >= 0).length;
    onStatsChange?.(coins.length, gainerCount);
  }, [coins, onStatsChange]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [isGrid, setIsGrid] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddCoin = (newCoin: Coin) => {
    // Check if coin already exists
    if (coins.some((c) => c.id === newCoin.id)) {
      alert("This coin is already in your watchlist!");
      return;
    }
    setCoins([...coins, newCoin]);
    setShowAddModal(false);
  };

  const filtered = coins.filter((c) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q);
    const matchesFilter =
      filter === "all" ||
      (filter === "gainers" && c.change24h >= 0) ||
      (filter === "losers" && c.change24h < 0);
    return matchesSearch && matchesFilter;
  });

  const biggestGainer = filtered.reduce<Coin | null>(
    (best, c) => (c.change24h > 0 && (!best || c.change24h > best.change24h) ? c : best),
    null
  );
  const biggestLoser = filtered.reduce<Coin | null>(
    (worst, c) => (c.change24h < 0 && (!worst || c.change24h < worst.change24h) ? c : worst),
    null
  );

  return (
    <>
      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Search coins…"
            aria-label="Search watchlist"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {(["all", "gainers", "losers"] as Filter[]).map((f) => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.active : ""}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}

        <div className={styles.toolbarRight}>
          {!useAllCoins && (
            <button
              className={styles.addCoinBtn}
              onClick={() => setShowAddModal(true)}
              title="Add a coin to your watchlist"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Coin
            </button>
          )}

          <div className={styles.viewToggle} role="group" aria-label="View mode">
            <button
              className={`${styles.viewBtn} ${isGrid ? styles.active : ""}`}
              aria-label="Grid view"
              title="Grid view"
              onClick={() => setIsGrid(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
            <button
              className={`${styles.viewBtn} ${!isGrid ? styles.active : ""}`}
              aria-label="List view"
              title="List view"
              onClick={() => setIsGrid(false)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Grid / List ── */}
      <main>
        <div className={`${styles.coinGrid} ${!isGrid ? styles.listView : ""}`}>
          {filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <h2>No coins found</h2>
              <p>Try adjusting your search or filter.</p>
            </div>
          ) : (
            filtered.map((coin) => (
              <CryptoCard
                key={coin.id}
                coin={coin}
                isBiggestGainer={biggestGainer?.id === coin.id}
                isBiggestLoser={biggestLoser?.id === coin.id}
              />
            ))
          )}
        </div>
      </main>

      {/* ── Add Coin Modal ── */}
      {showAddModal && <AddCoinModal onClose={() => setShowAddModal(false)} onAddCoin={handleAddCoin} currentCoins={coins} />}
    </>
  );
}
