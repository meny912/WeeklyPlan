// Powered by OnSpace.AI
// Local Tehillim text (all 150 chapters, full nikud, cantillation removed).
// Source: the user's own "תהילים מחולק לימי החודש" file. Offline, so no API and
// no foreign-letter rendering issues.
// The text lives in ./tehillimData (a .ts module, not a .json import): the large
// .json import failed in the OnSpace/Metro build and silently returned empty
// text ("לא נמצא תוכן להיום"). A .ts module is always bundled.
import TEHILLIM_DATA from './tehillimData';

const TEHILLIM: Record<string, string[]> = TEHILLIM_DATA;

/** Verses of a chapter (1..150). */
export function getChapterVerses(chapter: number): string[] {
  return TEHILLIM[String(chapter)] ?? [];
}

/**
 * Verses of a chapter, optionally limited to a 1-based inclusive verse range.
 * Used for the daily division where Psalm 119 is split across two days.
 */
export function getChapterVersesRange(chapter: number, from?: number, to?: number): string[] {
  const all = getChapterVerses(chapter);
  if (from == null && to == null) return all;
  const start = Math.max(1, from ?? 1);
  const end = Math.min(all.length, to ?? all.length);
  return all.slice(start - 1, end);
}

const ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];

/** Hebrew numeral for a chapter number 1..150 (e.g. 119 → קיט). */
export function chapterGematria(n: number): string {
  let s = '';
  const h = Math.floor(n / 100);
  let rem = n % 100;
  if (h > 0) s += 'ק'.repeat(h);
  const t = Math.floor(rem / 10);
  const o = rem % 10;
  if (t === 1 && o === 5) return s + 'טו'; // 15/115 avoid יה
  if (t === 1 && o === 6) return s + 'טז'; // 16/116 avoid יו
  return s + TENS[t] + ONES[o];
}

export const TEHILLIM_ATTRIBUTION =
  'טקסט התהילים: מהדורת תורת אמת / ויקיטקסט (WLC), רישיון CC BY-NC-SA';
