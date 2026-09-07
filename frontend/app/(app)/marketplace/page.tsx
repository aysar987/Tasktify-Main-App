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
        title="Jelajahi lapak dan task yang tersedia"
      />
      <MarketplaceBrowser initialQuery={q} />
      <div className="mt-8">
        <TaskMarketBrowser initialQuery={q} />
      </div>
    </>
  );
}
