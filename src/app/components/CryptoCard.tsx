import Link from "next/link";
import { Coin, sparkPaths } from "@/app/lib/mockData";
import { formatPrice } from "@/app/lib/utils";
import Sparkline from "./Sparkline";
import styles from "./CryptoCard.module.css";

type Props = { coin: Coin; isBiggestGainer?: boolean; isBiggestLoser?: boolean };

export default function CryptoCard({ coin, isBiggestGainer, isBiggestLoser }: Props) {
  const up = coin.change24h >= 0;
  const spark = sparkPaths[coin.iconClass];

  const cardClass = [
    styles.coinCard,
    isBiggestGainer ? styles.biggestGainer : "",
    isBiggestLoser ? styles.biggestLoser : "",
  ].filter(Boolean).join(" ");

  return (
    <Link href={`/coins/${coin.id}`} className={cardClass}>
      <div className={styles.cardTop}>
        <div className={styles.coinIdentity}>
          <div className={`${styles.coinIcon} ${styles[coin.iconClass]}`}>
            {coin.symbol.slice(0, 3)}
          </div>
          <div className={styles.coinNameWrap}>
            <span className={styles.coinName}>{coin.name}</span>
            <span className={styles.coinSymbol}>{coin.symbol}</span>
          </div>
        </div>
        <span className={styles.coinRank}>#{coin.rank}</span>
      </div>

      <Sparkline spark={spark} id={coin.iconClass} />

      <div className={styles.cardBottom}>
        <div>
          <div className={styles.coinPrice}>{formatPrice(coin.price)}</div>
          <div className={styles.coinPriceSub}>USD</div>
        </div>
        <div className={`${styles.changeBadge} ${up ? styles.up : styles.dn}`}>
          {up ? "↑" : "↓"} {Math.abs(coin.change24h).toFixed(2)}%
        </div>
      </div>

      <div className={styles.cardMeta}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Market cap</span>
          <span className={styles.metaValue}>{coin.marketCap}</span>
        </div>
        <div className={`${styles.metaItem} ${styles.metaRight}`}>
          <span className={styles.metaLabel}>24h volume</span>
          <span className={styles.metaValue}>{coin.volume}</span>
        </div>
      </div>
    </Link>
  );
}
