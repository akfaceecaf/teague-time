// All dates are ISO "YYYY-MM-DD" strings in US Eastern (NBA schedule) time,
// so they compare correctly with plain string comparison.

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};
const MONTH = '(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*\\.?';
const DAY = '(\\d{1,2})(?:st|nd|rd|th)?';

// "July 20, 2021" / "Jul. 20th 2021"
const MONTH_DAY_YEAR = new RegExp(`\\b${MONTH}\\s+${DAY},?\\s+(\\d{4})\\b`, 'i');
// "20 July 2021"
const DAY_MONTH_YEAR = new RegExp(`\\b${DAY}\\s+${MONTH},?\\s+(\\d{4})\\b`, 'i');
// "2021-07-20"
const ISO = /\b(\d{4})-(\d{2})-(\d{2})\b/;
// "7/20/21", "07.20.2021", "7-20-2021" (US month-first)
const NUMERIC = /\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})\b/;

function toIso(year: number, month: number, day: number): string | null {
  if (year < 100) year += 2000;
  const d = new Date(Date.UTC(year, month - 1, day));
  // Rejects things like 2/30/2021 that Date would silently roll over.
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  return d.toISOString().slice(0, 10);
}

export function parseTitleDate(title: string): string | null {
  let m = title.match(MONTH_DAY_YEAR);
  if (m) return toIso(+m[3], MONTHS[m[1].toLowerCase()], +m[2]);
  m = title.match(DAY_MONTH_YEAR);
  if (m) return toIso(+m[3], MONTHS[m[2].toLowerCase()], +m[1]);
  m = title.match(ISO);
  if (m) return toIso(+m[1], +m[2], +m[3]);
  m = title.match(NUMERIC);
  if (m) return toIso(+m[3], +m[1], +m[2]);
  return null;
}

const EASTERN = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
});

/** "2021-07-20T20:34:12-07:00" -> "2021-07-20" in US Eastern. A bare date is returned as-is. */
export function toEasternDate(uploadDate: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(uploadDate)) return uploadDate;
  const d = new Date(uploadDate);
  return Number.isNaN(d.getTime()) ? null : EASTERN.format(d);
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Highlights usually go up the night of the game or the day after: check day 0, -1, -2. */
export function uploadCandidates(uploadDate: string): string[] {
  const day0 = toEasternDate(uploadDate);
  return day0 ? [day0, addDays(day0, -1), addDays(day0, -2)] : [];
}
