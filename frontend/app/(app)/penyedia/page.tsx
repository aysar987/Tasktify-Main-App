import { Store } from "lucide-react";
import { PageHeader } from "@/components/ui";

export default function ProviderDirectoryPage() {
  return (
    <>
      <PageHeader eyebrow="Marketplace" title="Segera hadir" description="Halaman ini sedang disiapkan." />
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-500">
        <Store className="mx-auto size-9 text-slate-400" />
        <p className="mt-4">Konten akan segera tersedia di sini.</p>
      </div>
    </>
  );
}
