"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Coin } from "@/app/lib/mockData";
import styles from "./AddCoinModal.module.css";

const MAX_SELECTION = 5;

type ValidationErrors = {
  coinId?: string;
};

type Props = {
  onClose: () => void;
  onAddCoin: (coins: Coin[]) => void;
  currentCoins: Coin[];
  allCoins?: Coin[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default function AddCoinModal({ onClose, onAddCoin, currentCoins, allCoins }: Props) {
  const [fetchedCoins, setFetchedCoins] = useState<Coin[]>([]);
  const [fetchError, setFetchError] = useState(false);
  const [selectedCoinIds, setSelectedCoinIds] = useState<string[]>([]);
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

  const atLimit = selectedCoinIds.length >= MAX_SELECTION;

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (selectedCoinIds.length === 0) {
      newErrors.coinId = "Please select a cryptocurrency";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleToggle = (coinId: string) => {
    setErrors((prev) => ({ ...prev, coinId: undefined }));
    setSelectedCoinIds((prev) => {
      if (prev.includes(coinId)) {
        return prev.filter((id) => id !== coinId);
      }
      if (prev.length >= MAX_SELECTION) {
        return prev;
      }
      return [...prev, coinId];
    });
  };

  const handleDeselect = (coinId: string) => {
    setSelectedCoinIds((prev) => prev.filter((id) => id !== coinId));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await Promise.all(
        selectedCoinIds.map((coinId) =>
          fetch(`${API_URL}/api/watchlist`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coinId }),
          }).then((res) => {
            // 409 Conflict means already in watchlist — treat as success
            if (!res.ok && res.status !== 409) {
              throw new Error(`Failed to add ${coinId}`);
            }
          }),
        ),
      );

      const selectedCoins = coinCatalog.filter((c) => selectedCoinIds.includes(c.id));
      setSubmitSuccess(true);
      setTimeout(() => {
        onAddCoin(selectedCoins);
        setIsSubmitting(false);
        setSelectedCoinIds([]);
        setSearch("");
        setSubmitSuccess(false);
      }, 1200);
    } catch {
      setIsSubmitting(false);
    }
  };

  const selectedCoins = coinCatalog.filter((c) => selectedCoinIds.includes(c.id));

  const submitLabel = selectedCoinIds.length > 0
    ? `Add to Watchlist (${selectedCoinIds.length})`
    : "Add to Watchlist";

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
                {selectedCoins.length > 0 && (
                  <div className={styles.selectedChips} aria-label="Selected coins">
                    {selectedCoins.map((coin) => (
                      <span key={coin.id} className={styles.chip}>
                        {coin.name}
                        <button
                          type="button"
                          className={styles.chipRemove}
                          onClick={() => handleDeselect(coin.id)}
                          aria-label={`Remove ${coin.name}`}
                          disabled={isSubmitting}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className={styles.listHeader}>
                  <span className={styles.selectionCounter} aria-live="polite">
                    {selectedCoinIds.length} / {MAX_SELECTION} selected
                  </span>
                </div>
                <div className={`${styles.coinList} ${errors.coinId ? styles.coinListError : ""}`} role="listbox" aria-label="Available coins" aria-multiselectable="true">
                  {availableCoins.length === 0 ? (
                    <div className={styles.emptyList}>All cryptocurrencies are already in your watchlist!</div>
                  ) : filteredCoins.length === 0 ? (
                    <div className={styles.emptyList}>No coins match &ldquo;{search}&rdquo;</div>
                  ) : (
                    filteredCoins.map((coin) => {
                      const isSelected = selectedCoinIds.includes(coin.id);
                      const isDisabled = isSubmitting || (atLimit && !isSelected);
                      return (
                        <button
                          key={coin.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          className={`${styles.coinOption} ${isSelected ? styles.coinOptionSelected : ""} ${atLimit && !isSelected ? styles.coinOptionDimmed : ""}`}
                          onClick={() => handleToggle(coin.id)}
                          disabled={isDisabled}
                        >
                          <span className={styles.coinName}>{coin.name}</span>
                          <span className={styles.coinOptionRight}>
                            <span className={styles.coinSymbol}>{coin.symbol}</span>
                            {coin.change24h != null && (
                              <span className={coin.change24h >= 0 ? styles.changePositive : styles.changeNegative}>
                                {coin.change24h >= 0 ? "▲" : "▼"} {Math.abs(coin.change24h).toFixed(2)}%
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })
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
                submitLabel
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
