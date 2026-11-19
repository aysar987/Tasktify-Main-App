import { Sparkles, Star } from "lucide-react";

/**
 * The one place a provider's or lapak's rating is shown. With no reviews it
 * shows a "Baru" label instead of a misleading 0.0; with reviews it shows the
 * average and how many reviews it is based on, e.g. "★ 4.8 (12)".
 */
export function RatingBadge({
  rating,
  reviewCount,
  size = "sm",
  className = "",
}: {
  rating: number | null | undefined;
  reviewCount: number | undefined;
  size?: "sm" | "md";
  className?: string;
}) {
  const iconSize = size === "md" ? "size-5" : "size-4";
  if (!reviewCount || rating == null) {
    return (
      <span
        title="Belum ada ulasan"
        aria-label="Baru, belum ada ulasan"
        className={`inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 ${className}`}
      >
        <Sparkles className="size-3.5" aria-hidden="true" /> Baru
      </span>
    );
  }
  const average = rating.toFixed(1);
  return (
    <span
      aria-label={`Rating ${average} dari 5, ${reviewCount} ulasan`}
      className={`inline-flex shrink-0 items-center gap-1 font-bold text-slate-800 ${size === "md" ? "text-base" : "text-sm"} ${className}`}
    >
      <Star className={`${iconSize} fill-amber-400 text-amber-400`} aria-hidden="true" />
      {average}
      <span className="font-normal text-slate-500">({reviewCount})</span>
    </span>
  );
}

/** Sort order for "Rating Tertinggi": rated first (by average, then review count), "Baru" last. */
export function compareByRating(
  a: { rating: number | null; reviewCount: number },
  b: { rating: number | null; reviewCount: number },
) {
  const aRated = a.reviewCount > 0 && a.rating != null;
  const bRated = b.reviewCount > 0 && b.rating != null;
  if (aRated !== bRated) return aRated ? -1 : 1;
  if (aRated && bRated && a.rating !== b.rating) return b.rating! - a.rating!;
  return b.reviewCount - a.reviewCount;
}
