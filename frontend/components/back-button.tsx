"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

// Pages visited inside the app since the last full page load. It lives in
// module scope, so it survives client-side navigation and resets on reload.
// `window.history.length` cannot be used instead: it also counts pages from
// other sites and the blank page of a new tab, so "back" could leave the app.
let pagesVisited = 0;

/** Counts in-app page changes; mount once in a layout that wraps the app. */
export function NavigationTracker() {
  const pathname = usePathname();
  useEffect(() => {
    pagesVisited += 1;
  }, [pathname]);
  return null;
}

/**
 * Returns to the previous page in the app. When the page was opened directly
 * (new tab, shared link, reload), it goes to `fallbackHref` instead.
 */
export function BackButton({
  fallbackHref,
  label = "Kembali ke halaman sebelumnya",
  className,
}: {
  fallbackHref: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => (pagesVisited > 1 ? router.back() : router.push(fallbackHref))}
      className={className}
    >
      <ArrowLeft className="size-5" />
    </button>
  );
}
