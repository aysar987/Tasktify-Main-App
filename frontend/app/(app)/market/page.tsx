import type { Metadata } from "next";
import Link from "next/link";
import { MarketplaceBrowser } from "@/components/marketplace-browser";
import { PageHeader, primaryButton } from "@/components/ui";

export const metadata: Metadata = {
  title: "Market",
};

export default async function MarketPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return (
    <>
      <PageHeader
        title="Jelajahi lapak yang tersedia"
        description="Temukan penyedia layanan terbaik untuk kebutuhan Anda."
        action={<Link href="/daftar-market" className={primaryButton}>Daftarkan lapak</Link>}
      />
      <MarketplaceBrowser initialQuery={q} />
    </>
  );
}