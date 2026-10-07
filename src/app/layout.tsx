import { Fraunces, DM_Sans } from "next/font/google";
import type { Metadata } from "next";
import { getSeason } from "@/lib/season";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3456",
  ),
  title: "Mums' Night Out",
  description: "Plan the next mums' evening — vote, pick, done.",
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/icon-192.png?v=2", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png?v=2", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png?v=2", sizes: "180x180" }],
  },
  openGraph: {
    title: "Mums' Night Out",
    description: "Plan the next mums' evening — vote, pick, done.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mums' Night Out",
    description: "Plan the next mums' evening — vote, pick, done.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const season = getSeason();
  return (
    <html
      lang="en"
      data-season={season}
      className={`${fraunces.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
