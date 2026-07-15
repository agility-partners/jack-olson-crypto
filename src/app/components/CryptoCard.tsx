import type { MouseEvent } from "react";
import Link from "next/link";
import { Coin, sparkPaths } from "@/app/lib/mockData";
import { formatPrice, pointsToSvgPath } from "@/app/lib/utils";
import CoinIcon from "./CoinIcon";
import Sparkline from "./Sparkline";
import styles from "./CryptoCard.module.css";

type Props = {
  coin: Coin;
  isListView?: boolean;
  isCompactView?: boolean;
  isBiggestGainer?: boolean;
  isBiggestLoser?: boolean;
  onRemove?: (coinId: string) => void;
  from?: string;
};

export default function CryptoCard({
  coin,
  isListView = false,
  isCompactView = false,
  isBiggestGainer,
  isBiggestLoser,
  onRemove,
  from,
}: Props) {
  const up = coin.change24h >= 0;
  const spark = pointsToSvgPath(coin.sparkline ?? []) ?? sparkPaths[coin.iconClass];

  const cardClass = [
    styles.coinCard,
    isListView ? styles.listCard : "",
    isCompactView ? styles.compactCard : "",
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
        href={from ? `/coins/${coin.id}?from=${from}` : `/coins/${coin.id}`}
        className={cardClass}
      >
        {isCompactView ? (
          <>
            <div className={styles.compactTop}>
              <CoinIcon iconClass={coin.iconClass} symbol={coin.symbol} />
              <div className={styles.compactNameWrap}>
                <span className={styles.compactSymbol}>{coin.symbol}</span>
                <span className={styles.compactName}>{coin.name}</span>
              </div>
              <span className={styles.compactRank}>#{coin.rank}</span>
            </div>
            <div className={styles.compactBottom}>
              <span className={styles.compactPrice}>{formatPrice(coin.price)}</span>
              <div className={`${styles.changeBadge} ${styles.compactBadge} ${up ? styles.up : styles.dn}`}>
                {up ? "↑" : "↓"} {Math.abs(coin.change24h).toFixed(2)}%
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={styles.cardTop}>
              <div className={styles.coinIdentity}>
                <CoinIcon iconClass={coin.iconClass} symbol={coin.symbol} />
                <div className={styles.coinNameWrap}>
                  <span className={`${styles.coinName}${coin.name.length > 18 ? ` ${styles.coinNameLong}` : ""}`}>{coin.name}</span>
                  <span className={styles.coinSymbol}>{coin.symbol}</span>
                </div>
              </div>
              {!isListView && <span className={styles.coinRank}>#{coin.rank}</span>}
            </div>

            <div className={styles.sparklineWrap}>
              <Sparkline spark={spark} id={coin.iconClass} up={up} tall={isListView} />
            </div>

            <div className={styles.cardBottom}>
              <div>
                <div className={styles.coinPrice}>{formatPrice(coin.price)}</div>
                <div className={styles.coinPriceSub}>USD</div>
              </div>
              <div className={styles.cardBottomRight}>
                {isListView && <span className={styles.coinRankInline}>#{coin.rank}</span>}
                <div className={`${styles.changeBadge} ${up ? styles.up : styles.dn}`}>
                  {up ? "↑" : "↓"} {Math.abs(coin.change24h).toFixed(2)}%
                </div>
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
          </>
        )}
      </Link>
    </div>
  );
}
