"use client";

import { useState } from "react";
import { Coin, coinDetails, sparkPaths } from "@/app/lib/mockData";
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
};

export default function AddCoinModal({ onClose, onAddCoin, currentCoins }: Props) {
  const [formData, setFormData] = useState<FormData>({ coinId: "" });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Get available coins (not already in watchlist)
  const availableCoins = Object.entries(coinDetails)
    .filter(([id]) => !currentCoins.some((c) => c.id === id))
    .map(([id, details]) => ({
      id,
      name: details.name,
      symbol: details.symbol,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.coinId.trim()) {
      newErrors.coinId = "Please select a cryptocurrency";
    } else if (!coinDetails[formData.coinId]) {
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

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    const selectedCoin = coinDetails[formData.coinId];
    if (selectedCoin) {
      const newCoin: Coin = {
        id: selectedCoin.id,
        name: selectedCoin.name,
        symbol: selectedCoin.symbol,
        iconClass: selectedCoin.iconClass,
        rank: selectedCoin.rank,
        price: selectedCoin.price,
        change24h: selectedCoin.change24h,
        marketCap: selectedCoin.marketCap,
        volume: selectedCoin.volume,
      };

      setSubmitSuccess(true);
      setTimeout(() => {
        onAddCoin(newCoin);
        setIsSubmitting(false);
        setFormData({ coinId: "" });
        setSubmitSuccess(false);
      }, 1200);
    } else {
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
            <select
              id="coinId"
              name="coinId"
              value={formData.coinId}
              onChange={handleChange}
              className={`${styles.select} ${errors.coinId ? styles.error : ""}`}
              disabled={isSubmitting}
            >
              <option value="">Choose a coin...</option>
              {availableCoins.map((coin) => (
                <option key={coin.id} value={coin.id}>
                  {coin.name} ({coin.symbol})
                </option>
              ))}
            </select>
            {errors.coinId && <span className={styles.errorMessage}>{errors.coinId}</span>}
            {availableCoins.length === 0 && (
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
              disabled={isSubmitting || availableCoins.length === 0}
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
