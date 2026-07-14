import styles from "./RouteLoading.module.css";

type RouteLoadingVariant = "watchlist" | "browse" | "assistant";

type Props = {
  variant: RouteLoadingVariant;
};

function WatchlistOrBrowseLoading({ variant }: { variant: "watchlist" | "browse" }) {
  const headingWidth = variant === "watchlist" ? 180 : 120;
  const subtitleWidth = variant === "watchlist" ? 260 : 220;
  const filterCount = variant === "watchlist" ? 7 : 5;

  return (
    <div className={styles.container}>
      <div className={styles.tickerSkeleton} aria-hidden="true" />
      <div className={styles.navSkeleton} aria-hidden="true" />

      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderContent}>
          <div className={styles.skeletonLine} style={{ width: headingWidth, height: 32 }} />
          <div className={styles.skeletonLine} style={{ width: subtitleWidth, height: 16, marginTop: 8 }} />
        </div>
        {variant === "watchlist" && (
          <div className={styles.heroSkeleton} aria-hidden="true" />
        )}
      </div>

      <div className={styles.statsRow}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.statCard} />
        ))}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.skeletonLine} style={{ width: 220, height: 40 }} />
        {Array.from({ length: filterCount }).map((_, i) => (
          <div key={i} className={styles.skeletonLine} style={{ width: 88, height: 40 }} />
        ))}
        {variant === "watchlist" && (
          <div className={styles.toolbarActions}>
            <div className={styles.skeletonLine} style={{ width: 112, height: 44 }} />
            <div className={styles.skeletonLine} style={{ width: 92, height: 40 }} />
          </div>
        )}
      </div>

      <div className={styles.grid}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={styles.cardSkeleton} />
        ))}
      </div>
    </div>
  );
}

function AssistantLoading() {
  return (
    <div className={styles.assistantShell}>
      <div className={styles.tickerSkeleton} aria-hidden="true" />
      <div className={styles.navSkeleton} aria-hidden="true" />

      <div className={styles.assistantWrapper}>
        <div className={styles.assistantHeader}>
          <div className={styles.assistantHeaderContent}>
            <div className={styles.iconSkeleton} aria-hidden="true" />
            <div>
              <div className={styles.skeletonLine} style={{ width: 180, height: 28 }} />
              <div className={styles.skeletonLine} style={{ width: 260, height: 14, marginTop: 8 }} />
            </div>
          </div>
          <div className={styles.skeletonLine} style={{ width: 72, height: 28, borderRadius: 999 }} />
        </div>

        <div className={styles.chatArea}>
          <div className={styles.emptyState}>
            <div className={styles.iconSkeleton} aria-hidden="true" />
            <div className={styles.skeletonLine} style={{ width: 280, height: 28 }} />
            <div className={styles.skeletonLine} style={{ width: "min(100%, 420px)", height: 16 }} />
            <div className={styles.suggestionRow}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.skeletonLine} style={{ width: 156, height: 36, borderRadius: 999 }} />
              ))}
            </div>
          </div>
        </div>

        <div className={styles.inputBar}>
          <div className={styles.skeletonLine} style={{ flex: 1, height: 46, minWidth: 0 }} />
          <div className={styles.sendSkeleton} aria-hidden="true" />
        </div>

        <div className={styles.disclaimerSkeleton} aria-hidden="true" />
      </div>
    </div>
  );
}

export default function RouteLoading({ variant }: Props) {
  if (variant === "assistant") {
    return <AssistantLoading />;
  }

  return <WatchlistOrBrowseLoading variant={variant} />;
}
