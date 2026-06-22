import styles from "./CoinIcon.module.css";

type Props = {
  iconClass: string;
  symbol: string;
  /** "sm" (38 px, card style) | "lg" (64 px, detail style). Defaults to "sm". */
  size?: "sm" | "lg";
};

/**
 * Shared coin-icon avatar used by CryptoCard (sm) and the coin detail page (lg).
 * Consolidates the per-coin colour classes that were previously duplicated in
 * CryptoCard.module.css and coins/[id]/page.module.css.
 */
export default function CoinIcon({ iconClass, symbol, size = "sm" }: Props) {
  const coinClass = styles[iconClass as keyof typeof styles] ?? "";
  return (
    <div className={`${styles.icon} ${styles[size]} ${coinClass}`}>
      {symbol.slice(0, 3)}
    </div>
  );
}
