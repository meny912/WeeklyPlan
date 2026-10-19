// Shnayim Mikra ve'Echad Targum for the week's parsha, plus the haftarah
// according to Chabad custom.
//
// Sources: parsha + aliyot + base haftarah from Hebcal; Torah / Navi text with
// nikud and te'amim ("Miqra according to the Masorah") and Targum Onkelos from
// Sefaria. Each parsha is fetched once and cached on the device.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BookContent, TextSection } from '@/services/sefariaService';

const CACHE_PREFIX = 'shnayim_v1_';
export const MASORAH = 'hebrew|Miqra according to the Masorah';

const ALIYAH_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שביעי'];

const BOOK_HE: Record<string, string> = {
  Genesis: 'בראשית', Exodus: 'שמות', Leviticus: 'ויקרא', Numbers: 'במדבר', Deuteronomy: 'דברים',
  Joshua: 'יהושע', Judges: 'שופטים', 'I Samuel': 'שמואל א', 'II Samuel': 'שמואל ב',
  'I Kings': 'מלכים א', 'II Kings': 'מלכים ב', Isaiah: 'ישעיהו', Jeremiah: 'ירמיהו',
  Ezekiel: 'יחזקאל', Hosea: 'הושע', Joel: 'יואל', Amos: 'עמוס', Obadiah: 'עובדיה',
  Jonah: 'יונה', Micah: 'מיכה', Zechariah: 'זכריה', Malachi: 'מלאכי',
};

// ─── Chabad haftarot ──────────────────────────────────────
// Chabad follows the Ashkenazi haftarah except for these parshiot
// (he.wikipedia "הפטרה", Chabad column; Noach verified against chabad.org).
// Keys are Hebcal parsha names.
const CHABAD_HAFTARAH: Record<string, string> = {
  'Bereshit': 'Isaiah 42:5-21',
  'Noach': 'Isaiah 54:1-10',
  'Vayetzei': 'Hosea 11:7-12:14',
  'Yitro': 'Isaiah 6:1-13',
  'Ki Tisa': 'I Kings 18:20-39',
  'Vayakhel': 'I Kings 7:13-26',
  'Tzav': 'Jeremiah 7:21-28; 9:22-23',
  'Achrei Mot': 'Amos 9:7-15',
  'Achrei Mot-Kedoshim': 'Amos 9:7-15',
  'Kedoshim': 'Ezekiel 20:2-20',
  'Behar': 'Jeremiah 32:6-22',
  'Behar-Bechukotai': 'Jeremiah 16:19-17:14',
  'Vayeilech': 'Hosea 14:2-10; Micah 7:18-20',
};
const CHABAD_SHABBAT_SHUVA = 'Hosea 14:2-10; Micah 7:18-20';

/** Pick the Chabad haftarah from Hebcal's Ashkenazi one. */
export function chabadHaftarah(parsha: string, hebcalHaftarah: string): string {
  const [ref, reason] = hebcalHaftarah.split('|').map((s) => s.trim());
  // Special Shabbatot (Shekalim, Zachor, Parah, HaChodesh, Chanukah, Rosh Chodesh,
  // Machar Chodesh, HaGadol) follow the Ashkenazi reading, except Shabbat Shuva.
  if (reason) return /Shuva/i.test(reason) ? CHABAD_SHABBAT_SHUVA : ref;
  return CHABAD_HAFTARAH[parsha] ?? ref;
}

// ─── Parsha of the week ───────────────────────────────────
export function inIsrael(): boolean {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Jerusalem';
  } catch {
    return false;
  }
}

export function localISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** The coming Shabbat (today, if today is Shabbat). */
export function upcomingShabbat(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
  return d;
}

export interface ParshaInfo {
  name: string;        // Hebcal name, e.g. "Noach"
  nameHe: string;      // "פרשת נח"
  aliyot: string[];    // 7 Sefaria refs
  haftarah: string;    // Chabad haftarah ref(s)
}

