import { TaskMarketBrowser } from "@/components/task-market-browser";
import { PageHeader } from "@/components/ui";

export default async function MarketplacePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return <><PageHeader eyebrow="Marketplace" title="Ambil task, tanpa tawar-menawar" description="Pilih task yang cocok dengan keahlian Anda dan langsung kerjakan sesuai harga yang sudah ditetapkan client. Siapa cepat, dia dapat." /><TaskMarketBrowser initialQuery={q} /></>;
}
