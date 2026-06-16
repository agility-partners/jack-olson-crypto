import { SparkPath } from "@/app/lib/mockData";
import styles from "./Sparkline.module.css";

type Props = {
  spark: SparkPath;
  id: string;
};

export default function Sparkline({ spark, id }: Props) {
  const strokeColor = spark.up ? "#4ade80" : "#f87171";

  return (
    <div className={styles.sparkline}>
      <svg viewBox="0 0 240 44" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`sg-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={strokeColor} stopOpacity={0.3} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={`${spark.d} L240,44 L0,44 Z`} fill={`url(#sg-${id})`} />
        <path d={spark.d} fill="none" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" />
      </svg>
    </div>
  );
}
