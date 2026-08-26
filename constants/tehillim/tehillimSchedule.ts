// Powered by OnSpace.AI
// Tehillim daily division by Hebrew day of the month ("תהילים מחולק לימי החודש"),
// taken from the user's own Tehillim file. Psalm 119 (the longest) is split
// across days 25 (verses 1–96) and 26 (verses 97–176), exactly as in that file.
// This is the standard 30-day division; on a 29-day (חסר) month, day 29 folds in
// day 30 so the whole book is still completed within the month.

export interface TehillimPortion {
  chapter: number;   // 1..150
  from?: number;     // 1-based inclusive; omit for a whole chapter
  to?: number;
  label?: string;    // shown next to the chapter title (e.g. "חלק א")
}

// Each day → the chapters (or partial chapter) said on it.
const DAILY_PORTIONS: Record<number, TehillimPortion[]> = {
  1: chapters(1, 9),
  2: chapters(10, 17),
  3: chapters(18, 22),
  4: chapters(23, 28),
  5: chapters(29, 34),
  6: chapters(35, 38),
  7: chapters(39, 43),
  8: chapters(44, 48),
  9: chapters(49, 54),
  10: chapters(55, 59),
  11: chapters(60, 65),
  12: chapters(66, 68),
  13: chapters(69, 71),
  14: chapters(72, 76),
  15: chapters(77, 78),
  16: chapters(79, 82),
  17: chapters(83, 87),
  18: chapters(88, 89),
  19: chapters(90, 96),
  20: chapters(97, 103),
  21: chapters(104, 105),
  22: chapters(106, 107),
  23: chapters(108, 112),
  24: chapters(113, 118),
  25: [{ chapter: 119, from: 1, to: 96, label: 'חלק א' }],
  26: [{ chapter: 119, from: 97, to: 176, label: 'חלק ב' }],
  27: chapters(120, 134),
  28: chapters(135, 139),
  29: chapters(140, 144),
  30: chapters(145, 150),
};

function chapters(from: number, to: number): TehillimPortion[] {
  const out: TehillimPortion[] = [];
  for (let c = from; c <= to; c++) out.push({ chapter: c });
  return out;
}

/**
 * The Tehillim portion for a given Hebrew day of the month (1..30).
 * On a 29-day month the caller passes 29; days 29+30 are then said together.
 */
export function getDailyTehillim(hebrewDay: number, monthLength = 30): TehillimPortion[] {
  const day = Math.min(Math.max(hebrewDay, 1), 30);
  if (day === 29 && monthLength === 29) {
    return [...DAILY_PORTIONS[29], ...DAILY_PORTIONS[30]];
  }
  return DAILY_PORTIONS[day] ?? DAILY_PORTIONS[1];
}
