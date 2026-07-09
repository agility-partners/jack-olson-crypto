import styles from "./loading.module.css";

export default function BrowseLoading() {
  return (
    <div className={styles.container}>
      {/* Ticker strip placeholder */}
      <div className={styles.tickerSkeleton} aria-hidden="true" />

      {/* Nav placeholder */}
      <div className={styles.navSkeleton} aria-hidden="true" />

      {/* Page header */}
      <div className={styles.pageHeader}>
        <div className={styles.skeletonLine} style={{ width: 120, height: 32 }} />
        <div className={styles.skeletonLine} style={{ width: 220, height: 16, marginTop: 8 }} />
      </div>

      {/* Stats bar */}
      <div className={styles.statsRow}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.statCard} />
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.skeletonLine} style={{ width: 240, height: 36 }} />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.skeletonLine} style={{ width: 80, height: 36 }} />
        ))}
      </div>

      {/* Coin grid */}
      <div className={styles.grid}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={styles.cardSkeleton} />
        ))}
      </div>
    </div>
  );
}
