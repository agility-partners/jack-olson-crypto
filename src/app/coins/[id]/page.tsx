"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { coinDetails, sparkPaths, watchlistCoins } from "@/app/lib/mockData";
import { formatPrice } from "@/app/lib/utils";
import CoinIcon from "@/app/components/CoinIcon";
import Sparkline from "@/app/components/Sparkline";
import Navigation from "@/app/components/Navigation";
import styles from "./page.module.css";

export default function CoinDetailPage() {
  const params = useParams();
  const coinId = params.id as string;
  const coin = coinDetails[coinId];
  const spark = sparkPaths[coin?.iconClass];

  if (!coin) {
    return (
      <>
        <Navigation />
        <div className={styles.errorContainer}>
          <h1>Coin not found</h1>
          <p>The cryptocurrency you're looking for doesn't exist.</p>
          <Link href="/" className={styles.backLink}>
            ← Back to Watchlist
          </Link>
        </div>
      </>
    );
  }

  const up24h = coin.change24h >= 0;
  const up7d = coin.change7d >= 0;
  const up30d = coin.change30d >= 0;
  const up1y = coin.change1y >= 0;

  // Determine if this coin is the biggest winner or loser
  let biggestGainer = watchlistCoins[0];
  let biggestLoser = watchlistCoins[0];
  for (const c of watchlistCoins) {
    if (c.change24h > biggestGainer.change24h) biggestGainer = c;
    if (c.change24h < biggestLoser.change24h) biggestLoser = c;
  }

  const isBiggestGainer = coin.id === biggestGainer.id;
  const isBiggestLoser = coin.id === biggestLoser.id;
  const headerClass = [
    styles.header,
    isBiggestGainer ? styles.headerBiggestGainer : "",
    isBiggestLoser ? styles.headerBiggestLoser : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <Navigation />
      <div className={styles.container}>
        {/* Back Button */}
        <Link href="/" className={styles.backButton}>
          ← Back to Watchlist
        </Link>

        {/* Header Section */}
        <div className={headerClass}>
          <div className={styles.titleSection}>
            <CoinIcon iconClass={coin.iconClass} symbol={coin.symbol} size="lg" />
            <div className={styles.titleContent}>
              <h1>{coin.name}</h1>
              <span className={styles.symbol}>{coin.symbol}</span>
              <span className={styles.rank}>Rank #{coin.rank}</span>
            </div>
          </div>

          {/* Price & Change */}
          <div className={styles.priceSection}>
            <div className={styles.priceMain}>
              <div className={`${styles.price} ${isBiggestGainer ? styles.priceGainer : isBiggestLoser ? styles.priceLoser : ""}`}>
                {formatPrice(coin.price)}
              </div>
              <div className={styles.currency}>USD</div>
            </div>
            <div className={styles.changes}>
              <div className={`${styles.changeItem} ${up24h ? styles.up : styles.down}`}>
                <span className={styles.changeLabel}>24h</span>
                <span className={styles.changeValue}>
                  {up24h ? "↑" : "↓"} {Math.abs(coin.change24h).toFixed(2)}%
                </span>
              </div>
              <div className={`${styles.changeItem} ${up7d ? styles.up : styles.down}`}>
                <span className={styles.changeLabel}>7d</span>
                <span className={styles.changeValue}>
                  {up7d ? "↑" : "↓"} {Math.abs(coin.change7d).toFixed(2)}%
                </span>
              </div>
              <div className={`${styles.changeItem} ${up30d ? styles.up : styles.down}`}>
                <span className={styles.changeLabel}>30d</span>
                <span className={styles.changeValue}>
                  {up30d ? "↑" : "↓"} {Math.abs(coin.change30d).toFixed(2)}%
                </span>
              </div>
              <div className={`${styles.changeItem} ${up1y ? styles.up : styles.down}`}>
                <span className={styles.changeLabel}>1y</span>
                <span className={styles.changeValue}>
                  {up1y ? "↑" : "↓"} {Math.abs(coin.change1y).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className={styles.chartSection}>
          <h3>Price Chart</h3>
          <div className={styles.chartContainer}>
            {spark && <Sparkline spark={spark} id={coin.iconClass} />}
          </div>
        </div>

        {/* Description */}
        <div className={styles.description}>
          <h3>About {coin.name}</h3>
          <p>{coin.description}</p>
          <p>Founded in {coin.founded}</p>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Market Cap</span>
            <span className={styles.statValue}>{coin.marketCap}</span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>24h Volume</span>
            <span className={styles.statValue}>{coin.volume}</span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>All-Time High</span>
            <span className={styles.statValue}>${coin.allTimeHigh.toFixed(2)}</span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>All-Time Low</span>
            <span className={styles.statValue}>${coin.allTimeLow.toFixed(8)}</span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>Circulating Supply</span>
            <span className={styles.statValue}>{coin.circulatingSupply}</span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Supply</span>
            <span className={styles.statValue}>{coin.totalSupply}</span>
          </div>

          {coin.maxSupply && (
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Max Supply</span>
              <span className={styles.statValue}>{coin.maxSupply}</span>
            </div>
          )}

          <div className={styles.statCard}>
            <span className={styles.statLabel}>Official Website</span>
            <a href={coin.website} target="_blank" rel="noopener noreferrer" className={styles.websiteLink}>
              {coin.website.replace("https://", "")}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
