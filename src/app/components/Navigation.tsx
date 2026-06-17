"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Navigation.module.css";

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.navLogo}>
        <span className={styles.navLogoDot} />
        CryptoWatch
      </Link>

      <ul className={styles.navLinks}>
        <li>
          <Link href="/" className={pathname === "/" ? styles.active : undefined}>
            Watchlist
          </Link>
        </li>
        <li>
          <Link
            href="/coins/browse"
            className={pathname === "/coins/browse" ? styles.active : undefined}
          >
            All Coins
          </Link>
        </li>
      </ul>
    </nav>
  );
}
