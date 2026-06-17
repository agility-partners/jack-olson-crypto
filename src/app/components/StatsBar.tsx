import styles from "./StatsBar.module.css";

type Stat = {
  label: string;
  value: string;
  change?: string;
  changeDir?: "up" | "dn";
};

type Props = {
  coinCount?: number;
  gainerCount?: number;
};

export default function StatsBar({ coinCount, gainerCount }: Props) {
  const gainersValue =
    coinCount !== undefined && gainerCount !== undefined
      ? `${gainerCount} / ${coinCount}`
      : "— / —";

  const stats: Stat[] = [
    { label: "Total market cap", value: "$2.41T", change: "↑ 1.4%", changeDir: "up" },
    { label: "24h volume",       value: "$94.2B" },
    { label: "BTC dominance",    value: "52.3%" },
    { label: "Gainers",          value: gainersValue, changeDir: "up" },
  ];

  return (
    <div className={styles.statsBar}>
      {stats.map((stat) => (
        <div key={stat.label} className={styles.statItem}>
          <div className={styles.statLabel}>{stat.label}</div>
          <div className={styles.statValue}>
            {stat.value}
            {stat.change && (
              <span className={`${styles.statChange} ${stat.changeDir === "up" ? styles.up : styles.dn}`}>
                {stat.change}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
