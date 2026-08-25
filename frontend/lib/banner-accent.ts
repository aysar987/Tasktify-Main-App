import type { BannerAccent } from "@/types";

export const bannerAccentOptions: { value: BannerAccent; label: string; gradient: string }[] = [
  { value: "orange", label: "Oranye", gradient: "from-orange-500 via-orange-600 to-amber-500" },
  { value: "blue", label: "Biru", gradient: "from-sky-500 via-blue-600 to-indigo-600" },
  { value: "emerald", label: "Hijau", gradient: "from-emerald-500 via-teal-600 to-cyan-600" },
  { value: "purple", label: "Ungu", gradient: "from-purple-500 via-violet-600 to-indigo-600" },
  { value: "rose", label: "Merah muda", gradient: "from-rose-500 via-pink-600 to-red-500" },
  { value: "slate", label: "Abu-abu", gradient: "from-slate-600 via-slate-700 to-slate-900" },
];

export function bannerGradient(accent: BannerAccent): string {
  return (
    bannerAccentOptions.find((option) => option.value === accent)?.gradient ??
    bannerAccentOptions[0].gradient
  );
}
