"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getTaskImageUrl } from "@/lib/api";

/**
 * Task photos are private, so they are loaded with the user's token and shown
 * from an object URL. `undefined` while loading, `null` if it failed.
 */
function useTaskImages(paths: string[]) {
  const key = paths.join("|");
  const [urls, setUrls] = useState<Record<string, string | null>>({});
  useEffect(() => {
    let cancelled = false;
    for (const path of key ? key.split("|") : []) {
      getTaskImageUrl(path)
        .then((url) => { if (!cancelled) setUrls((current) => ({ ...current, [path]: url })); })
        .catch(() => { if (!cancelled) setUrls((current) => ({ ...current, [path]: null })); });
    }
    return () => { cancelled = true; };
  }, [key]);
  return urls;
}

/** Small square thumbnail of a task's first photo; renders nothing without a photo. */
export function TaskThumbnail({ images, className = "size-14" }: { images: string[]; className?: string }) {
  const first = images[0];
  const urls = useTaskImages(first ? [first] : []);
  const url = first ? urls[first] : null;
  if (!first || url === null) return null;
  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-xl bg-slate-100 ${className}`}>
      {url && <img src={url} alt="Foto task" className="absolute inset-0 size-full object-cover" />}
    </span>
  );
}

/** Cover image for a card; falls back to `fallback` when there is no usable photo. */
export function TaskCover({ images, fallback }: { images: string[]; fallback: React.ReactNode }) {
  const first = images[0];
  const urls = useTaskImages(first ? [first] : []);
  const url = first ? urls[first] : null;
  if (!first || url === null) return <>{fallback}</>;
  return url ? <img src={url} alt="" className="absolute inset-0 size-full object-cover" /> : <span className="absolute inset-0 animate-pulse bg-blue-200" />;
}

/**
 * Swipeable photo strip for the task detail pages. Tap a photo to open it full
 * screen. Renders nothing when the task has no photo or none could be loaded.
 */
export function TaskGallery({ images }: { images: string[] }) {
  const urls = useTaskImages(images);
  const [active, setActive] = useState(0);
  const [viewer, setViewer] = useState<number | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const visible = images.filter((path) => urls[path] !== null);

  if (!visible.length) return null;

  function onScroll() {
    const strip = stripRef.current;
    if (strip) setActive(Math.round(strip.scrollLeft / strip.clientWidth));
  }

  function goTo(index: number) {
    const strip = stripRef.current;
    if (strip) strip.scrollTo({ left: index * strip.clientWidth, behavior: "smooth" });
  }

  return (
    <section aria-label="Foto task" className="relative mb-6">
      <div ref={stripRef} onScroll={onScroll} className="flex snap-x snap-mandatory overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100 [scrollbar-width:none]">
        {visible.map((path, index) => (
          <button
            key={path}
            type="button"
            onClick={() => setViewer(index)}
            aria-label={`Buka foto ${index + 1} dari ${visible.length} layar penuh`}
            className="relative aspect-[16/9] w-full shrink-0 cursor-zoom-in snap-center sm:aspect-[21/9]"
          >
            {urls[path] ? (
              <img src={urls[path]!} alt={`Foto task ${index + 1}`} className="absolute inset-0 size-full object-cover" />
            ) : (
              <span className="absolute inset-0 animate-pulse bg-slate-200" />
            )}
          </button>
        ))}
      </div>
      {visible.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-2">
          {visible.map((path, index) => (
            <button
              key={path}
              type="button"
              aria-label={`Lihat foto ${index + 1}`}
              onClick={() => goTo(index)}
              className={`pointer-events-auto h-2 rounded-full shadow transition-all ${active === index ? "w-6 bg-white" : "w-2 bg-white/60"}`}
            />
          ))}
        </div>
      )}
      {viewer !== null && (
        <PhotoViewer urls={visible.map((path) => urls[path] ?? "")} start={viewer} onClose={() => setViewer(null)} />
      )}
    </section>
  );
}

function PhotoViewer({ urls, start, onClose }: { urls: string[]; start: number; onClose: () => void }) {
  const [index, setIndex] = useState(start);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const strip = stripRef.current;
    if (strip) strip.scrollLeft = start * strip.clientWidth;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [start]);

  function goTo(next: number) {
    const strip = stripRef.current;
    const clamped = Math.max(0, Math.min(urls.length - 1, next));
    if (strip) strip.scrollTo({ left: clamped * strip.clientWidth, behavior: "smooth" });
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") goTo(index + 1);
      if (event.key === "ArrowLeft") goTo(index - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div role="dialog" aria-modal="true" aria-label="Foto task layar penuh" className="fixed inset-0 z-[60] flex flex-col bg-slate-950">
      <div className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-white">
        <span>{urls.length > 1 ? `${index + 1} / ${urls.length}` : ""}</span>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Tutup foto" className="grid size-11 cursor-pointer place-items-center rounded-full bg-white/10 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40">
          <X className="size-5" />
        </button>
      </div>
      <div
        ref={stripRef}
        onScroll={(event) => setIndex(Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth))}
        className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
      >
        {urls.map((url, position) => (
          <div key={position} className="flex w-full shrink-0 snap-center items-center justify-center p-4">
            {url && <img src={url} alt={`Foto task ${position + 1}`} className="max-h-full max-w-full object-contain" />}
          </div>
        ))}
      </div>
      {urls.length > 1 && (
        <>
          <button type="button" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="Foto sebelumnya" className="absolute left-3 top-1/2 hidden size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 sm:grid">
            <ChevronLeft className="size-6" />
          </button>
          <button type="button" onClick={() => goTo(index + 1)} disabled={index === urls.length - 1} aria-label="Foto berikutnya" className="absolute right-3 top-1/2 hidden size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 sm:grid">
            <ChevronRight className="size-6" />
          </button>
        </>
      )}
    </div>
  );
}
