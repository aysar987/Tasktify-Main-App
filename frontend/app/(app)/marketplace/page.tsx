import type { Metadata } from "next";
import { MarketplaceBrowser } from "@/components/marketplace-browser";
import { TaskMarketBrowser } from "@/components/task-market-browser";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Marketplace",
};

export default async function MarketplacePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return (
    <>
      <PageHeader
        eyebrow="Marketplace"
        title="Jelajahi lapak dan task yang tersedia"
        description="Lihat daftar marketplace yang aktif, lalu pilih task yang paling cocok dengan kemampuan Anda."
      />
      <MarketplaceBrowser initialQuery={q} />
      <div className="mt-8">
        <TaskMarketBrowser initialQuery={q} />
      </div>
    </>
  );
}
