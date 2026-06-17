import Link from "next/link";
import styles from "./Navigation.module.css";

export default function Navigation() {
  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.navLogo}>
        <span className={styles.navLogoDot} />
        CryptoWatch
      </Link>

      <ul className={styles.navLinks}>
        <li><Link href="/" className={styles.active}>Watchlist</Link></li>
        <li><Link href="/coins/browse">All Coins</Link></li>
      </ul>
    </nav>
  );
}
