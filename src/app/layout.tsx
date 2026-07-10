import type { Metadata } from "next";
import "./globals.css";
import { ChatProvider } from "./components/ChatProvider";

export const metadata: Metadata = {
  title: "CryptoWatch — Watchlist",
  description: "Track your crypto assets in real time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ChatProvider>{children}</ChatProvider>
      </body>
    </html>
  );
}
