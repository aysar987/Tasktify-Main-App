"use client";

import { useEffect, useState } from "react";
import { LISTING_DAYS, formatDayHours, hasAnyHours, isOpenNow, isOvernight, lapakClock } from "@/lib/opening-hours";
import type { OperatingHours } from "@/lib/opening-hours";

/** "Jam operasional" on a lapak page: Senin to Minggu, today highlighted, open/closed now (WITA). */
export function OpeningHoursCard({ hours }: { hours: OperatingHours }) {
  const [now, setNow] = useState(() => new Date());
  // Keep "Buka sekarang" correct while the page stays open.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const anySet = hasAnyHours(hours);
  const openNow = anySet ? isOpenNow(hours, now) : undefined;
  const today = lapakClock(now).day;

  return (
    <div className="rounded-[24px] bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-[var(--font-manrope)] text-lg font-extrabold text-slate-950">Jam operasional</h2>
        {openNow !== undefined && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${openNow ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"}`}
          >
            {openNow ? "Buka sekarang" : "Tutup sekarang"}
          </span>
        )}
      </div>
      {anySet ? (
        <>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            {LISTING_DAYS.map(({ key, label, number }) => {
              const isToday = number === today;
              const day = hours[key];
              return (
                <li
                  key={key}
                  aria-current={isToday ? "date" : undefined}
                  className={`flex justify-between gap-3 rounded-lg px-2 py-1 ${isToday ? "bg-blue-50 font-bold text-slate-950" : ""}`}
                >
                  <span>
                    {label}
                    {isToday && <span className="ml-2 text-xs font-semibold text-blue-700">Hari ini</span>}
                  </span>
                  <span>
                    {formatDayHours(day)}
                    {isOvernight(day) && <span className="ml-1 text-xs font-normal text-slate-500">(hari berikutnya)</span>}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-slate-400">Waktu dalam WITA.</p>
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Jam buka belum diatur.</p>
      )}
    </div>
  );
}
