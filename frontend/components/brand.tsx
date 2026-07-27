import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200">
      <span className="grid size-10 place-items-center rounded-xl bg-orange-600 text-white">
        <CheckCircle2 className="size-6" strokeWidth={2.5} />
      </span>
      {!compact && <span className="font-[var(--font-manrope)] text-xl font-extrabold tracking-tight text-slate-950">Tasktify</span>}
    </Link>
  );
}
