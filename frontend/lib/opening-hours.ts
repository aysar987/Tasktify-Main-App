/**
 * Lapak opening hours: one place for the day order, the stored format and the
 * "buka sekarang" check. Matches the backend (TasktifyBE/internal/tasktify/listing_hours.go).
 *
 * Each day is open (with times), open 24 hours, or closed; a day that is
 * missing is "not set". A closing time earlier than the opening time means
 * the lapak closes after midnight (e.g. 18:00-02:00).
 */

/** Days in display order, Senin first; `number` is ISO (Senin = 1 ... Minggu = 7). */
export const LISTING_DAYS = [
  { key: "monday", label: "Senin", number: 1 },
  { key: "tuesday", label: "Selasa", number: 2 },
  { key: "wednesday", label: "Rabu", number: 3 },
  { key: "thursday", label: "Kamis", number: 4 },
  { key: "friday", label: "Jumat", number: 5 },
  { key: "saturday", label: "Sabtu", number: 6 },
  { key: "sunday", label: "Minggu", number: 7 },
] as const;

export type DayKey = (typeof LISTING_DAYS)[number]["key"];

export type DayHours =
  | { state: "open"; openTime: string; closeTime: string }
  | { state: "open24" }
  | { state: "closed" };

/** Missing day = not set. */
export type OperatingHours = Partial<Record<DayKey, DayHours>>;

/** Lapaks don't store a time zone yet; every lapak uses WITA. */
export const LISTING_TIME_ZONE = "Asia/Makassar";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Reads stored hours, including the old {isOpen, openTime, closeTime} format. */
export function normalizeOperatingHours(raw: unknown): OperatingHours {
  const hours: OperatingHours = {};
  if (!raw || typeof raw !== "object") return hours;
  const source = raw as Record<string, { state?: string; isOpen?: boolean; openTime?: string; closeTime?: string } | null>;
  for (const { key } of LISTING_DAYS) {
    const day = source[key];
    if (!day || typeof day !== "object") continue;
    const state = day.state ?? (day.isOpen === undefined ? undefined : day.isOpen ? "open" : "closed");
    if (state === "open24" || state === "closed") hours[key] = { state };
    else if (state === "open" && TIME.test(day.openTime ?? "") && TIME.test(day.closeTime ?? ""))
      hours[key] = { state: "open", openTime: day.openTime!, closeTime: day.closeTime! };
  }
  return hours;
}

export function hasAnyHours(hours: OperatingHours) {
  return LISTING_DAYS.some(({ key }) => hours[key]);
}

export function isOvernight(day: DayHours | undefined) {
  return day?.state === "open" && day.closeTime < day.openTime;
}

/** Text for one day's row: "08:00–17:00", "Buka 24 jam", "Tutup", or "-" when not set. */
export function formatDayHours(day: DayHours | undefined) {
  if (!day) return "-";
  if (day.state === "open24") return "Buka 24 jam";
  if (day.state === "closed") return "Tutup";
  return `${day.openTime}–${day.closeTime}`;
}

const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

/** Day number (Senin = 1) and minutes since midnight of `date` in the lapak's time zone. */
export function lapakClock(date: Date, timeZone = LISTING_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  const weekday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(part("weekday")) + 1;
  return { day: weekday, minutes: Number(part("hour")) * 60 + Number(part("minute")) };
}

export function dayByNumber(number: number) {
  return LISTING_DAYS[(((number - 1) % 7) + 7) % 7];
}

/**
 * Whether the lapak is open at `now`: true, false, or undefined when it can't
 * be told because today's hours are not set (then nothing is shown).
 */
export function isOpenNow(hours: OperatingHours, now: Date, timeZone = LISTING_TIME_ZONE): boolean | undefined {
  const clock = lapakClock(now, timeZone);
  // Still inside yesterday's hours that run past midnight.
  const yesterday = hours[dayByNumber(clock.day - 1).key];
  if (yesterday?.state === "open" && isOvernight(yesterday) && clock.minutes < minutes(yesterday.closeTime)) return true;
  const today = hours[dayByNumber(clock.day).key];
  if (!today) return undefined;
  if (today.state === "open24") return true;
  if (today.state === "closed") return false;
  const open = minutes(today.openTime);
  const close = minutes(today.closeTime);
  return isOvernight(today) ? clock.minutes >= open : clock.minutes >= open && clock.minutes < close;
}
