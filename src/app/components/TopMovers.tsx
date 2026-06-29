import Link from "next/link";
import type { TopMover } from "@/app/lib/coinsApi";
import { formatPrice } from "@/app/lib/utils";
import CoinIcon from "./CoinIcon";
import styles from "./TopMovers.module.css";

type Props = {
  topMovers: TopMover[];
};

export default function TopMovers({ topMovers }: Props) {
  const gainers = topMovers.filter((m) => m.category === "gainer");
  const losers = topMovers.filter((m) => m.category === "loser");

  if (gainers.length === 0 && losers.length === 0) {
    return null;
  }

  return (
    <section className={styles.topMovers}>
      <h2 className={styles.sectionTitle}>Top Movers</h2>
      <div className={styles.columns}>
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <span className={styles.columnLabel + " " + styles.gainersLabel}>↑ Gainers</span>
          </div>
          <ul className={styles.moverList}>
            {gainers.map((mover) => (
              <MoverRow key={mover.id} mover={mover} />
            ))}
          </ul>
        </div>

        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <span className={styles.columnLabel + " " + styles.losersLabel}>↓ Losers</span>
          </div>
          <ul className={styles.moverList}>
            {losers.map((mover) => (
              <MoverRow key={mover.id} mover={mover} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function MoverRow({ mover }: { mover: TopMover }) {
  const isGainer = mover.category === "gainer";

  return (
    <li>
      <Link href={`/coins/${mover.id}`} className={styles.moverRow}>
        <span className={styles.rank}>#{mover.categoryRank}</span>
        <CoinIcon iconClass={mover.iconClass} symbol={mover.symbol} />
        <span className={styles.coinInfo}>
          <span className={styles.coinName}>{mover.name}</span>
          <span className={styles.coinSymbol}>{mover.symbol}</span>
        </span>
        <span className={styles.moverPrice}>{formatPrice(mover.price)}</span>
        <span className={`${styles.changeBadge} ${isGainer ? styles.up : styles.dn}`}>
          {isGainer ? "↑" : "↓"} {Math.abs(mover.change24h).toFixed(2)}%
        </span>
      </Link>
    </li>
  );
}
