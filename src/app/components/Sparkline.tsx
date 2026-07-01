import { SparkPath } from "@/app/lib/mockData";
import styles from "./Sparkline.module.css";

type Props = {
  spark: SparkPath;
  id: string;
  up: boolean;
  tall?: boolean;
};

export default function Sparkline({ spark, id, up, tall = false }: Props) {
  const strokeColor = up ? "#4ade80" : "#f87171";
  const sparklineClassName = tall ? `${styles.sparkline} ${styles.tall}` : styles.sparkline;

  return (
    <div className={sparklineClassName}>
      <svg viewBox="0 0 220 40" preserveAspectRatio="none">
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
