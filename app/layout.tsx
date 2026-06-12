import type { Metadata } from "next";
import { LEAGUE_NAME } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: LEAGUE_NAME,
  description: "World Cup 2026 fantasy league — live scores and standings",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
