import Link from "next/link";
import { coinDetails, sparkPaths } from "@/app/lib/mockData";
import { formatPrice, formatSupply, pointsToSvgPath } from "@/app/lib/utils";
import { getCoinById } from "@/app/lib/serverCoinData";
import CoinIcon from "@/app/components/CoinIcon";
import Sparkline from "@/app/components/Sparkline";
import Navigation from "@/app/components/Navigation";
import styles from "./page.module.css";

export default async function CoinDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: coinId } = await params;
  const staticDetail = coinDetails[coinId];

  if (!staticDetail) {
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

  const liveCoin = await getCoinById(coinId);

  // Overlay live market data from the API onto the static coin detail record.
  // Static fields (description, website, founded) always come from mockData.
  const coin = {
    ...staticDetail,
    price: liveCoin?.price ?? staticDetail.price,
    change24h: liveCoin?.change24h ?? staticDetail.change24h,
    change7d: liveCoin?.change7d ?? staticDetail.change7d,
    change30d: liveCoin?.change30d ?? staticDetail.change30d,
    change1y: liveCoin?.change1y ?? staticDetail.change1y,
    rank: liveCoin?.rank ?? staticDetail.rank,
    marketCap: liveCoin?.marketCap ?? staticDetail.marketCap,
    marketCapRaw: liveCoin?.marketCapRaw ?? staticDetail.marketCapRaw,
    volume: liveCoin?.volume ?? staticDetail.volume,
    volumeRaw: liveCoin?.volumeRaw ?? staticDetail.volumeRaw,
    sparkline: liveCoin?.sparkline ?? staticDetail.sparkline,
    allTimeHigh: liveCoin?.ath ?? staticDetail.allTimeHigh,
    allTimeLow: liveCoin?.atl ?? staticDetail.allTimeLow,
    circulatingSupply:
      liveCoin?.circulatingSupplyRaw != null
        ? formatSupply(liveCoin.circulatingSupplyRaw, staticDetail.symbol)
        : staticDetail.circulatingSupply,
    totalSupply:
      liveCoin?.totalSupplyRaw != null
        ? formatSupply(liveCoin.totalSupplyRaw, staticDetail.symbol)
        : staticDetail.totalSupply,
    maxSupply:
      liveCoin != null
        ? (liveCoin.maxSupplyRaw != null
            ? formatSupply(liveCoin.maxSupplyRaw, staticDetail.symbol)
            : null)
        : staticDetail.maxSupply,
  };

  const up24h = coin.change24h >= 0;
  const up7d = coin.change7d >= 0;
  const up30d = coin.change30d >= 0;
  const up1y = coin.change1y >= 0;

  const spark = pointsToSvgPath(coin.sparkline ?? []) ?? sparkPaths[coin.iconClass];

  return (
    <>
      <Navigation />
      <div className={styles.container}>
        {/* Back Button */}
        <Link href="/" className={styles.backButton}>
          ← Back to Watchlist
        </Link>

        {/* Header Section */}
        <div className={styles.header}>
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
              <div className={styles.price}>{formatPrice(coin.price)}</div>
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
            {spark && <Sparkline spark={spark} id={coin.iconClass} up={up24h} />}
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

