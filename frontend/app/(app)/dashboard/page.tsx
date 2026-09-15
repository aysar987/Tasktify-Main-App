"use client";

import { ChevronDown, LogOut, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MarketplaceListingCard } from "@/components/marketplace-listing-card";
import { getBanners, getMarketplaceListings, getProfile } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";
import type { Banner, MarketplaceListing, Profile } from "@/types";

type Slide = { kind: "photo"; banner: Banner };

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile>();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [trackIndex, setTrackIndex] = useState(1);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const carouselRef = useRef<HTMLElement | null>(null);
  const dragStartX = useRef(0);
  const didDrag = useRef(false);

  useEffect(() => {
    Promise.all([getProfile(), getMarketplaceListings(), getBanners()])
      .then(([nextProfile, nextListings, nextBanners]) => {
        setProfile(nextProfile);
        setListings(nextListings);
        setBanners(nextBanners);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const slides: Slide[] = banners.map((banner): Slide => ({ kind: "photo", banner }));

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setActiveSlide(0);
      setTrackIndex(1);
      setDragOffset(0);
      setTransitionEnabled(false);
      requestAnimationFrame(() => setTransitionEnabled(true));
    });
    return () => cancelAnimationFrame(frame);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2 || isDragging) return;
    let frame = 0;
    let lastTime = performance.now();
    let elapsed = 0;
    const tick = (time: number) => {
      elapsed += time - lastTime;
      lastTime = time;
      if (elapsed >= 4500) {
        elapsed = 0;
        setActiveSlide((current) => {
          const next = (current + 1) % slides.length;
          setTransitionEnabled(true);
          setTrackIndex(next + 1);
          return next;
        });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isDragging, slides.length]);

  const renderedSlides = slides.length > 1 ? [slides[slides.length - 1], ...slides, slides[0]] : slides;
  const slideWidth = renderedSlides.length ? 100 / renderedSlides.length : 100;
  const trackTransform = `translate3d(calc(-${trackIndex * slideWidth}% + ${dragOffset}px), 0, 0)`;
  const initials = (profile?.fullName || profile?.username || "U")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = String(new FormData(event.currentTarget).get("query") ?? "").trim();
    if (query) window.location.assign(`/market?q=${encodeURIComponent(query)}`);
  }

  async function logout() {
    await getSupabase().auth.signOut();
    window.location.assign("/login");
  }

  return (
    <div>
      <section
        ref={carouselRef}
        onPointerDown={(event) => {
          if (slides.length < 2) return;
          setIsDragging(true);
          setTransitionEnabled(false);
          dragStartX.current = event.clientX;
          didDrag.current = false;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!isDragging) return;
          const offset = event.clientX - dragStartX.current;
          if (Math.abs(offset) > 4) didDrag.current = true;
          setDragOffset(offset);
        }}
        onPointerUp={(event) => {
          if (!isDragging) return;
          const width = carouselRef.current?.clientWidth ?? 1;
          const offset = event.clientX - dragStartX.current;
          const threshold = Math.max(50, width * 0.18);
          setIsDragging(false);
          setTransitionEnabled(true);
          setDragOffset(0);
          if (Math.abs(offset) >= threshold) {
            setActiveSlide((current) => {
              const next = offset < 0 ? (current + 1) % slides.length : (current - 1 + slides.length) % slides.length;
              setTrackIndex(next + 1);
              return next;
            });
          }
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          setIsDragging(false);
          setTransitionEnabled(true);
          setDragOffset(0);
        }}
        className="relative -mx-4 -mt-7 min-h-[220px] touch-pan-y select-none overflow-hidden bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 sm:-mx-6 sm:min-h-[300px] lg:-mx-10 lg:-mt-10"
      >
        {slides.length > 0 && (
          <div
            onTransitionEnd={(event) => {
              if (event.target !== event.currentTarget || slides.length < 2) return;
              if (trackIndex === 0) {
                setTransitionEnabled(false);
                setTrackIndex(slides.length);
                setActiveSlide(slides.length - 1);
                requestAnimationFrame(() => setTransitionEnabled(true));
              } else if (trackIndex === slides.length + 1) {
                setTransitionEnabled(false);
                setTrackIndex(1);
                setActiveSlide(0);
                requestAnimationFrame(() => setTransitionEnabled(true));
              }
            }}
            className={`absolute inset-y-0 left-0 flex h-full ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
            style={{
              width: `${renderedSlides.length * 100}%`,
              transform: trackTransform,
              transition: transitionEnabled ? "transform 520ms cubic-bezier(0.65, 0, 0.35, 1)" : "none",
            }}
          >
            {renderedSlides.map((slide, index) => (
              <div key={`${slide.banner.id}-${index}`} style={{ width: `${100 / renderedSlides.length}%` }} className="relative h-full shrink-0">
                <Image unoptimized src={slide.banner.imageUrl} alt="" fill draggable={false} className="pointer-events-none object-cover" />
                <Link href={slide.banner.href} onClick={(event) => { if (didDrag.current) event.preventDefault(); }} className="absolute inset-0" aria-label="Buka banner" />
              </div>
            ))}
          </div>
        )}
        <div className="absolute inset-x-4 top-4 z-20 flex items-center gap-3 sm:hidden">
          <form onSubmit={search} className="relative min-w-0 flex-1">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-500" />
            <input name="query" aria-label="Search" placeholder="Search..." className="min-h-11 w-full rounded-full border-0 bg-white/95 pl-12 pr-4 text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-white/50" />
          </form>
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              aria-label="Account menu"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((current) => !current)}
              className="flex size-11 items-center justify-center rounded-full border-2 border-white bg-white/95 p-0.5 shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
            >
              {profile?.avatarUrl ? (
                <Image unoptimized src={profile.avatarUrl} alt="Profile" width={40} height={40} className="size-9 rounded-full object-cover" />
              ) : (
                <span className="grid size-9 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">{initials}</span>
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-200 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-[.15em] text-slate-400">Account</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-900">{profile?.fullName || profile?.username || "Pengguna"}</p>
                </div>
                <div className="py-1.5">
                  <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700"><span>Manage Account</span><ChevronDown className="size-4 -rotate-90" /></Link>
                  <Link href="/activity" onClick={() => setMenuOpen(false)} className="flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700"><span>Activities</span><ChevronDown className="size-4 -rotate-90" /></Link>
                  <button type="button" onClick={() => { setMenuOpen(false); void logout(); }} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-red-600"><span>Logout</span><LogOut className="size-4" /></button>
                </div>
              </div>
            )}
          </div>
        </div>
        {slides.length > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex items-center justify-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.banner.id}
                type="button"
                aria-label={`Pilih banner ${index + 1}`}
                onClick={() => {
                  if (didDrag.current) return;
                  setTransitionEnabled(true);
                  setActiveSlide(index);
                  setTrackIndex(index + 1);
                }}
                className={`pointer-events-auto h-2.5 rounded-full shadow transition-all duration-300 ${activeSlide === index ? "w-10 bg-white" : "w-2.5 bg-white/60 hover:bg-white/85"}`}
              />
            ))}
          </div>
        )}
      </section>

      <div className="relative z-10 -mt-10 -mx-4 -mb-7 rounded-3xl bg-orange-600 pb-10 pt-6 sm:-mx-6 sm:-mt-12 lg:-mx-10 lg:-mt-14 lg:-mb-10">
        <div className="px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            {loading ? (
              <>
                <span className="size-14 shrink-0 animate-pulse rounded-full bg-slate-200" />
                <div className="min-w-0 flex-1">
                  <div className="h-5 w-40 max-w-full animate-pulse rounded-full bg-slate-200" />
                </div>
              </>
            ) : (
              <>
                {profile?.avatarUrl ? (
                  <Image unoptimized src={profile.avatarUrl} alt="" width={56} height={56} className="size-14 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="grid size-14 shrink-0 place-items-center rounded-full bg-slate-900 text-lg font-bold text-white">
                    {initials}
                  </span>
                )}
                <div className="min-w-0">
                  <h1 className="truncate font-[var(--font-manrope)] text-xl font-bold text-slate-950 sm:text-xl">
                    {profile?.fullName || profile?.username || "Pengguna"}.
                  </h1>
                </div>
              </>
            )}
          </div>

          <section className="mt-6">
            <div className="grid grid-cols-3 gap-6">
              <Link href="/create-task" className="flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center">
                  <Image src="/images/AddTask.svg" alt="Add Task" width={120} height={120} />
                </div>
                <span className="mt-2 text-sm font-semibold text-white">Buat Task</span>
              </Link>

              <Link href="/penyedia" className="flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center">
                  <Image src="/images/DoTask.svg" alt="Do Task" width={120} height={120} />
                </div>
                <span className="mt-2 text-sm font-semibold text-white">Ambil Task</span>
              </Link>

              <Link href="/market" className="flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center">
                  <Image src="/images/MarketPlace.svg" alt="Marketplace" width={120} height={120} />
                </div>
                <span className="mt-2 text-sm font-semibold text-white">Marketplace</span>
              </Link>
            </div>
          </section>
          <section className="mt-10">
            <div className="mb-5 flex items-end justify-between gap-4">
              <h2 className="font-[var(--font-manrope)] text-2xl font-extrabold text-white">
                Rekomendasi Jasa
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {loading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="overflow-hidden rounded-[24px] border border-white/20 bg-white shadow-sm">
                      <div className="h-[150px] animate-pulse bg-blue-100" />
                      <div className="flex flex-col gap-2 p-3">
                        <div className="h-5 w-3/4 animate-pulse rounded-full bg-slate-200" />
                        <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-200" />
                        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                          <div className="h-4 w-16 animate-pulse rounded-full bg-slate-200" />
                          <div className="h-4 w-12 animate-pulse rounded-full bg-slate-200" />
                        </div>
                      </div>
                    </div>
                  ))
                : listings.slice(0, 3).map((listing) => (
                    <MarketplaceListingCard key={listing.id} listing={listing} />
                  ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
