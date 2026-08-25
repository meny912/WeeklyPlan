// Powered by OnSpace.AI
// Local Tehillim text (all 150 chapters, full nikud, cantillation removed).
// Source: Tanach text (Westminster Leningrad Codex via תורת אמת / ויקיטקסט /
// J. Alan Groves Center), licensed CC BY-NC-SA 2.5 — attribution required,
// non-commercial. Offline, so no API and no foreign-letter rendering issues.
import DATA from './tehillim.json';

const TEHILLIM: Record<string, string[]> = DATA as Record<string, string[]>;

/** Verses of a chapter (1..150). */
export function getChapterVerses(chapter: number): string[] {
  return TEHILLIM[String(chapter)] ?? [];
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
