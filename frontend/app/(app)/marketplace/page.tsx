import type { Metadata } from "next";
import Link from "next/link";
import { MarketplaceBrowser } from "@/components/marketplace-browser";
import { TaskMarketBrowser } from "@/components/task-market-browser";
import { PageHeader, primaryButton } from "@/components/ui";

export const metadata: Metadata = {
  title: "Marketplace",
};

export default async function MarketplacePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return (
    <>
      <PageHeader
        title="Jelajahi lapak dan task yang tersedia"
        action={<Link href="/daftar-lapak" className={primaryButton}>Daftarkan lapak</Link>}
      />
      <MarketplaceBrowser initialQuery={q} />
      <div className="mt-8">
        <TaskMarketBrowser initialQuery={q} />
      </div>
    </>
  );
}
