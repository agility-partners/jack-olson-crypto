"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Coin } from "@/app/lib/mockData";
import styles from "./AddCoinModal.module.css";

type ValidationErrors = {
  coinId?: string;
};

type Props = {
  onClose: () => void;
  onAddCoin: (coin: Coin) => void;
  currentCoins: Coin[];
  allCoins?: Coin[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default function AddCoinModal({ onClose, onAddCoin, currentCoins, allCoins }: Props) {
  const [fetchedCoins, setFetchedCoins] = useState<Coin[]>([]);
  const [fetchError, setFetchError] = useState(false);
  const [selectedCoinId, setSelectedCoinId] = useState("");
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const coinCatalog = allCoins ?? fetchedCoins;

  useEffect(() => {
    if (allCoins) {
      return;
    }

    let isCancelled = false;

    fetch(`${API_URL}/api/coins`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch coins");
        return res.json() as Promise<Coin[]>;
      })
      .then((data) => {
        if (!isCancelled) {
          setFetchedCoins(data);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setFetchError(true);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [allCoins]);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const availableCoins = useMemo(
    () => coinCatalog
      .filter((coin) => !currentCoins.some((c) => c.id === coin.id))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [coinCatalog, currentCoins],
  );

  const filteredCoins = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return availableCoins;
    return availableCoins.filter(
      (coin) =>
        coin.name.toLowerCase().includes(q) ||
        coin.symbol.toLowerCase().includes(q),
    );
  }, [availableCoins, search]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!selectedCoinId.trim()) {
      newErrors.coinId = "Please select a cryptocurrency";
    } else if (!coinCatalog.find((c) => c.id === selectedCoinId)) {
      newErrors.coinId = "Invalid cryptocurrency selected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSelect = (coinId: string) => {
    setSelectedCoinId(coinId);
    if (errors.coinId) {
      setErrors((prev) => ({ ...prev, coinId: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/watchlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coinId: selectedCoinId }),
      });

      // 409 Conflict means already in watchlist — treat as success
      if (!res.ok && res.status !== 409) {
        throw new Error("Failed to add coin to watchlist");
      }

      const selectedCoin = coinCatalog.find((c) => c.id === selectedCoinId);
      if (selectedCoin) {
        setSubmitSuccess(true);
        setTimeout(() => {
          onAddCoin(selectedCoin);
          setIsSubmitting(false);
          setSelectedCoinId("");
          setSearch("");
          setSubmitSuccess(false);
        }, 1200);
      } else {
        setIsSubmitting(false);
      }
    } catch {
      setIsSubmitting(false);
    }
  };

  const selectedCoin = coinCatalog.find((c) => c.id === selectedCoinId);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Add Cryptocurrency</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="coinSearch" className={styles.label}>
              Select Cryptocurrency
            </label>
            {fetchError ? (
              <span className={styles.errorMessage}>Could not load coins. Is the API running?</span>
            ) : (
              <>
                <div className={styles.searchWrap}>
                  <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    id="coinSearch"
                    className={`${styles.searchInput} ${errors.coinId ? styles.error : ""}`}
                    type="search"
                    placeholder={coinCatalog.length === 0 ? "Loading…" : "Search by name or symbol…"}
                    aria-label="Search cryptocurrencies"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    disabled={isSubmitting || coinCatalog.length === 0}
                    autoComplete="off"
                  />
                </div>
                {selectedCoin && (
                  <div className={styles.selectedBadge}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {selectedCoin.name} ({selectedCoin.symbol})
                  </div>
                )}
                <div className={`${styles.coinList} ${errors.coinId ? styles.coinListError : ""}`} role="listbox" aria-label="Available coins">
                  {availableCoins.length === 0 ? (
                    <div className={styles.emptyList}>All cryptocurrencies are already in your watchlist!</div>
                  ) : filteredCoins.length === 0 ? (
                    <div className={styles.emptyList}>No coins match &ldquo;{search}&rdquo;</div>
                  ) : (
                    filteredCoins.map((coin) => (
                      <button
                        key={coin.id}
                        type="button"
                        role="option"
                        aria-selected={coin.id === selectedCoinId}
                        className={`${styles.coinOption} ${coin.id === selectedCoinId ? styles.coinOptionSelected : ""}`}
                        onClick={() => handleSelect(coin.id)}
                        disabled={isSubmitting}
                      >
                        <span className={styles.coinName}>{coin.name}</span>
                        <span className={styles.coinSymbol}>{coin.symbol}</span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
            {errors.coinId && <span className={styles.errorMessage}>{errors.coinId}</span>}
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.submitBtn} ${submitSuccess ? styles.success : ""} ${isSubmitting ? styles.loading : ""}`}
              disabled={isSubmitting || availableCoins.length === 0 || fetchError}
            >
              {isSubmitting ? (
                <>
                  <span className={styles.spinner}></span>
                  Adding...
                </>
              ) : submitSuccess ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Added!
                </>
              ) : (
                "Add to Watchlist"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
