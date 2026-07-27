import { MarketplaceBrowser } from "@/components/marketplace-browser";
import { PageHeader } from "@/components/ui";

export default async function MarketplacePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return <><PageHeader eyebrow="Marketplace" title="Temukan ahlinya" description="Pilih dari tenaga profesional terverifikasi dan lihat reputasi mereka sebelum membuat keputusan." /><MarketplaceBrowser initialQuery={q} /></>;
}
