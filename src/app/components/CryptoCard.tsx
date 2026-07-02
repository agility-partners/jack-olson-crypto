import type { MouseEvent } from "react";
import Link from "next/link";
import { Coin, sparkPaths } from "@/app/lib/mockData";
import { formatPrice, pointsToSvgPath } from "@/app/lib/utils";
import CoinIcon from "./CoinIcon";
import Sparkline from "./Sparkline";
import styles from "./CryptoCard.module.css";

type Props = {
  coin: Coin;
  isBiggestGainer?: boolean;
  isBiggestLoser?: boolean;
  onRemove?: (coinId: string) => void;
};

export default function CryptoCard({ coin, isBiggestGainer, isBiggestLoser, onRemove }: Props) {
  const up = coin.change24h >= 0;
  const spark = pointsToSvgPath(coin.sparkline ?? []) ?? sparkPaths[coin.iconClass];

  const cardClass = [
    styles.coinCard,
    isBiggestGainer ? styles.biggestGainer : "",
    isBiggestLoser ? styles.biggestLoser : "",
    !up && !isBiggestGainer && !isBiggestLoser ? styles.loser : "",
  ].filter(Boolean).join(" ");

  const handleRemoveClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onRemove?.(coin.id);
  };

  return (
    <div className={styles.coinCardWrap}>
      {onRemove && (
        <button
          type="button"
          className={styles.removeBtn}
          onClick={handleRemoveClick}
          aria-label={`Remove ${coin.name} from watchlist`}
          title={`Remove ${coin.name} from watchlist`}
        >
          ×
        </button>
      )}

      <Link
        href={`/coins/${coin.id}`}
        className={cardClass}
      >
        <div className={`${styles.cardTop} ${onRemove ? styles.removableCardTop : ""}`.trim()}>
          <div className={styles.coinIdentity}>
            <CoinIcon iconClass={coin.iconClass} symbol={coin.symbol} />
            <div className={styles.coinNameWrap}>
              <span className={`${styles.coinName}${coin.name.length > 18 ? ` ${styles.coinNameLong}` : ""}`}>{coin.name}</span>
              <span className={styles.coinSymbol}>{coin.symbol}</span>
            </div>
          </div>
          <span className={styles.coinRank}>#{coin.rank}</span>
        </div>

        <Sparkline spark={spark} id={coin.iconClass} up={up} />

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
    </div>
  );
}
