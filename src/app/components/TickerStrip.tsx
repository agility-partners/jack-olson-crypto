import { Coin } from "@/app/lib/mockData";
import { formatPrice } from "@/app/lib/utils";
import styles from "./TickerStrip.module.css";

type Props = { coins: Coin[] };

export default function TickerStrip({ coins }: Props) {
  // Sort coins by market cap value (descending)
  const sortedCoins = [...coins].sort((a, b) => {
    const aValue = parseFloat(a.marketCap.replace(/[$B,T]/g, "")) * (a.marketCap.includes("T") ? 1000 : 1);
    const bValue = parseFloat(b.marketCap.replace(/[$B,T]/g, "")) * (b.marketCap.includes("T") ? 1000 : 1);
    return bValue - aValue;
  });

  // Duplicate items for seamless loop
  const items = [...sortedCoins, ...sortedCoins];

  return (
    <div className={styles.tickerWrap} aria-hidden="true">
      <div className={styles.tickerTrack}>
        {items.map((coin, i) => {
          const up = coin.change24h >= 0;
          return (
            <span key={`${coin.id}-${i}`} className={styles.tickerItem}>
              <span className={styles.sym}>{coin.symbol}</span>
              <span className={styles.price}>{formatPrice(coin.price)}</span>
              <span className={up ? styles.up : styles.dn}>
                {up ? "+" : ""}{coin.change24h.toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
