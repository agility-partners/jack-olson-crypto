"use client";

import { useEffect, useMemo, useState } from "react";
import { Coin } from "@/app/lib/mockData";
import styles from "./AddCoinModal.module.css";

type FormData = {
  coinId: string;
};

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
  const [coinCatalog, setCoinCatalog] = useState<Coin[]>(allCoins ?? []);
  const [fetchError, setFetchError] = useState(false);
  const [formData, setFormData] = useState<FormData>({ coinId: "" });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (allCoins) {
      setCoinCatalog(allCoins);
      setFetchError(false);
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
          setCoinCatalog(data);
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

  const availableCoins = useMemo(
    () => coinCatalog
      .filter((coin) => !currentCoins.some((c) => c.id === coin.id))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [coinCatalog, currentCoins],
  );

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.coinId.trim()) {
      newErrors.coinId = "Please select a cryptocurrency";
    } else if (!coinCatalog.find((c) => c.id === formData.coinId)) {
      newErrors.coinId = "Invalid cryptocurrency selected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
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
        body: JSON.stringify({ coinId: formData.coinId }),
      });

      // 409 Conflict means already in watchlist — treat as success
      if (!res.ok && res.status !== 409) {
        throw new Error("Failed to add coin to watchlist");
      }

      const selectedCoin = coinCatalog.find((c) => c.id === formData.coinId);
      if (selectedCoin) {
        setSubmitSuccess(true);
        setTimeout(() => {
          onAddCoin(selectedCoin);
          setIsSubmitting(false);
          setFormData({ coinId: "" });
          setSubmitSuccess(false);
        }, 1200);
      } else {
        setIsSubmitting(false);
      }
    } catch {
      setIsSubmitting(false);
    }
  };

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
            <label htmlFor="coinId" className={styles.label}>
              Select Cryptocurrency
            </label>
            {fetchError ? (
              <span className={styles.errorMessage}>Could not load coins. Is the API running?</span>
            ) : (
              <select
                id="coinId"
                name="coinId"
                value={formData.coinId}
                onChange={handleChange}
                className={`${styles.select} ${errors.coinId ? styles.error : ""}`}
                disabled={isSubmitting || coinCatalog.length === 0}
              >
                <option value="">{coinCatalog.length === 0 ? "Loading…" : "Choose a coin..."}</option>
                {availableCoins.map((coin) => (
                  <option key={coin.id} value={coin.id}>
                    {coin.name} ({coin.symbol})
                  </option>
                ))}
              </select>
            )}
            {errors.coinId && <span className={styles.errorMessage}>{errors.coinId}</span>}
            {!fetchError && coinCatalog.length > 0 && availableCoins.length === 0 && (
              <span className={styles.infoMessage}>All cryptocurrencies are already in your watchlist!</span>
            )}
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