export async function fetchParsha(date: Date): Promise<ParshaInfo | null> {
  // Some Shabbatot (Yom Tov) have no parsha – look ahead up to three weeks.
  const start = upcomingShabbat(date);
  for (let week = 0; week < 3; week++) {
    const s = new Date(start);
    s.setDate(s.getDate() + week * 7);
    const day = localISO(s);
    const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&s=on&leyning=on&i=${inIsrael() ? 'on' : 'off'}&start=${day}&end=${day}`;
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!resp.ok) throw new Error(`Hebcal ${resp.status}`);
    const data = await resp.json();
    const item = (data.items ?? []).find((i: any) => i.category === 'parashat' && i.leyning);
    if (!item) continue;
    const l = item.leyning;
    const name = String(item.title).replace(/^Parashat\s+/, '').replace(/’/g, "'");
    return {
      name,
      nameHe: item.hebrew ?? name,
      aliyot: ['1', '2', '3', '4', '5', '6', '7'].map((k) => l[k]).filter(Boolean),
      haftarah: chabadHaftarah(name, l.haftarah ?? ''),
    };
  }
  return null;
}

// ─── Sefaria text ─────────────────────────────────────────
function clean(t: string): string {
  return t
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '')
    .replace(/<i[^>]*class="footnote"[^>]*>[\s\S]*?<\/i>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&thinsp;|&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, '')
    .replace(/\{[פס]\}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

interface Pos { ch: number; v: number }
interface Verse extends Pos { text: string }

function parseRef(ref: string): { book: string; from: Pos; to: Pos } {
  // "Genesis 6:9-11:32" | "Genesis 7:1-7:16" | "Isaiah 54:1-10"
  const m = ref.trim().match(/^(.+?)\s+(\d+):(\d+)(?:-(?:(\d+):)?(\d+))?$/);
  if (!m) throw new Error(`Bad ref ${ref}`);
  const from = { ch: +m[2], v: +m[3] };
  const to = m[5] ? { ch: m[4] ? +m[4] : from.ch, v: +m[5] } : from;
  return { book: m[1], from, to };
}

export async function fetchVerses(ref: string, version?: string): Promise<Verse[]> {
  const { from } = parseRef(ref);
  const q = version ? `?version=${encodeURIComponent(version)}` : '';
  const resp = await fetch(`https://www.sefaria.org/api/v3/texts/${encodeURIComponent(ref)}${q}`, {
    headers: { Accept: 'application/json' },
  });
  if (!resp.ok) throw new Error(`Sefaria ${resp.status}: ${ref}`);
  const data = await resp.json();
  const raw = data.versions?.[0]?.text;
  if (!raw) throw new Error(`No text: ${ref}`);
  const chapters: string[][] = Array.isArray(raw[0]) ? raw : [raw];
  const out: Verse[] = [];
  chapters.forEach((verses, ci) => {
    verses.forEach((text, vi) => {
      out.push({ ch: from.ch + ci, v: (ci === 0 ? from.v : 1) + vi, text: clean(text) });
    });
  });
  return out;
}

const cmp = (a: Pos, b: Pos) => a.ch - b.ch || a.v - b.v;

export const HEB_NUM = (n: number): string => {
  const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
  const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
  if (n === 15) return 'ט״ו';
  if (n === 16) return 'ט״ז';
  const s = (n >= 100 ? 'ק' : '') + tens[Math.floor((n % 100) / 10)] + ones[n % 10];
  return s.length > 1 ? `${s.slice(0, -1)}״${s.slice(-1)}` : `${s}׳`;
};

function heRef(ref: string): string {
  const { book, from, to } = parseRef(ref);
  const b = BOOK_HE[book] ?? book;
  const end = to.ch === from.ch ? HEB_NUM(to.v) : `${HEB_NUM(to.ch)}, ${HEB_NUM(to.v)}`;
  return `${b} ${HEB_NUM(from.ch)}, ${HEB_NUM(from.v)} – ${end}`;
}

/** "Isaiah 27:6-28:13, 29:22-23" → ["Isaiah 27:6-28:13", "Isaiah 29:22-23"] */
function splitRefs(refs: string): string[] {
  let book = '';
  return refs.split(/[;,]/).map((part) => {
    const p = part.trim();
    const m = p.match(/^(.*?[A-Za-z])\s+\d/);
    if (m) book = m[1];
    else return `${book} ${p}`;
    return p;
  }).filter(Boolean);
}

// ─── Chumash with Rashi after every verse ─────────────────
/** Rashi comments keyed by "chapter:verse"; each comment split into its
 *  dibbur hamatchil (the bold lead words) and the explanation. */
