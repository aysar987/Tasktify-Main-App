import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import "./globals.css";

const poppinsBody = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-inter" });
const poppinsHeading = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: {
    default: "Tasktify — Bantuan Tepercaya, Tanpa Ribet",
    template: "%s | Tasktify",
  },
  description:
    "Find, request and manage local service tasks — plumbers, electricians, and more.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/images/icon-tasktify.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/icons/icon-192.png",
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
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
      <body className={`${poppinsBody.variable} ${poppinsHeading.variable} font-[var(--font-inter)] antialiased`}>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
