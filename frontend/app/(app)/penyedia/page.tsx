import { ProviderBrowser } from "@/components/provider-browser";
import { PageHeader } from "@/components/ui";

export default async function ProviderDirectoryPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return <><PageHeader eyebrow="Penyedia" title="Temukan ahlinya" description="Pilih dari tenaga profesional terverifikasi dan lihat reputasi mereka sebelum membuat keputusan." /><ProviderBrowser initialQuery={q} /></>;
}
