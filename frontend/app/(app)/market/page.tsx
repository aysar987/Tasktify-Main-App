import type { Metadata } from "next";
import { MarketplaceBrowser } from "@/components/marketplace-browser";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Market",
};

export default async function MarketPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return (
    <>
      <PageHeader
        title="Market"
      />
      <MarketplaceBrowser initialQuery={q} />
    </>
  );
}