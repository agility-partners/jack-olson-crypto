"use client";

import { useEffect, useMemo, useState } from "react";
import { Coin } from "@/app/lib/mockData";
import { filterCoins, sortCoins, defaultSortDir, type Filter, type SortDir } from "@/app/lib/watchlistUtils";
import AddCoinModal from "./AddCoinModal";
import styles from "./WatchlistClient.module.css";
import CryptoCard from "./CryptoCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const REFRESH_INTERVAL_MS = 120_000;
const FILTER_OPTIONS: Filter[] = [
  "value",
  "alphabetical",
  "percentchange",
  "marketcap",
  "24hvolume",
  "gainers",
  "losers",
];

type Props = {
  initialCoins: Coin[];
  allCoins?: Coin[];
  onStatsChange?: (coinCount: number, gainerCount: number) => void;
  useAllCoins?: boolean;
};

export default function WatchlistClient({
  initialCoins,
  allCoins,
  onStatsChange,
  useAllCoins = false,
}: Props) {
  const [coins, setCoins] = useState<Coin[]>(initialCoins);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("value");
  const [sortDir, setSortDir] = useState<SortDir>(defaultSortDir("value"));
  const [isGrid, setIsGrid] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(
    Math.ceil(REFRESH_INTERVAL_MS / 1000)
  );

  const formatCountdown = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Auto-refresh prices from the API every REFRESH_INTERVAL_MS
  useEffect(() => {
    const endpoint = useAllCoins ? "/api/coins" : "/api/watchlist";
    let nextRefreshAt = Date.now() + REFRESH_INTERVAL_MS;
    const syncCountdown = () => {
      const secondsRemaining = Math.max(0, Math.ceil((nextRefreshAt - Date.now()) / 1000));
      setSecondsUntilRefresh(secondsRemaining);
    };

    const refresh = async () => {
      try {
        const res = await fetch(`${API_URL}${endpoint}`);
        if (!res.ok) return;
        const fresh: Coin[] = await res.json();
        const priceMap = new Map(fresh.map((c) => [c.id, c]));
        setCoins((prev) =>
          prev.map((c) => {
            const updated = priceMap.get(c.id);
            return updated ? { ...c, ...updated } : c;
          })
        );
      } catch {
        // Silently ignore — we keep stale data rather than breaking the UI
      } finally {
        nextRefreshAt = Date.now() + REFRESH_INTERVAL_MS;
        syncCountdown();
      }
    };

    syncCountdown();
    const refreshIntervalId = setInterval(() => {
      void refresh();
    }, REFRESH_INTERVAL_MS);
    const countdownIntervalId = setInterval(syncCountdown, 1000);

    return () => {
      clearInterval(refreshIntervalId);
      clearInterval(countdownIntervalId);
    };
  }, [useAllCoins]);

  useEffect(() => {
    const gainerCount = coins.filter((c) => c.change24h >= 0).length;
    onStatsChange?.(coins.length, gainerCount);
  }, [coins, onStatsChange]);

  const handleAddCoin = (newCoins: Coin[]) => {
    const coinsToAdd = newCoins.filter((c) => !coins.some((existing) => existing.id === c.id));
    if (coinsToAdd.length > 0) {
      setCoins((prev) => [...prev, ...coinsToAdd]);
    }
    setShowAddModal(false);
  };

  const handleRemoveCoin = (coinId: string) => {
    setCoins((prev) => {
      const updated = prev.filter((coin) => coin.id !== coinId);
      if (updated.length === prev.length) return prev;
      return updated;
    });

    // Sync removal with API (fire and forget)
    fetch(`${API_URL}/api/watchlist/${coinId}`, { method: "DELETE" }).catch(() => {});
  };

  const handleFilterClick = (f: Filter) => {
    if (f === filter) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setFilter(f);
      setSortDir(defaultSortDir(f));
    }
  };

  const filtered = useMemo(
    () => filterCoins(coins, search, filter),
    [coins, filter, search],
  );
  const visibleCoins = useMemo(
    () => sortCoins(filtered, filter, sortDir),
    [filtered, filter, sortDir],
  );

  const biggestGainer = useMemo(
    () => filtered.reduce<Coin | null>(
      (best, c) => (c.change24h > 0 && (!best || c.change24h > best.change24h) ? c : best),
      null,
    ),
    [filtered],
  );
  const biggestLoser = useMemo(
    () => filtered.reduce<Coin | null>(
      (worst, c) => (c.change24h < 0 && (!worst || c.change24h < worst.change24h) ? c : worst),
      null,
    ),
    [filtered],
  );

  const filterLabels: Record<Filter, string> = {
    value: "Value",
    alphabetical: "Alphabetical",
    percentchange: "Percent Change",
    marketcap: "Market Cap",
    "24hvolume": "24h Volume",
    gainers: "Gainers",
    losers: "Losers",
  };

  return (
    <>
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

        {FILTER_OPTIONS.map((f) => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.active : ""}`}
            onClick={() => handleFilterClick(f)}
            aria-label={filter === f ? `${filterLabels[f]}, sorted ${sortDir === "asc" ? "ascending" : "descending"}` : filterLabels[f]}
          >
            {filterLabels[f]}
            {filter === f && (
              <span className={styles.sortArrow} aria-hidden="true">
                {sortDir === "asc" ? "↑" : "↓"}
              </span>
            )}
          </button>
        ))}

        <div className={styles.toolbarRight}>
          <p className={styles.refreshCountdown} aria-live="polite">
            Auto-refresh in {formatCountdown(secondsUntilRefresh)}
          </p>
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

      <main>
        <div className={`${styles.coinGrid} ${!isGrid ? styles.listView : ""}`}>
          {visibleCoins.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateBox}>
                <h2>No coins found</h2>
                <p>Try adjusting your search or filter.</p>
              </div>
            </div>
          ) : (
            visibleCoins.map((coin) => (
              <CryptoCard
                key={coin.id}
                coin={coin}
                isBiggestGainer={biggestGainer?.id === coin.id}
                isBiggestLoser={biggestLoser?.id === coin.id}
                onRemove={!useAllCoins ? handleRemoveCoin : undefined}
                from={useAllCoins ? "browse" : undefined}
              />
            ))
          )}
        </div>
      </main>

      {showAddModal && (
        <AddCoinModal
          onClose={() => setShowAddModal(false)}
          onAddCoin={handleAddCoin}
          currentCoins={coins}
          allCoins={allCoins}
        />
      )}
    </>
  );
}
