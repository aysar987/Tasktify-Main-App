"use client";

import Image from "next/image";
import { AnimatePresence, motion, usePresence, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

const desktopQuery = "(min-width: 768px)";

function subscribeToDesktop(onChange: () => void) {
  const mediaQuery = window.matchMedia(desktopQuery);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getDesktopSnapshot() {
  return window.matchMedia(desktopQuery).matches;
}

function getServerDesktopSnapshot() {
  return false;
}

function AuthRouteContent({
  children,
  reduceMotion,
  focusOnNavigation,
}: {
  children: ReactNode;
  reduceMotion: boolean;
  focusOnNavigation: boolean;
}) {
  const [isPresent] = usePresence();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPresent || !focusOnNavigation) return;
    contentRef.current?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
  }, [focusOnNavigation, isPresent]);

  return (
    <motion.div
      ref={contentRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: reduceMotion ? 0 : 0.15, ease: "easeInOut" } }}
      transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeInOut" }}
      aria-hidden={!isPresent}
      inert={!isPresent}
    >
      {children}
    </motion.div>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const isDesktop = useSyncExternalStore(subscribeToDesktop, getDesktopSnapshot, getServerDesktopSnapshot);
  const [focusedPathname, setFocusedPathname] = useState(pathname);

  useLayoutEffect(() => {
    if (focusedPathname === pathname) return;

    const focusTimer = window.setTimeout(() => setFocusedPathname(pathname), 0);
    return () => window.clearTimeout(focusTimer);
  }, [focusedPathname, pathname]);

  const reduceMotion = prefersReducedMotion;

  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-white px-6 py-10 font-[var(--font-poppins)] md:px-8 md:py-16">
      <div className="absolute left-6 top-5 hidden md:block lg:left-10 lg:top-8">
        <Image
          src="/images/wordmark-tasktify.svg"
          alt="Tasktify."
          width={140}
          height={39}
          priority
          className="h-[39px] w-[140px] object-contain object-left"
        />
      </div>
      <motion.div
        layout={isDesktop && !reduceMotion}
        transition={{ layout: { duration: reduceMotion ? 0 : 0.3, ease: "easeInOut" } }}
        className="w-full max-w-[420px] md:rounded-[32px] md:border-2 md:border-[#4A90E2] md:bg-white md:p-8 md:shadow-[6px_8px_0_rgba(0,0,0,0.2)]"
      >
        <Image
          src="/images/logo-tasktify.svg"
          alt="Maskot Tasktify"
          width={72}
          height={72}
          priority
          className="mx-auto mb-4 size-[72px] object-contain md:size-12"
        />
        <div className="overflow-hidden">
          <AnimatePresence initial={false} mode="wait">
            <AuthRouteContent
              key={pathname}
              reduceMotion={reduceMotion}
              focusOnNavigation={focusedPathname === pathname}
            >
              {children}
            </AuthRouteContent>
          </AnimatePresence>
        </div>
      </motion.div>
    </main>
  );
}