async function fetchRashi(ref: string): Promise<Map<string, { lead: string; text: string }[]>> {
  const { from } = parseRef(ref);
  const resp = await fetch(`https://www.sefaria.org/api/v3/texts/${encodeURIComponent(`Rashi on ${ref}`)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!resp.ok) throw new Error(`Sefaria ${resp.status}: Rashi on ${ref}`);
  const raw = (await resp.json()).versions?.[0]?.text;
  const out = new Map<string, { lead: string; text: string }[]>();
  if (!Array.isArray(raw)) return out;
  // Single chapter → [verse][comment]; several chapters → [chapter][verse][comment]
  const depth3 = raw.some((v: any) => Array.isArray(v) && v.some((c: any) => Array.isArray(c)));
  const chapters: string[][][] = depth3 ? raw : [raw];
  chapters.forEach((verses, ci) => {
    verses.forEach((comments, vi) => {
      const list = (Array.isArray(comments) ? comments : [comments]).filter(Boolean).map((c: string) => {
        const m = c.match(/^\s*<b>([\s\S]*?)<\/b>\s*([\s\S]*)$/);
        return m ? { lead: clean(m[1]), text: clean(m[2]) } : { lead: '', text: clean(c) };
      });
      if (list.length) out.set(`${from.ch + ci}:${(ci === 0 ? from.v : 1) + vi}`, list);
    });
  });
  return out;
}

/** One aliyah of Chumash with each verse followed by its Rashi. */
export async function fetchChumashWithRashi(ref: string, titleHe: string): Promise<BookContent> {
  const key = CACHE_PREFIX + 'rashi_' + ref;
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) return JSON.parse(cached);
  } catch {}
  const [verses, rashi] = await Promise.all([
    fetchVerses(ref, MASORAH),
    fetchRashi(ref).catch(() => new Map<string, { lead: string; text: string }[]>()),
  ]);
  const rows: TextSection[] = [];
  for (const v of verses) {
    rows.push({ verse: v.v, text: v.text, kind: 'mikra' });
    for (const c of rashi.get(`${v.ch}:${v.v}`) ?? []) {
      rows.push({ verse: v.v, text: c.text, lead: c.lead, kind: 'rashi' });
    }
  }
  const result: BookContent = { title: ref, titleHe, sections: rows, ref: heRef(ref) };
  if (rows.length) {
    try { await AsyncStorage.setItem(key, JSON.stringify(result)); } catch {}
  }
  return result;
}

// ─── Public API ───────────────────────────────────────────
export interface ShnayimMikra {
  parshaHe: string;
  sections: BookContent[]; // one per aliyah, then the haftarah
}

export async function fetchShnayimMikra(date: Date = new Date()): Promise<ShnayimMikra> {
  const parsha = await fetchParsha(date);
  if (!parsha) throw new Error('No parsha');

  const key = CACHE_PREFIX + localISO(upcomingShabbat(date)) + (inIsrael() ? '_il' : '');
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) return JSON.parse(cached);
  } catch {}

  // Hebcal's "torah" field also lists special maftir readings, so span the
  // parsha from the first aliyah to the last.
  const first = parseRef(parsha.aliyot[0]);
  const last = parseRef(parsha.aliyot[parsha.aliyot.length - 1]);
  const torahRef = `${first.book} ${first.from.ch}:${first.from.v}-${last.to.ch}:${last.to.v}`;
  const [mikra, targum] = await Promise.all([
    fetchVerses(torahRef, MASORAH),
    fetchVerses(`Onkelos ${torahRef}`).catch(() => [] as Verse[]),
  ]);
  const targumAt = new Map(targum.map((t) => [`${t.ch}:${t.v}`, t.text]));

  const todayAliyah = date.getDay(); // Sunday = first aliyah … Shabbat = seventh
  const sections: BookContent[] = parsha.aliyot.map((ref, i) => {
    const { from, to } = parseRef(ref);
    const verses = mikra.filter((v) => cmp(v, from) >= 0 && cmp(v, to) <= 0);
    const rows: TextSection[] = [];
    for (const v of verses) {
      rows.push({ verse: v.v, text: v.text, kind: 'mikra' });
      rows.push({ verse: v.v, text: v.text, kind: 'mikra2' });
      const tg = targumAt.get(`${v.ch}:${v.v}`);
      if (tg) rows.push({ verse: v.v, text: tg, kind: 'targum' });
    }
    return {
      title: ref,
      titleHe: `${ALIYAH_HE[i]}${i === todayAliyah ? ' · להיום' : ''}`,
      sections: rows,
      ref: heRef(ref),
    };
  });

  // Haftarah
  try {
    const parts = splitRefs(parsha.haftarah);
    const verseLists = await Promise.all(parts.map((r) => fetchVerses(r, MASORAH)));
    const rows: TextSection[] = verseLists.flat().map((v) => ({ verse: v.v, text: v.text }));
    if (rows.length) {
      sections.push({
        title: parsha.haftarah,
        titleHe: 'הפטרה · מנהג חב״ד',
        sections: rows,
        ref: parts.map(heRef).join(' ; '),
      });
    }
  } catch {}

  const result: ShnayimMikra = { parshaHe: parsha.nameHe, sections };
  try {
    await AsyncStorage.setItem(key, JSON.stringify(result));
  } catch {}
  return result;
}
