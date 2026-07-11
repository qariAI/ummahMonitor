// Real Hijri date math via Intl's built-in Islamic (Umm al-Qura) calendar —
// deliberately not a hardcoded "Ramadan starts on X date" table, since that
// would silently go wrong every year. This recomputes from the actual
// current date every time, so it's always correct without maintenance.

const HIJRI_FORMATTER = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

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
    isRamadanNow: hijriToday.month === 9,
    isHajjSeasonNow: hijriToday.month === 12 && hijriToday.day >= 8 && hijriToday.day <= 13,
  };
}
