// Powered by OnSpace.AI
// Offline Daily Rambam (3 chapters). The cycle is continuous (339 days, restarts
// Mishneh Torah), so we key by day-in-cycle, not Hebrew date. Renders like the
// printed Rambam: book (ספר) + section (הלכות) headers at each transition, then
// the chapter's numbered halachot. Fully offline.
import { RAMBAM_EPOCH, RAMBAM_CYCLE, RAMBAM_DAILY } from '@/constants/learning/rambamSchedule';
import RAMBAM_TEXT from '@/constants/learning/rambamText';
import { RAMBAM_META } from '@/constants/learning/rambamMeta';

export interface RambamChapter {
  title: string;
  titleHe: string;
  sections: { verse: number; text: string }[];
  ref: string;
}

const ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
function gematria(n: number): string {
  if (n <= 0) return String(n);
  let s = '';
  const h = Math.floor(n / 100);
  const rem = n % 100;
  if (h > 0) s += 'ק'.repeat(h);
  const t = Math.floor(rem / 10);
  const o = rem % 10;
  if (t === 1 && o === 5) return s + 'טו';
  if (t === 1 && o === 6) return s + 'טז';
  return s + TENS[t] + ONES[o];
}

function daysSinceEpoch(epochISO: string, date: Date): number {
  const [ey, em, ed] = epochISO.split('-').map(Number);
  const epoch = Date.UTC(ey, em - 1, ed);
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((today - epoch) / 86400000);
}

function parseRef(ref: string): { base: string; ch: number } {
  const m = ref.match(/^(.*?)\s+(\d+)$/);
  if (!m) return { base: ref, ch: 0 };
  return { base: m[1], ch: parseInt(m[2], 10) };
}

/** Today's Daily Rambam (3 chapters), offline, with book/section/chapter headers. */
export function getLocalRambam(date: Date = new Date()): RambamChapter[] {
  const diff = daysSinceEpoch(RAMBAM_EPOCH, date);
  const idx = ((diff % RAMBAM_CYCLE) + RAMBAM_CYCLE) % RAMBAM_CYCLE;
  const refs = RAMBAM_DAILY[String(idx)] ?? [];
  const out: RambamChapter[] = [];
  let prevBase: string | null = null;
  let prevBook: string | null = null;
  for (const ref of refs) {
    const { base, ch } = parseRef(ref);
    const meta = RAMBAM_META[base];
    const secHe = meta?.he ?? base.replace('Mishneh Torah, ', '');
    const book = meta?.book ?? '';
    const halachot = RAMBAM_TEXT[ref] ?? [];

    const newBook = !!book && book !== 'הקדמה' && book !== prevBook;
    // Header: show the ספר only when it changes; the הלכות + פרק always.
    const perek = `פרק ${gematria(ch)}`;
    const titleHe = newBook ? `${book} · ${secHe} · ${perek}` : `${secHe} · ${perek}`;

    out.push({
      title: ref,
      titleHe,
      sections: halachot.map((t, i) => ({ verse: i + 1, text: t })),
      ref,
    });
    prevBase = base;
    prevBook = book;
  }
  return out;
}
