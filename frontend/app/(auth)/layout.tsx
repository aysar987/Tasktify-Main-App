"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useRef, useState, useSyncExternalStore } from "react";

const desktopQuery = "(min-width: 768px)";

function subscribeToDesktop(onChange: () => void) {
  const mediaQuery = window.matchMedia(desktopQuery);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}
const getDesktopSnapshot = () => window.matchMedia(desktopQuery).matches;
const getServerDesktopSnapshot = () => false;

const BORDER = 4; // border 2px atas + bawah

export default function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion() ?? false;
  const isDesktop = useSyncExternalStore(subscribeToDesktop, getDesktopSnapshot, getServerDesktopSnapshot);

  const innerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const [innerHeight, setInnerHeight] = useState<number | null>(null);

  // Ukur tinggi isi (logo + konten), ikut berubah saat error muncul, font load, dll.
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const update = () => setInnerHeight(el.offsetHeight);
    const observer = new ResizeObserver(update);
    observer.observe(el);
    update();
    return () => observer.disconnect();
  }, []);

  // Pindahkan fokus ke judul setelah navigasi (bukan saat load pertama).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    contentRef.current?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
  }, [pathname]);

  const animateHeight = isDesktop && !reduceMotion && innerHeight !== null;

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
        initial={false}
        animate={{ height: animateHeight ? innerHeight! + BORDER : "auto" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="w-full max-w-[420px] md:overflow-hidden md:rounded-[32px] md:border-2 md:border-[#4A90E2] md:bg-white md:shadow-[6px_8px_0_rgba(0,0,0,0.2)]"
      >
        <div ref={innerRef} className="md:p-8">
          <Image
            src="/images/logo-tasktify.svg"
            alt="Maskot Tasktify"
            width={72}
            height={72}
            priority
            className="mx-auto mb-4 size-[72px] object-contain md:size-12"
          />
          <motion.div
            key={pathname}
            ref={contentRef}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeInOut" }}
            className="[&_h1]:outline-none"
          >
            {children}
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}