import Link from "next/link";
import { Brand } from "@/components/brand";

type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export function LegalPage({
  title,
  summary,
  sections,
}: {
  title: string;
  summary: string;
  sections: LegalSection[];
}) {
  return (
    <main className="min-h-dvh bg-slate-50 px-4 py-8 text-slate-800 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Brand />
          <Link href="/register" className="text-sm font-bold text-orange-700 hover:underline">
            Kembali ke pendaftaran
          </Link>
        </header>
        <article className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <p className="text-sm font-bold uppercase tracking-wider text-orange-700">Tasktify</p>
          <h1 className="mt-2 font-[var(--font-manrope)] text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-3xl leading-7 text-slate-600">{summary}</p>
          <p className="mt-3 text-sm text-slate-500">Berlaku sejak 4 Oktober 2026</p>
          <div className="mt-8 space-y-8">
            {sections.map((section, index) => (
              <section key={section.title} aria-labelledby={`legal-section-${index}`}>
                <h2 id={`legal-section-${index}`} className="text-xl font-bold">{section.title}</h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-3 leading-7 text-slate-700">{paragraph}</p>
                ))}
                {section.bullets && (
                  <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-slate-700">
                    {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                  </ul>
                )}
              </section>
            ))}
          </div>
          <p className="mt-10 border-t border-slate-200 pt-6 text-sm leading-6 text-slate-600">
            Pertanyaan tentang dokumen ini? Hubungi <a className="font-semibold text-orange-700 underline" href="mailto:admin@tasktify.id">admin@tasktify.id</a>.
          </p>
        </article>
        <footer className="flex flex-wrap gap-x-6 gap-y-2 px-2 py-6 text-sm font-semibold text-slate-600">
          <Link href="/privacy-policy" className="hover:text-orange-700">Kebijakan Privasi</Link>
          <Link href="/terms-of-service" className="hover:text-orange-700">Syarat Layanan</Link>
          <Link href="/login" className="hover:text-orange-700">Masuk</Link>
        </footer>
      </div>
    </main>
  );
}
