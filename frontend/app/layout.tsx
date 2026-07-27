import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: {
    default: "Tasktify — Bantuan Tepercaya, Tanpa Ribet",
    template: "%s | Tasktify",
  },
  description:
    "Find, request and manage local service tasks — plumbers, electricians, and more.",
  manifest: "/manifest.json",
  icons: {
    icon: "/images/logo-tasktify.svg",
    shortcut: "/images/logo-tasktify.svg",
    apple: "/images/logo-tasktify.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tasktify",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2F6FE4",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} ${manrope.variable} font-[var(--font-inter)] antialiased`}>
        {children}
      </body>
    </html>
  );
}
