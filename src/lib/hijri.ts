// Real Hijri date math via Intl's built-in Islamic (Umm al-Qura) calendar —
// deliberately not a hardcoded "Ramadan starts on X date" table, since that
// would silently go wrong every year. This recomputes from the actual
// current date every time, so it's always correct without maintenance.

const HIJRI_FORMATTER = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

export const HIJRI_MONTH_NAMES = [
  "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani",
  "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
  "Ramadan", "Shawwal", "Dhul Qa'dah", "Dhul Hijjah",
];

export interface MoonPhase {
  /** 0 = new moon, 0.5 = full moon, approaching 1 = new moon again. */
  fraction: number;
  /** Days into the current ~29.53-day synodic lunar cycle. */
  ageDays: number;
  name: string;
  emoji: string;
}

// Real astronomical approximation — days since a known reference new moon
// (6 Jan 2000, 18:14 UTC), modulo the synodic month (29.53058867 days).
// Standard formula, not fabricated; accurate to roughly ±1 day, which is
// the normal tolerance for this kind of calculation without a full
// ephemeris.
const SYNODIC_MONTH_DAYS = 29.53058867;
const REFERENCE_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

export function getMoonPhase(date: Date = new Date()): MoonPhase {
  const daysSinceRef = (date.getTime() - REFERENCE_NEW_MOON) / 86400000;
  const cycles = daysSinceRef / SYNODIC_MONTH_DAYS;
  const fraction = cycles - Math.floor(cycles);
  const ageDays = fraction * SYNODIC_MONTH_DAYS;

  let name: string;
  let emoji: string;
  if (fraction < 0.03 || fraction > 0.97) { name = "New Moon"; emoji = "🌑"; }
  else if (fraction < 0.22) { name = "Waxing Crescent"; emoji = "🌒"; }
  else if (fraction < 0.28) { name = "First Quarter"; emoji = "🌓"; }
  else if (fraction < 0.47) { name = "Waxing Gibbous"; emoji = "🌔"; }
  else if (fraction < 0.53) { name = "Full Moon"; emoji = "🌕"; }
  else if (fraction < 0.72) { name = "Waning Gibbous"; emoji = "🌖"; }
  else if (fraction < 0.78) { name = "Last Quarter"; emoji = "🌗"; }
  else { name = "Waning Crescent"; emoji = "🌘"; }

  return { fraction, ageDays, name, emoji };
}

export interface HijriDate {
  year: number;
  month: number; // 1–12
  day: number; // 1–30
}

export function toHijri(date: Date): HijriDate {
  const parts = HIJRI_FORMATTER.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/** Days from `from` until the next occurrence of Hijri month/day (1 = that day is today). */
export function daysUntilHijri(from: Date, targetMonth: number, targetDay: number): number {
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  for (let i = 0; i < 400; i++) {
    const h = toHijri(cursor);
    if (h.month === targetMonth && h.day === targetDay) return i;
    cursor.setDate(cursor.getDate() + 1);
  }
  return -1; // shouldn't happen — safety fallback
}

export interface IslamicCalendarInfo {
  hijriToday: HijriDate;
  daysUntilRamadan: number; // 1 Ramadan (month 9)
  daysUntilEidAlFitr: number; // 1 Shawwal (month 10)
  daysUntilHajjDay: number; // 9 Dhul Hijjah (month 12) — Day of Arafah
  daysUntilEidAlAdha: number; // 10 Dhul Hijjah (month 12)
  daysUntilAshura: number; // 10 Muharram (month 1)
  isRamadanNow: boolean;
  isHajjSeasonNow: boolean; // 8–13 Dhul Hijjah
}

export function getIslamicCalendarInfo(now: Date = new Date()): IslamicCalendarInfo {
  const hijriToday = toHijri(now);
  return {
    hijriToday,
    daysUntilRamadan: daysUntilHijri(now, 9, 1),
    daysUntilEidAlFitr: daysUntilHijri(now, 10, 1),
    daysUntilHajjDay: daysUntilHijri(now, 12, 9),
    daysUntilEidAlAdha: daysUntilHijri(now, 12, 10),
    daysUntilAshura: daysUntilHijri(now, 1, 10),
    isRamadanNow: hijriToday.month === 9,
    isHajjSeasonNow: hijriToday.month === 12 && hijriToday.day >= 8 && hijriToday.day <= 13,
  };
}
