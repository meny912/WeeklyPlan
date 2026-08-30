// Powered by OnSpace.AI
// Offline daily Chumash (Chitas) + Rashi. The parsha is computed on-device with
// @hebcal/core Sedra (diaspora); the aliyah = day of week (Sun=1 … Shabbat=7); the
// aliyah verse range comes from the bundled leyning map; the Torah/Rashi text is
// bundled locally and sliced to that range. No network.
import { HDate, Sedra } from '@hebcal/core';
import TORAH from '@/constants/learning/torahText';
import RASHI from '@/constants/learning/rashiText';
import { lookupLeyning } from '@/constants/learning/leyning';

export interface ChumashItem {
  title: string;
  titleHe: string;
  sections: { verse: number; text: string }[];
  ref: string;
}

const ALIYAH_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שביעי'];
const BOOK_HE: Record<string, string> = {
  Genesis: 'בראשית', Exodus: 'שמות', Leviticus: 'ויקרא', Numbers: 'במדבר', Deuteronomy: 'דברים',
};

// Upcoming (or current) Shabbat — Chitas learns the coming week's parsha.
function getShabbatDate(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun … 6=Sat
  const add = day === 6 ? 0 : 6 - day;
  d.setDate(d.getDate() + add);
  return d;
}

function parshaForShabbat(shabbat: Date): string | null {
  try {
    const hd = new HDate(shabbat);
    const sedra = new Sedra(hd.getFullYear(), false); // diaspora
    const arr = (sedra as any).get(hd) as string[];
    if (!arr || arr.length === 0) return null;
    // filter out holiday markers that aren't a weekly parsha
    const names = arr.filter((s) => typeof s === 'string' && s && !s.startsWith('Parashat'));
    if (names.length === 0) return null;
    return names.join('-');
  } catch {
    return null;
  }
}

// "Genesis 1:1-6:8" → {book, fromCh, fromV, toCh, toV}
function parseRange(ref: string): { book: string; fromCh: number; fromV: number; toCh: number; toV: number } | null {
  const m = ref.match(/^(.+?)\s+(\d+):(\d+)-(?:(\d+):)?(\d+)$/);
  if (!m) return null;
  const book = m[1];
  const fromCh = +m[2], fromV = +m[3];
  const toCh = m[4] ? +m[4] : fromCh;
  const toV = +m[5];
  return { book, fromCh, fromV, toCh, toV };
}

function sliceTorah(r: { book: string; fromCh: number; fromV: number; toCh: number; toV: number }): { verse: number; text: string }[] {
  const out: { verse: number; text: string }[] = [];
  let n = 0;
  for (let ch = r.fromCh; ch <= r.toCh; ch++) {
    const verses = TORAH[`${r.book} ${ch}`] ?? [];
    const start = ch === r.fromCh ? r.fromV - 1 : 0;
    const end = ch === r.toCh ? r.toV : verses.length;
    for (let v = start; v < end && v < verses.length; v++) {
      out.push({ verse: ++n, text: verses[v] });
    }
  }
  return out;
}

function sliceRashi(r: { book: string; fromCh: number; fromV: number; toCh: number; toV: number }): { verse: number; text: string }[] {
  const out: { verse: number; text: string }[] = [];
  let n = 0;
  for (let ch = r.fromCh; ch <= r.toCh; ch++) {
    const perVerse = (RASHI[`Rashi on ${r.book} ${ch}`] ?? []) as string[][];
    const start = ch === r.fromCh ? r.fromV - 1 : 0;
    const end = ch === r.toCh ? r.toV : perVerse.length;
    for (let v = start; v < end && v < perVerse.length; v++) {
      for (const comment of perVerse[v] ?? []) {
        if (comment) out.push({ verse: ++n, text: comment });
      }
    }
  }
  return out;
}

/** Today's Chitas Chumash aliyah + its Rashi, offline. Null if unavailable. */
export function getLocalChumash(date: Date = new Date()): ChumashItem[] | null {
  const shabbat = getShabbatDate(date);
  const parsha = parshaForShabbat(shabbat);
  if (!parsha) return null;
  const ley = lookupLeyning(parsha);
  if (!ley) return null;

  const dow = date.getDay(); // 0=Sun … 6=Sat
  const aliyahNum = dow === 6 ? 7 : dow + 1;
  const range = ley.aliyot[String(aliyahNum)];
  if (!range) return null;
  const r = parseRange(range);
  if (!r) return null;

  const bookHe = BOOK_HE[r.book] ?? r.book;
  const parshaHe = ley.he ?? parsha;
  const aliyahHe = ALIYAH_HE[aliyahNum - 1] ?? '';

  const items: ChumashItem[] = [];
  const torah = sliceTorah(r);
  if (torah.length > 0) {
    items.push({
      title: `${parsha} ${aliyahNum}`,
      titleHe: `פרשת ${parshaHe} · עלייה ${aliyahHe} (${bookHe})`,
      sections: torah,
      ref: range,
    });
  }
  const rashi = sliceRashi(r);
  if (rashi.length > 0) {
    items.push({
      title: `Rashi on ${range}`,
      titleHe: `רש״י · פרשת ${parshaHe}`,
      sections: rashi,
      ref: `Rashi on ${range}`,
    });
  }
  return items.length > 0 ? items : null;
}
