// German daily learning: today's Chumash aliyah.
// Texts (public domain, via Sefaria):
//   Chumash – Samson Raphael Hirsch, Der Pentateuch (Frankfurt 1867–1878)
//   Raschi  – Selig Bamberger, Raschis Pentateuchkommentar (Hamburg 1922; Bereschit only)
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BookContent, TextSection } from '@/services/sefariaService';
import { fetchParsha } from '@/services/shnayimMikraService';

const CHUMASH_DE = 'Der Pentateuch, übersetzt und erläutert von Samson Raphael Hirsch. Frankfurt am Main, 1867-1878 [de]';
const RASHI_DE = 'Raschis Pentateuchkommentar, trans. Rabb. Dr. Selig Bamberger, Hamburg, 1922. Edited by Igor Itkin [de]';
const CACHE = 'german_v1_';

const ALIYAH_DE = ['Erster', 'Zweiter', 'Dritter', 'Vierter', 'Fünfter', 'Sechster', 'Siebter'];

function clean(t: string): string {
  return t
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '')
    .replace(/<i[^>]*class="footnote"[^>]*>[\s\S]*?<\/i>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;|&thinsp;/g, ' ')
    .replace(/&[a-z]+;/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Raw Sefaria text for one ref in one version (v1 API; arrays may be nested). */
async function fetchVersion(ref: string, version: string): Promise<any> {
  const url = `https://www.sefaria.org/api/texts/${encodeURIComponent(ref.replace(/ /g, '_'))}`
    + `?ven=${encodeURIComponent(version)}&context=0&commentary=0`;
  const resp = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!resp.ok) throw new Error(`Sefaria ${resp.status}: ${ref}`);
  return (await resp.json()).text;
}

async function cached<T>(key: string, make: () => Promise<T>): Promise<T> {
  try {
    const hit = await AsyncStorage.getItem(CACHE + key);
    if (hit) return JSON.parse(hit);
  } catch {}
  const value = await make();
  try { await AsyncStorage.setItem(CACHE + key, JSON.stringify(value)); } catch {}
  return value;
}

interface Pos { ch: number; v: number }
function parseRef(ref: string): { book: string; from: Pos; to: Pos } {
  const m = ref.trim().match(/^(.+?)\s+(\d+):(\d+)(?:-(?:(\d+):)?(\d+))?$/);
  if (!m) throw new Error(`Bad ref ${ref}`);
  const from = { ch: +m[2], v: +m[3] };
  return { book: m[1], from, to: m[5] ? { ch: m[4] ? +m[4] : from.ch, v: +m[5] } : from };
}

/** Flatten [chapter][verse] (or [verse]) into verses with their chapter:verse. */
function flatten(raw: any, from: Pos): { ch: number; v: number; value: any }[] {
  if (!Array.isArray(raw)) return raw ? [{ ...from, value: raw }] : [];
  const nested = raw.some((x: any) => Array.isArray(x));
  const chapters = nested ? raw : [raw];
  const out: { ch: number; v: number; value: any }[] = [];
  chapters.forEach((verses: any[], ci: number) =>
    (Array.isArray(verses) ? verses : [verses]).forEach((value, vi) =>
      out.push({ ch: from.ch + ci, v: (ci === 0 ? from.v : 1) + vi, value })));
  return out;
}

const BOOK_DE: Record<string, string> = {
  Genesis: 'Bereschit', Exodus: 'Schemot', Leviticus: 'Wajikra', Numbers: 'Bamidbar', Deuteronomy: 'Dewarim',
};

/** Today's aliyah in German (Hirsch), with Raschi after each verse where available. */
export async function fetchChumashGerman(date: Date = new Date()): Promise<BookContent[]> {
  const parsha = await fetchParsha(date);
  if (!parsha) throw new Error('No parsha');
  const idx = date.getDay() === 6 ? 6 : date.getDay();
  const ref = parsha.aliyot[idx] ?? parsha.aliyot[0];
  return cached(`chumash_${ref}`, async () => {
    const { book, from } = parseRef(ref);
    const [text, rashi] = await Promise.all([
      fetchVersion(ref, CHUMASH_DE),
      fetchVersion(`Rashi on ${ref}`, RASHI_DE).catch(() => null),
    ]);
    const rashiAt = new Map<string, string[]>();
    for (const r of flatten(rashi, from)) {
      const list = (Array.isArray(r.value) ? r.value : [r.value]).filter(Boolean).map((c: string) => c);
      if (list.length) rashiAt.set(`${r.ch}:${r.v}`, list);
    }
    const rows: TextSection[] = [];
    for (const v of flatten(text, from)) {
      if (!v.value) continue;
      rows.push({ verse: v.v, text: clean(String(v.value)), kind: 'mikra' });
      for (const c of rashiAt.get(`${v.ch}:${v.v}`) ?? []) {
        const m = c.match(/^\s*<b>([\s\S]*?)<\/b>\s*([\s\S]*)$/);
        rows.push({ verse: v.v, text: clean(m ? m[2] : c), lead: m ? clean(m[1]) : undefined, kind: 'rashi' });
      }
    }
    const parshaDe = parsha.name.replace(/-/g, '–');
    const { to } = parseRef(ref);
    const range = to.ch === from.ch ? `${from.ch},${from.v}–${to.v}` : `${from.ch},${from.v}–${to.ch},${to.v}`;
    return [{
      title: ref,
      titleHe: `Paraschat ${parshaDe} · ${ALIYAH_DE[idx]} Abschnitt`,
      sections: rows,
      ref: `${BOOK_DE[book] ?? book} ${range} · Übersetzung: S. R. Hirsch`,
      lang: 'de',
    }];
  });
}
