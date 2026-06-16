import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CryptoWatch — Watchlist",
  description: "Track your crypto assets in real time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
