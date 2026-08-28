// Powered by OnSpace.AI
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HDate, Sedra } from '@hebcal/core';
// Static import – avoids dynamic-import failures that caused the wrong chapter to appear
import { getTanyaRefByDate, fetchTanyaEntry } from '@/services/tanyaScheduleService';
import { getDailyTehillim } from '@/constants/tehillim/tehillimSchedule';
import { getLocalTanya } from '@/services/tanyaOffline';
import { getLocalRambam } from '@/services/rambamOffline';

// ─── Types ────────────────────────────────────────────────
export interface TextSection {
  verse: number;
  text: string;
}

export interface BookContent {
  title: string;
  titleHe: string;
  sections: TextSection[];
  ref: string;
}

// ─── Cache helpers ────────────────────────────────────────
const CACHE_PREFIX = 'sefaria_text_v6_'; // bumped to v6 to invalidate stale Tanya chapter cache
const CACHE_TTL = 1000 * 60 * 60 * 24 * 30; // 30 days

async function getCached(key: string): Promise<BookContent | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > CACHE_TTL) return null;
    return parsed.data as BookContent;
  } catch {
    return null;
  }
}

async function setCache(key: string, data: BookContent): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

// ─── Strip HTML / footnotes / stray Latin from Sefaria text ────────
// All texts we fetch (Chumash, Rashi, Tanya, Rambam, HaYom Yom) are Hebrew, so
// any Latin letters are noise — footnote markers, French/Latin glosses (לעז),
// or English source references. Drop footnote content and any Latin outright.
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '')            // footnote markers
    .replace(/<i[^>]*class="footnote"[^>]*>[\s\S]*?<\/i>/gi, '') // footnote bodies
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&thinsp;/g, ' ')
    .replace(/&#x2F;/g, '/')
    .replace(/&[a-z]+;/gi, ' ')                            // any leftover entity
    .replace(/[A-Za-z]/g, '')                              // stray Latin letters
    .replace(/[([][^֐-׿0-9]*[)\]]/g, ' ')        // brackets left with no Hebrew inside
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Sefaria API fetch ────────────────────────────────────
async function fetchFromSefaria(ref: string, titleHeOverride?: string): Promise<BookContent> {
  const cacheKey = ref.replace(/[\s,;]/g, '_');
  const cached = await getCached(cacheKey);
  if (cached) {
    if (titleHeOverride) return { ...cached, titleHe: titleHeOverride };
    return cached;
  }

  // Sefaria requires spaces→underscores but ; must stay encoded
  // Correct format: "Tanya,_Part_I;_Likkutei_Amarim.46" (commas & semicolons preserved)
  const encoded = ref.replace(/ /g, '_');
  const url = `https://www.sefaria.org/api/texts/${encodeURIComponent(encoded)}?context=0&commentary=0&stripItags=1&pad=0`;

  const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!resp.ok) throw new Error(`Sefaria ${resp.status}: ${ref}`);
  const data = await resp.json();

  // he field can be flat array or nested array
  let heText: string[] = [];
  if (Array.isArray(data.he)) {
    if (data.he.length > 0 && Array.isArray(data.he[0])) {
      heText = (data.he as string[][]).flat();
    } else {
      heText = data.he as string[];
    }
  }

  const sections: TextSection[] = heText
    .filter((t: string) => t && t.trim().length > 0)
    .map((t: string, i: number) => ({ verse: i + 1, text: stripHtml(t) }));

  const result: BookContent = {
    title: data.title ?? ref,
    titleHe: titleHeOverride ?? data.heTitle ?? data.title ?? ref,
    sections,
    ref: data.ref ?? ref,
  };

  if (sections.length > 0) await setCache(cacheKey, result);
  return result;
}

// ─── Hebcal daily learning API ────────────────────────────
// Returns JSON with items for rambam3, parashat, etc.
const HEBCAL_CACHE_PREFIX = 'hebcal_daily_';
const HEBCAL_CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

interface HebcalItem {
  title: string;
  category: string;
  hebrew?: string;
  link?: string;
  leyning?: Record<string, string>;
  date?: string;
  hdate?: string;
}

async function fetchHebcalDaily(date: Date): Promise<HebcalItem[]> {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const cacheKey = HEBCAL_CACHE_PREFIX + dateStr;

  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.ts < HEBCAL_CACHE_TTL) return parsed.data;
    }
  } catch {}

  try {
    // Fetch rambam3 + parasha (leyning) for this date
    const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&dr3=on&s=on&i=on&leyning=on&start=${dateStr}&end=${dateStr}`;
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!resp.ok) return [];
    const data = await resp.json();
    const items: HebcalItem[] = data.items ?? [];
    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify({ data: items, ts: Date.now() }));
    } catch {}
    return items;
  } catch {
    return [];
  }
}

// ─── Sefaria daily calendar (authoritative refs for Rambam / Tanya) ──────
// Sefaria's /api/calendars returns the exact daily ref for each learning cycle,
// which is always current — unlike Hebcal's link field (dropped) or a static table.
const SEFARIA_CAL_PREFIX = 'sefaria_cal_';
const SEFARIA_CAL_TTL = 1000 * 60 * 60 * 24; // 24h

export interface SefariaDailyRefs {
  rambam3: string[]; // "Daily Rambam (3 Chapters)" refs (may span two books → 2 items)
  tanya: string | null;
}

export async function fetchSefariaDailyRefs(date: Date = new Date()): Promise<SefariaDailyRefs> {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const cacheKey = `${SEFARIA_CAL_PREFIX}${y}-${m}-${d}`;

  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.ts < SEFARIA_CAL_TTL) return parsed.data as SefariaDailyRefs;
    }
  } catch {}

  const empty: SefariaDailyRefs = { rambam3: [], tanya: null };
  try {
    const url = `https://www.sefaria.org/api/calendars?year=${y}&month=${m}&day=${d}`;
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!resp.ok) return empty;
    const data = await resp.json();
    const items: any[] = data.calendar_items ?? [];
    const rambam3: string[] = [];
    let tanya: string | null = null;
    for (const it of items) {
      const en = it?.title?.en ?? '';
      const ref: string = it?.ref ?? '';
      if (!ref) continue;
      if (en === 'Daily Rambam (3 Chapters)') rambam3.push(ref);
      else if (en === 'Tanya Yomi' || en === 'Tanya') tanya = ref;
    }
    const result: SefariaDailyRefs = { rambam3, tanya };
    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify({ data: result, ts: Date.now() }));
    } catch {}
    return result;
  } catch {
    return empty;
  }
}

// ─── Tehillim (Psalms) ───────────────────────────────────
// The Tehillim text is served locally (offline) from constants/tehillim.
// The daily division ("מחולק לימי החודש") lives in constants/tehillim/tehillimSchedule.
// This helper returns just the chapter numbers for a Hebrew day of month, kept
// in sync with that single source so the daily-learning card stays consistent.
export function getTehillimChaptersForDay(hebrewDay: number): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const p of getDailyTehillim(hebrewDay)) {
    if (!seen.has(p.chapter)) {
      seen.add(p.chapter);
      out.push(p.chapter);
    }
  }
  return out;
}

// ─── Tanya ───────────────────────────────────────────────
// Tanya daily schedule is now handled by tanyaScheduleService.ts which
// contains the full static TANYA_SCHEDULE (365 entries) and getDailyTanyaRef().
// The legacy TANYA_BY_DATE lookup below is kept as a fallback for any code
// that still references it directly.

type MonthDay = `${number}_${number}`;

function md(month: number, day: number): MonthDay { return `${month}_${day}`; }

const TANYA_BY_DATE: Record<MonthDay, { ref: string; titleHe: string }> = {
  // ───── TISHREI (7) ─────
  [md(7,1)]:  { ref: 'Tanya, Part I; Likkutei Amarim.1',  titleHe: 'ליקוטי אמרים – פרק א' },
  [md(7,2)]:  { ref: 'Tanya, Part I; Likkutei Amarim.2',  titleHe: 'ליקוטי אמרים – פרק ב' },
  [md(7,3)]:  { ref: 'Tanya, Part I; Likkutei Amarim.3',  titleHe: 'ליקוטי אמרים – פרק ג' },
  [md(7,4)]:  { ref: 'Tanya, Part I; Likkutei Amarim.4',  titleHe: 'ליקוטי אמרים – פרק ד' },
  [md(7,5)]:  { ref: 'Tanya, Part I; Likkutei Amarim.5',  titleHe: 'ליקוטי אמרים – פרק ה' },
  [md(7,6)]:  { ref: 'Tanya, Part I; Likkutei Amarim.6',  titleHe: 'ליקוטי אמרים – פרק ו' },
  [md(7,7)]:  { ref: 'Tanya, Part I; Likkutei Amarim.7',  titleHe: 'ליקוטי אמרים – פרק ז' },
  [md(7,8)]:  { ref: 'Tanya, Part I; Likkutei Amarim.8',  titleHe: 'ליקוטי אמרים – פרק ח' },
  [md(7,9)]:  { ref: 'Tanya, Part I; Likkutei Amarim.9',  titleHe: 'ליקוטי אמרים – פרק ט' },
  [md(7,10)]: { ref: 'Tanya, Part I; Likkutei Amarim.10', titleHe: 'ליקוטי אמרים – פרק י' },
  [md(7,11)]: { ref: 'Tanya, Part I; Likkutei Amarim.11', titleHe: 'ליקוטי אמרים – פרק יא' },
  [md(7,12)]: { ref: 'Tanya, Part I; Likkutei Amarim.12', titleHe: 'ליקוטי אמרים – פרק יב' },
  [md(7,13)]: { ref: 'Tanya, Part I; Likkutei Amarim.13', titleHe: 'ליקוטי אמרים – פרק יג' },
  [md(7,14)]: { ref: 'Tanya, Part I; Likkutei Amarim.14', titleHe: 'ליקוטי אמרים – פרק יד' },
  [md(7,15)]: { ref: 'Tanya, Part I; Likkutei Amarim.15', titleHe: 'ליקוטי אמרים – פרק טו' },
  [md(7,16)]: { ref: 'Tanya, Part I; Likkutei Amarim.16', titleHe: 'ליקוטי אמרים – פרק טז' },
  [md(7,17)]: { ref: 'Tanya, Part I; Likkutei Amarim.17', titleHe: 'ליקוטי אמרים – פרק יז' },
  [md(7,18)]: { ref: 'Tanya, Part I; Likkutei Amarim.18', titleHe: 'ליקוטי אמרים – פרק יח' },
  [md(7,19)]: { ref: 'Tanya, Part I; Likkutei Amarim.19', titleHe: 'ליקוטי אמרים – פרק יט' },
  [md(7,20)]: { ref: 'Tanya, Part I; Likkutei Amarim.20', titleHe: 'ליקוטי אמרים – פרק כ' },
  [md(7,21)]: { ref: 'Tanya, Part I; Likkutei Amarim.21', titleHe: 'ליקוטי אמרים – פרק כא' },
  [md(7,22)]: { ref: 'Tanya, Part I; Likkutei Amarim.22', titleHe: 'ליקוטי אמרים – פרק כב' },
  [md(7,23)]: { ref: 'Tanya, Part I; Likkutei Amarim.23', titleHe: 'ליקוטי אמרים – פרק כג' },
  [md(7,24)]: { ref: 'Tanya, Part I; Likkutei Amarim.24', titleHe: 'ליקוטי אמרים – פרק כד' },
  [md(7,25)]: { ref: 'Tanya, Part I; Likkutei Amarim.25', titleHe: 'ליקוטי אמרים – פרק כה' },
  [md(7,26)]: { ref: 'Tanya, Part I; Likkutei Amarim.26', titleHe: 'ליקוטי אמרים – פרק כו' },
  [md(7,27)]: { ref: 'Tanya, Part I; Likkutei Amarim.27', titleHe: 'ליקוטי אמרים – פרק כז' },
  [md(7,28)]: { ref: 'Tanya, Part I; Likkutei Amarim.28', titleHe: 'ליקוטי אמרים – פרק כח' },
  [md(7,29)]: { ref: 'Tanya, Part I; Likkutei Amarim.29', titleHe: 'ליקוטי אמרים – פרק כט' },
  [md(7,30)]: { ref: 'Tanya, Part I; Likkutei Amarim.30', titleHe: 'ליקוטי אמרים – פרק ל' },
  // ───── CHESHVAN (8) ─────
  [md(8,1)]:  { ref: 'Tanya, Part I; Likkutei Amarim.31', titleHe: 'ליקוטי אמרים – פרק לא' },
  [md(8,2)]:  { ref: 'Tanya, Part I; Likkutei Amarim.32', titleHe: 'ליקוטי אמרים – פרק לב' },
  [md(8,3)]:  { ref: 'Tanya, Part I; Likkutei Amarim.33', titleHe: 'ליקוטי אמרים – פרק לג' },
  [md(8,4)]:  { ref: 'Tanya, Part I; Likkutei Amarim.34', titleHe: 'ליקוטי אמרים – פרק לד' },
  [md(8,5)]:  { ref: 'Tanya, Part I; Likkutei Amarim.35', titleHe: 'ליקוטי אמרים – פרק לה' },
  [md(8,6)]:  { ref: 'Tanya, Part I; Likkutei Amarim.36', titleHe: 'ליקוטי אמרים – פרק לו' },
  [md(8,7)]:  { ref: 'Tanya, Part I; Likkutei Amarim.37', titleHe: 'ליקוטי אמרים – פרק לז' },
  [md(8,8)]:  { ref: 'Tanya, Part I; Likkutei Amarim.38', titleHe: 'ליקוטי אמרים – פרק לח' },
  [md(8,9)]:  { ref: 'Tanya, Part I; Likkutei Amarim.39', titleHe: 'ליקוטי אמרים – פרק לט' },
  [md(8,10)]: { ref: 'Tanya, Part I; Likkutei Amarim.40', titleHe: 'ליקוטי אמרים – פרק מ' },
  [md(8,11)]: { ref: 'Tanya, Part I; Likkutei Amarim.41', titleHe: 'ליקוטי אמרים – פרק מא' },
  [md(8,12)]: { ref: 'Tanya, Part I; Likkutei Amarim.42', titleHe: 'ליקוטי אמרים – פרק מב' },
  [md(8,13)]: { ref: 'Tanya, Part I; Likkutei Amarim.43', titleHe: 'ליקוטי אמרים – פרק מג' },
  [md(8,14)]: { ref: 'Tanya, Part I; Likkutei Amarim.44', titleHe: 'ליקוטי אמרים – פרק מד' },
  [md(8,15)]: { ref: 'Tanya, Part I; Likkutei Amarim.45', titleHe: 'ליקוטי אמרים – פרק מה' },
  [md(8,16)]: { ref: 'Tanya, Part I; Likkutei Amarim.46', titleHe: 'ליקוטי אמרים – פרק מו' },
  [md(8,17)]: { ref: 'Tanya, Part I; Likkutei Amarim.47', titleHe: 'ליקוטי אמרים – פרק מז' },
  [md(8,18)]: { ref: 'Tanya, Part I; Likkutei Amarim.48', titleHe: 'ליקוטי אמרים – פרק מח' },
  [md(8,19)]: { ref: 'Tanya, Part I; Likkutei Amarim.49', titleHe: 'ליקוטי אמרים – פרק מט' },
  [md(8,20)]: { ref: 'Tanya, Part I; Likkutei Amarim.50', titleHe: 'ליקוטי אמרים – פרק נ' },
  [md(8,21)]: { ref: 'Tanya, Part I; Likkutei Amarim.51', titleHe: 'ליקוטי אמרים – פרק נא' },
  [md(8,22)]: { ref: 'Tanya, Part I; Likkutei Amarim.52', titleHe: 'ליקוטי אמרים – פרק נב' },
  [md(8,23)]: { ref: 'Tanya, Part I; Likkutei Amarim.53', titleHe: 'ליקוטי אמרים – פרק נג' },
  [md(8,24)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.1', titleHe: 'שער היחוד והאמונה – פרק א' },
  [md(8,25)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.2', titleHe: 'שער היחוד והאמונה – פרק ב' },
  [md(8,26)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.3', titleHe: 'שער היחוד והאמונה – פרק ג' },
  [md(8,27)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.4', titleHe: 'שער היחוד והאמונה – פרק ד' },
  [md(8,28)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.5', titleHe: 'שער היחוד והאמונה – פרק ה' },
  [md(8,29)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.6', titleHe: 'שער היחוד והאמונה – פרק ו' },
  [md(8,30)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.7', titleHe: 'שער היחוד והאמונה – פרק ז' },
  // ───── KISLEV (9) ─────
  [md(9,1)]:  { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.8',  titleHe: 'שער היחוד והאמונה – פרק ח' },
  [md(9,2)]:  { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.9',  titleHe: 'שער היחוד והאמונה – פרק ט' },
  [md(9,3)]:  { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.10', titleHe: 'שער היחוד והאמונה – פרק י' },
  [md(9,4)]:  { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.11', titleHe: 'שער היחוד והאמונה – פרק יא' },
  [md(9,5)]:  { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.12', titleHe: 'שער היחוד והאמונה – פרק יב' },
  [md(9,6)]:  { ref: 'Tanya, Part III; Iggeret HaTeshuvah.1',         titleHe: 'איגרת התשובה – פרק א' },
  [md(9,7)]:  { ref: 'Tanya, Part III; Iggeret HaTeshuvah.2',         titleHe: 'איגרת התשובה – פרק ב' },
  [md(9,8)]:  { ref: 'Tanya, Part III; Iggeret HaTeshuvah.3',         titleHe: 'איגרת התשובה – פרק ג' },
  [md(9,9)]:  { ref: 'Tanya, Part III; Iggeret HaTeshuvah.4',         titleHe: 'איגרת התשובה – פרק ד' },
  [md(9,10)]: { ref: 'Tanya, Part III; Iggeret HaTeshuvah.5',         titleHe: 'איגרת התשובה – פרק ה' },
  [md(9,11)]: { ref: 'Tanya, Part III; Iggeret HaTeshuvah.6',         titleHe: 'איגרת התשובה – פרק ו' },
  [md(9,12)]: { ref: 'Tanya, Part III; Iggeret HaTeshuvah.7',         titleHe: 'איגרת התשובה – פרק ז' },
  [md(9,13)]: { ref: 'Tanya, Part III; Iggeret HaTeshuvah.8',         titleHe: 'איגרת התשובה – פרק ח' },
  [md(9,14)]: { ref: 'Tanya, Part III; Iggeret HaTeshuvah.9',         titleHe: 'איגרת התשובה – פרק ט' },
  [md(9,15)]: { ref: 'Tanya, Part III; Iggeret HaTeshuvah.10',        titleHe: 'איגרת התשובה – פרק י' },
  [md(9,16)]: { ref: 'Tanya, Part III; Iggeret HaTeshuvah.11',        titleHe: 'איגרת התשובה – פרק יא' },
  [md(9,17)]: { ref: 'Tanya, Part III; Iggeret HaTeshuvah.12',        titleHe: 'איגרת התשובה – פרק יב' },
  [md(9,18)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.1',            titleHe: 'איגרת הקודש – איגרת א' },
  [md(9,19)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.2',            titleHe: 'איגרת הקודש – איגרת ב' },
  [md(9,20)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.3',            titleHe: 'איגרת הקודש – איגרת ג' },
  [md(9,21)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.4',            titleHe: 'איגרת הקודש – איגרת ד' },
  [md(9,22)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.5',            titleHe: 'איגרת הקודש – איגרת ה' },
  [md(9,23)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.6',            titleHe: 'איגרת הקודש – איגרת ו' },
  [md(9,24)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.7',            titleHe: 'איגרת הקודש – איגרת ז' },
  [md(9,25)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.8',            titleHe: 'איגרת הקודש – איגרת ח' },
  [md(9,26)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.9',            titleHe: 'איגרת הקודש – איגרת ט' },
  [md(9,27)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.10',           titleHe: 'איגרת הקודש – איגרת י' },
  [md(9,28)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.11',           titleHe: 'איגרת הקודש – איגרת יא' },
  [md(9,29)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.12',           titleHe: 'איגרת הקודש – איגרת יב' },
  [md(9,30)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.13',           titleHe: 'איגרת הקודש – איגרת יג' },
  // ───── TEVET (10) ─────
  [md(10,1)]:  { ref: 'Tanya, Part IV; Iggeret HaKodesh.14', titleHe: 'איגרת הקודש – איגרת יד' },
  [md(10,2)]:  { ref: 'Tanya, Part IV; Iggeret HaKodesh.15', titleHe: 'איגרת הקודש – איגרת טו' },
  [md(10,3)]:  { ref: 'Tanya, Part IV; Iggeret HaKodesh.16', titleHe: 'איגרת הקודש – איגרת טז' },
  [md(10,4)]:  { ref: 'Tanya, Part IV; Iggeret HaKodesh.17', titleHe: 'איגרת הקודש – איגרת יז' },
  [md(10,5)]:  { ref: 'Tanya, Part IV; Iggeret HaKodesh.18', titleHe: 'איגרת הקודש – איגרת יח' },
  [md(10,6)]:  { ref: 'Tanya, Part IV; Iggeret HaKodesh.19', titleHe: 'איגרת הקודש – איגרת יט' },
  [md(10,7)]:  { ref: 'Tanya, Part IV; Iggeret HaKodesh.20', titleHe: 'איגרת הקודש – איגרת כ' },
  [md(10,8)]:  { ref: 'Tanya, Part IV; Iggeret HaKodesh.21', titleHe: 'איגרת הקודש – איגרת כא' },
  [md(10,9)]:  { ref: 'Tanya, Part IV; Iggeret HaKodesh.22', titleHe: 'איגרת הקודש – איגרת כב' },
  [md(10,10)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.23', titleHe: 'איגרת הקודש – איגרת כג' },
  [md(10,11)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.24', titleHe: 'איגרת הקודש – איגרת כד' },
  [md(10,12)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.25', titleHe: 'איגרת הקודש – איגרת כה' },
  [md(10,13)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.26', titleHe: 'איגרת הקודש – איגרת כו' },
  [md(10,14)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.27', titleHe: 'איגרת הקודש – איגרת כז' },
  [md(10,15)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.28', titleHe: 'איגרת הקודש – איגרת כח' },
  [md(10,16)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.29', titleHe: 'איגרת הקודש – איגרת כט' },
  [md(10,17)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.30', titleHe: 'איגרת הקודש – איגרת ל' },
  [md(10,18)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.31', titleHe: 'איגרת הקודש – איגרת לא' },
  [md(10,19)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.32', titleHe: 'איגרת הקודש – איגרת לב' },
  [md(10,20)]: { ref: 'Tanya, Part V; Kuntres Acharon.1',    titleHe: 'קונטרס אחרון – מאמר א' },
  [md(10,21)]: { ref: 'Tanya, Part V; Kuntres Acharon.2',    titleHe: 'קונטרס אחרון – מאמר ב' },
  [md(10,22)]: { ref: 'Tanya, Part V; Kuntres Acharon.3',    titleHe: 'קונטרס אחרון – מאמר ג' },
  [md(10,23)]: { ref: 'Tanya, Part V; Kuntres Acharon.4',    titleHe: 'קונטרס אחרון – מאמר ד' },
  [md(10,24)]: { ref: 'Tanya, Part V; Kuntres Acharon.5',    titleHe: 'קונטרס אחרון – מאמר ה' },
  [md(10,25)]: { ref: 'Tanya, Part V; Kuntres Acharon.6',    titleHe: 'קונטרס אחרון – מאמר ו' },
  [md(10,26)]: { ref: 'Tanya, Part V; Kuntres Acharon.7',    titleHe: 'קונטרס אחרון – מאמר ז' },
  [md(10,27)]: { ref: 'Tanya, Part V; Kuntres Acharon.8',    titleHe: 'קונטרס אחרון – מאמר ח' },
  [md(10,28)]: { ref: 'Tanya, Part V; Kuntres Acharon.9',    titleHe: 'קונטרס אחרון – מאמר ט' },
  [md(10,29)]: { ref: 'Tanya, Part I; Likkutei Amarim.1',    titleHe: 'ליקוטי אמרים – פרק א (חזרה)' },
  // ───── SHVAT (11) ─────
  [md(11,1)]:  { ref: 'Tanya, Part I; Likkutei Amarim.2',  titleHe: 'ליקוטי אמרים – פרק ב' },
  [md(11,2)]:  { ref: 'Tanya, Part I; Likkutei Amarim.3',  titleHe: 'ליקוטי אמרים – פרק ג' },
  [md(11,3)]:  { ref: 'Tanya, Part I; Likkutei Amarim.4',  titleHe: 'ליקוטי אמרים – פרק ד' },
  [md(11,4)]:  { ref: 'Tanya, Part I; Likkutei Amarim.5',  titleHe: 'ליקוטי אמרים – פרק ה' },
  [md(11,5)]:  { ref: 'Tanya, Part I; Likkutei Amarim.6',  titleHe: 'ליקוטי אמרים – פרק ו' },
  [md(11,6)]:  { ref: 'Tanya, Part I; Likkutei Amarim.7',  titleHe: 'ליקוטי אמרים – פרק ז' },
  [md(11,7)]:  { ref: 'Tanya, Part I; Likkutei Amarim.8',  titleHe: 'ליקוטי אמרים – פרק ח' },
  [md(11,8)]:  { ref: 'Tanya, Part I; Likkutei Amarim.9',  titleHe: 'ליקוטי אמרים – פרק ט' },
  [md(11,9)]:  { ref: 'Tanya, Part I; Likkutei Amarim.10', titleHe: 'ליקוטי אמרים – פרק י' },
  [md(11,10)]: { ref: 'Tanya, Part I; Likkutei Amarim.11', titleHe: 'ליקוטי אמרים – פרק יא' },
  [md(11,11)]: { ref: 'Tanya, Part I; Likkutei Amarim.12', titleHe: 'ליקוטי אמרים – פרק יב' },
  [md(11,12)]: { ref: 'Tanya, Part I; Likkutei Amarim.13', titleHe: 'ליקוטי אמרים – פרק יג' },
  [md(11,13)]: { ref: 'Tanya, Part I; Likkutei Amarim.14', titleHe: 'ליקוטי אמרים – פרק יד' },
  [md(11,14)]: { ref: 'Tanya, Part I; Likkutei Amarim.15', titleHe: 'ליקוטי אמרים – פרק טו' },
  [md(11,15)]: { ref: 'Tanya, Part I; Likkutei Amarim.16', titleHe: 'ליקוטי אמרים – פרק טז' },
  [md(11,16)]: { ref: 'Tanya, Part I; Likkutei Amarim.17', titleHe: 'ליקוטי אמרים – פרק יז' },
  [md(11,17)]: { ref: 'Tanya, Part I; Likkutei Amarim.18', titleHe: 'ליקוטי אמרים – פרק יח' },
  [md(11,18)]: { ref: 'Tanya, Part I; Likkutei Amarim.19', titleHe: 'ליקוטי אמרים – פרק יט' },
  [md(11,19)]: { ref: 'Tanya, Part I; Likkutei Amarim.20', titleHe: 'ליקוטי אמרים – פרק כ' },
  [md(11,20)]: { ref: 'Tanya, Part I; Likkutei Amarim.21', titleHe: 'ליקוטי אמרים – פרק כא' },
  [md(11,21)]: { ref: 'Tanya, Part I; Likkutei Amarim.22', titleHe: 'ליקוטי אמרים – פרק כב' },
  [md(11,22)]: { ref: 'Tanya, Part I; Likkutei Amarim.23', titleHe: 'ליקוטי אמרים – פרק כג' },
  [md(11,23)]: { ref: 'Tanya, Part I; Likkutei Amarim.24', titleHe: 'ליקוטי אמרים – פרק כד' },
  [md(11,24)]: { ref: 'Tanya, Part I; Likkutei Amarim.25', titleHe: 'ליקוטי אמרים – פרק כה' },
  [md(11,25)]: { ref: 'Tanya, Part I; Likkutei Amarim.26', titleHe: 'ליקוטי אמרים – פרק כו' },
  [md(11,26)]: { ref: 'Tanya, Part I; Likkutei Amarim.27', titleHe: 'ליקוטי אמרים – פרק כז' },
  [md(11,27)]: { ref: 'Tanya, Part I; Likkutei Amarim.28', titleHe: 'ליקוטי אמרים – פרק כח' },
  [md(11,28)]: { ref: 'Tanya, Part I; Likkutei Amarim.29', titleHe: 'ליקוטי אמרים – פרק כט' },
  [md(11,29)]: { ref: 'Tanya, Part I; Likkutei Amarim.30', titleHe: 'ליקוטי אמרים – פרק ל' },
  [md(11,30)]: { ref: 'Tanya, Part I; Likkutei Amarim.31', titleHe: 'ליקוטי אמרים – פרק לא' },
  // ───── ADAR I (12) ─────
  [md(12,1)]:  { ref: 'Tanya, Part I; Likkutei Amarim.32', titleHe: 'ליקוטי אמרים – פרק לב' },
  [md(12,2)]:  { ref: 'Tanya, Part I; Likkutei Amarim.33', titleHe: 'ליקוטי אמרים – פרק לג' },
  [md(12,3)]:  { ref: 'Tanya, Part I; Likkutei Amarim.34', titleHe: 'ליקוטי אמרים – פרק לד' },
  [md(12,4)]:  { ref: 'Tanya, Part I; Likkutei Amarim.35', titleHe: 'ליקוטי אמרים – פרק לה' },
  [md(12,5)]:  { ref: 'Tanya, Part I; Likkutei Amarim.36', titleHe: 'ליקוטי אמרים – פרק לו' },
  [md(12,6)]:  { ref: 'Tanya, Part I; Likkutei Amarim.37', titleHe: 'ליקוטי אמרים – פרק לז' },
  [md(12,7)]:  { ref: 'Tanya, Part I; Likkutei Amarim.38', titleHe: 'ליקוטי אמרים – פרק לח' },
  [md(12,8)]:  { ref: 'Tanya, Part I; Likkutei Amarim.39', titleHe: 'ליקוטי אמרים – פרק לט' },
  [md(12,9)]:  { ref: 'Tanya, Part I; Likkutei Amarim.40', titleHe: 'ליקוטי אמרים – פרק מ' },
  [md(12,10)]: { ref: 'Tanya, Part I; Likkutei Amarim.41', titleHe: 'ליקוטי אמרים – פרק מא' },
  [md(12,11)]: { ref: 'Tanya, Part I; Likkutei Amarim.42', titleHe: 'ליקוטי אמרים – פרק מב' },
  [md(12,12)]: { ref: 'Tanya, Part I; Likkutei Amarim.43', titleHe: 'ליקוטי אמרים – פרק מג' },
  [md(12,13)]: { ref: 'Tanya, Part I; Likkutei Amarim.44', titleHe: 'ליקוטי אמרים – פרק מד' },
  [md(12,14)]: { ref: 'Tanya, Part I; Likkutei Amarim.45', titleHe: 'ליקוטי אמרים – פרק מה' },
  [md(12,15)]: { ref: 'Tanya, Part I; Likkutei Amarim.46', titleHe: 'ליקוטי אמרים – פרק מו' },
  [md(12,16)]: { ref: 'Tanya, Part I; Likkutei Amarim.47', titleHe: 'ליקוטי אמרים – פרק מז' },
  [md(12,17)]: { ref: 'Tanya, Part I; Likkutei Amarim.48', titleHe: 'ליקוטי אמרים – פרק מח' },
  [md(12,18)]: { ref: 'Tanya, Part I; Likkutei Amarim.49', titleHe: 'ליקוטי אמרים – פרק מט' },
  [md(12,19)]: { ref: 'Tanya, Part I; Likkutei Amarim.50', titleHe: 'ליקוטי אמרים – פרק נ' },
  [md(12,20)]: { ref: 'Tanya, Part I; Likkutei Amarim.51', titleHe: 'ליקוטי אמרים – פרק נא' },
  [md(12,21)]: { ref: 'Tanya, Part I; Likkutei Amarim.52', titleHe: 'ליקוטי אמרים – פרק נב' },
  [md(12,22)]: { ref: 'Tanya, Part I; Likkutei Amarim.53', titleHe: 'ליקוטי אמרים – פרק נג' },
  [md(12,23)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.1',  titleHe: 'שער היחוד והאמונה – פרק א' },
  [md(12,24)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.2',  titleHe: 'שער היחוד והאמונה – פרק ב' },
  [md(12,25)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.3',  titleHe: 'שער היחוד והאמונה – פרק ג' },
  [md(12,26)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.4',  titleHe: 'שער היחוד והאמונה – פרק ד' },
  [md(12,27)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.5',  titleHe: 'שער היחוד והאמונה – פרק ה' },
  [md(12,28)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.6',  titleHe: 'שער היחוד והאמונה – פרק ו' },
  [md(12,29)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.7',  titleHe: 'שער היחוד והאמונה – פרק ז' },
  // ───── NISAN (1) ─────
  [md(1,1)]:  { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.8',  titleHe: 'שער היחוד והאמונה – פרק ח' },
  [md(1,2)]:  { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.9',  titleHe: 'שער היחוד והאמונה – פרק ט' },
  [md(1,3)]:  { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.10', titleHe: 'שער היחוד והאמונה – פרק י' },
  [md(1,4)]:  { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.11', titleHe: 'שער היחוד והאמונה – פרק יא' },
  [md(1,5)]:  { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.12', titleHe: 'שער היחוד והאמונה – פרק יב' },
  [md(1,6)]:  { ref: 'Tanya, Part III; Iggeret HaTeshuvah.1',         titleHe: 'איגרת התשובה – פרק א' },
  [md(1,7)]:  { ref: 'Tanya, Part III; Iggeret HaTeshuvah.2',         titleHe: 'איגרת התשובה – פרק ב' },
  [md(1,8)]:  { ref: 'Tanya, Part III; Iggeret HaTeshuvah.3',         titleHe: 'איגרת התשובה – פרק ג' },
  [md(1,9)]:  { ref: 'Tanya, Part III; Iggeret HaTeshuvah.4',         titleHe: 'איגרת התשובה – פרק ד' },
  [md(1,10)]: { ref: 'Tanya, Part III; Iggeret HaTeshuvah.5',         titleHe: 'איגרת התשובה – פרק ה' },
  [md(1,11)]: { ref: 'Tanya, Part III; Iggeret HaTeshuvah.6',         titleHe: 'איגרת התשובה – פרק ו' },
  [md(1,12)]: { ref: 'Tanya, Part III; Iggeret HaTeshuvah.7',         titleHe: 'איגרת התשובה – פרק ז' },
  [md(1,13)]: { ref: 'Tanya, Part III; Iggeret HaTeshuvah.8',         titleHe: 'איגרת התשובה – פרק ח' },
  [md(1,14)]: { ref: 'Tanya, Part III; Iggeret HaTeshuvah.9',         titleHe: 'איגרת התשובה – פרק ט' },
  [md(1,15)]: { ref: 'Tanya, Part III; Iggeret HaTeshuvah.10',        titleHe: 'איגרת התשובה – פרק י' },
  [md(1,16)]: { ref: 'Tanya, Part III; Iggeret HaTeshuvah.11',        titleHe: 'איגרת התשובה – פרק יא' },
  [md(1,17)]: { ref: 'Tanya, Part III; Iggeret HaTeshuvah.12',        titleHe: 'איגרת התשובה – פרק יב' },
  [md(1,18)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.1',            titleHe: 'איגרת הקודש – איגרת א' },
  [md(1,19)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.2',            titleHe: 'איגרת הקודש – איגרת ב' },
  [md(1,20)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.3',            titleHe: 'איגרת הקודש – איגרת ג' },
  [md(1,21)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.4',            titleHe: 'איגרת הקודש – איגרת ד' },
  [md(1,22)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.5',            titleHe: 'איגרת הקודש – איגרת ה' },
  [md(1,23)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.6',            titleHe: 'איגרת הקודש – איגרת ו' },
  [md(1,24)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.7',            titleHe: 'איגרת הקודש – איגרת ז' },
  [md(1,25)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.8',            titleHe: 'איגרת הקודש – איגרת ח' },
  [md(1,26)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.9',            titleHe: 'איגרת הקודש – איגרת ט' },
  [md(1,27)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.10',           titleHe: 'איגרת הקודש – איגרת י' },
  [md(1,28)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.11',           titleHe: 'איגרת הקודש – איגרת יא' },
  [md(1,29)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.12',           titleHe: 'איגרת הקודש – איגרת יב' },
  [md(1,30)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.13',           titleHe: 'איגרת הקודש – איגרת יג' },
  // ───── IYAR (2) ─────
  // Verified by user: 11 Iyar 5786 = Likkutei Amarim ch.46
  // Working backwards: 1 Iyar = ch.36, ...10 Iyar = ch.45, 11 Iyar = ch.46
  [md(2,1)]:  { ref: 'Tanya, Part I; Likkutei Amarim.36', titleHe: 'ליקוטי אמרים – פרק לו' },
  [md(2,2)]:  { ref: 'Tanya, Part I; Likkutei Amarim.37', titleHe: 'ליקוטי אמרים – פרק לז' },
  [md(2,3)]:  { ref: 'Tanya, Part I; Likkutei Amarim.38', titleHe: 'ליקוטי אמרים – פרק לח' },
  [md(2,4)]:  { ref: 'Tanya, Part I; Likkutei Amarim.39', titleHe: 'ליקוטי אמרים – פרק לט' },
  [md(2,5)]:  { ref: 'Tanya, Part I; Likkutei Amarim.40', titleHe: 'ליקוטי אמרים – פרק מ' },
  [md(2,6)]:  { ref: 'Tanya, Part I; Likkutei Amarim.41', titleHe: 'ליקוטי אמרים – פרק מא' },
  [md(2,7)]:  { ref: 'Tanya, Part I; Likkutei Amarim.42', titleHe: 'ליקוטי אמרים – פרק מב' },
  [md(2,8)]:  { ref: 'Tanya, Part I; Likkutei Amarim.43', titleHe: 'ליקוטי אמרים – פרק מג' },
  [md(2,9)]:  { ref: 'Tanya, Part I; Likkutei Amarim.44', titleHe: 'ליקוטי אמרים – פרק מד' },
  [md(2,10)]: { ref: 'Tanya, Part I; Likkutei Amarim.45', titleHe: 'ליקוטי אמרים – פרק מה' },
  [md(2,11)]: { ref: 'Tanya, Part I; Likkutei Amarim.46', titleHe: 'ליקוטי אמרים – פרק מו' },
  [md(2,12)]: { ref: 'Tanya, Part I; Likkutei Amarim.47', titleHe: 'ליקוטי אמרים – פרק מז' },
  [md(2,13)]: { ref: 'Tanya, Part I; Likkutei Amarim.48', titleHe: 'ליקוטי אמרים – פרק מח' },
  [md(2,14)]: { ref: 'Tanya, Part I; Likkutei Amarim.49', titleHe: 'ליקוטי אמרים – פרק מט' },
  [md(2,15)]: { ref: 'Tanya, Part I; Likkutei Amarim.50', titleHe: 'ליקוטי אמרים – פרק נ' },
  [md(2,16)]: { ref: 'Tanya, Part I; Likkutei Amarim.51', titleHe: 'ליקוטי אמרים – פרק נא' },
  [md(2,17)]: { ref: 'Tanya, Part I; Likkutei Amarim.52', titleHe: 'ליקוטי אמרים – פרק נב' },
  [md(2,18)]: { ref: 'Tanya, Part I; Likkutei Amarim.53', titleHe: 'ליקוטי אמרים – פרק נג' },
  [md(2,19)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.1',  titleHe: 'שער היחוד והאמונה – פרק א' },
  [md(2,20)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.2',  titleHe: 'שער היחוד והאמונה – פרק ב' },
  [md(2,21)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.3',  titleHe: 'שער היחוד והאמונה – פרק ג' },
  [md(2,22)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.4',  titleHe: 'שער היחוד והאמונה – פרק ד' },
  [md(2,23)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.5',  titleHe: 'שער היחוד והאמונה – פרק ה' },
  [md(2,24)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.6',  titleHe: 'שער היחוד והאמונה – פרק ו' },
  [md(2,25)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.7',  titleHe: 'שער היחוד והאמונה – פרק ז' },
  [md(2,26)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.8',  titleHe: 'שער היחוד והאמונה – פרק ח' },
  [md(2,27)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.9',  titleHe: 'שער היחוד והאמונה – פרק ט' },
  [md(2,28)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.10', titleHe: 'שער היחוד והאמונה – פרק י' },
  [md(2,29)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.11', titleHe: 'שער היחוד והאמונה – פרק יא' },
  // ───── SIVAN (3) ─────
  [md(3,1)]:  { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.12', titleHe: 'שער היחוד והאמונה – פרק יב' },
  [md(3,2)]:  { ref: 'Tanya, Part III; Iggeret HaTeshuvah.1',  titleHe: 'איגרת התשובה – פרק א' },
  [md(3,3)]:  { ref: 'Tanya, Part III; Iggeret HaTeshuvah.2',  titleHe: 'איגרת התשובה – פרק ב' },
  [md(3,4)]:  { ref: 'Tanya, Part III; Iggeret HaTeshuvah.3',  titleHe: 'איגרת התשובה – פרק ג' },
  [md(3,5)]:  { ref: 'Tanya, Part III; Iggeret HaTeshuvah.4',  titleHe: 'איגרת התשובה – פרק ד' },
  [md(3,6)]:  { ref: 'Tanya, Part III; Iggeret HaTeshuvah.5',  titleHe: 'איגרת התשובה – פרק ה' },
  [md(3,7)]:  { ref: 'Tanya, Part III; Iggeret HaTeshuvah.6',  titleHe: 'איגרת התשובה – פרק ו' },
  [md(3,8)]:  { ref: 'Tanya, Part III; Iggeret HaTeshuvah.7',  titleHe: 'איגרת התשובה – פרק ז' },
  [md(3,9)]:  { ref: 'Tanya, Part III; Iggeret HaTeshuvah.8',  titleHe: 'איגרת התשובה – פרק ח' },
  [md(3,10)]: { ref: 'Tanya, Part III; Iggeret HaTeshuvah.9',  titleHe: 'איגרת התשובה – פרק ט' },
  [md(3,11)]: { ref: 'Tanya, Part III; Iggeret HaTeshuvah.10', titleHe: 'איגרת התשובה – פרק י' },
  [md(3,12)]: { ref: 'Tanya, Part III; Iggeret HaTeshuvah.11', titleHe: 'איגרת התשובה – פרק יא' },
  [md(3,13)]: { ref: 'Tanya, Part III; Iggeret HaTeshuvah.12', titleHe: 'איגרת התשובה – פרק יב' },
  [md(3,14)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.1',    titleHe: 'איגרת הקודש – איגרת א' },
  [md(3,15)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.2',    titleHe: 'איגרת הקודש – איגרת ב' },
  [md(3,16)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.3',    titleHe: 'איגרת הקודש – איגרת ג' },
  [md(3,17)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.4',    titleHe: 'איגרת הקודש – איגרת ד' },
  [md(3,18)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.5',    titleHe: 'איגרת הקודש – איגרת ה' },
  [md(3,19)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.6',    titleHe: 'איגרת הקודש – איגרת ו' },
  [md(3,20)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.7',    titleHe: 'איגרת הקודש – איגרת ז' },
  [md(3,21)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.8',    titleHe: 'איגרת הקודש – איגרת ח' },
  [md(3,22)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.9',    titleHe: 'איגרת הקודש – איגרת ט' },
  [md(3,23)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.10',   titleHe: 'איגרת הקודש – איגרת י' },
  [md(3,24)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.11',   titleHe: 'איגרת הקודש – איגרת יא' },
  [md(3,25)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.12',   titleHe: 'איגרת הקודש – איגרת יב' },
  [md(3,26)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.13',   titleHe: 'איגרת הקודש – איגרת יג' },
  [md(3,27)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.14',   titleHe: 'איגרת הקודש – איגרת יד' },
  [md(3,28)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.15',   titleHe: 'איגרת הקודש – איגרת טו' },
  [md(3,29)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.16',   titleHe: 'איגרת הקודש – איגרת טז' },
  [md(3,30)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.17',   titleHe: 'איגרת הקודש – איגרת יז' },
  // ───── TAMUZ (4) ─────
  [md(4,1)]:  { ref: 'Tanya, Part IV; Iggeret HaKodesh.18', titleHe: 'איגרת הקודש – איגרת יח' },
  [md(4,2)]:  { ref: 'Tanya, Part IV; Iggeret HaKodesh.19', titleHe: 'איגרת הקודש – איגרת יט' },
  [md(4,3)]:  { ref: 'Tanya, Part IV; Iggeret HaKodesh.20', titleHe: 'איגרת הקודש – איגרת כ' },
  [md(4,4)]:  { ref: 'Tanya, Part IV; Iggeret HaKodesh.21', titleHe: 'איגרת הקודש – איגרת כא' },
  [md(4,5)]:  { ref: 'Tanya, Part IV; Iggeret HaKodesh.22', titleHe: 'איגרת הקודש – איגרת כב' },
  [md(4,6)]:  { ref: 'Tanya, Part IV; Iggeret HaKodesh.23', titleHe: 'איגרת הקודש – איגרת כג' },
  [md(4,7)]:  { ref: 'Tanya, Part IV; Iggeret HaKodesh.24', titleHe: 'איגרת הקודש – איגרת כד' },
  [md(4,8)]:  { ref: 'Tanya, Part IV; Iggeret HaKodesh.25', titleHe: 'איגרת הקודש – איגרת כה' },
  [md(4,9)]:  { ref: 'Tanya, Part IV; Iggeret HaKodesh.26', titleHe: 'איגרת הקודש – איגרת כו' },
  [md(4,10)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.27', titleHe: 'איגרת הקודש – איגרת כז' },
  [md(4,11)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.28', titleHe: 'איגרת הקודש – איגרת כח' },
  [md(4,12)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.29', titleHe: 'איגרת הקודש – איגרת כט' },
  [md(4,13)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.30', titleHe: 'איגרת הקודש – איגרת ל' },
  [md(4,14)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.31', titleHe: 'איגרת הקודש – איגרת לא' },
  [md(4,15)]: { ref: 'Tanya, Part IV; Iggeret HaKodesh.32', titleHe: 'איגרת הקודש – איגרת לב' },
  [md(4,16)]: { ref: 'Tanya, Part V; Kuntres Acharon.1',    titleHe: 'קונטרס אחרון – מאמר א' },
  [md(4,17)]: { ref: 'Tanya, Part V; Kuntres Acharon.2',    titleHe: 'קונטרס אחרון – מאמר ב' },
  [md(4,18)]: { ref: 'Tanya, Part V; Kuntres Acharon.3',    titleHe: 'קונטרס אחרון – מאמר ג' },
  [md(4,19)]: { ref: 'Tanya, Part V; Kuntres Acharon.4',    titleHe: 'קונטרס אחרון – מאמר ד' },
  [md(4,20)]: { ref: 'Tanya, Part V; Kuntres Acharon.5',    titleHe: 'קונטרס אחרון – מאמר ה' },
  [md(4,21)]: { ref: 'Tanya, Part V; Kuntres Acharon.6',    titleHe: 'קונטרס אחרון – מאמר ו' },
  [md(4,22)]: { ref: 'Tanya, Part V; Kuntres Acharon.7',    titleHe: 'קונטרס אחרון – מאמר ז' },
  [md(4,23)]: { ref: 'Tanya, Part V; Kuntres Acharon.8',    titleHe: 'קונטרס אחרון – מאמר ח' },
  [md(4,24)]: { ref: 'Tanya, Part V; Kuntres Acharon.9',    titleHe: 'קונטרס אחרון – מאמר ט' },
  [md(4,25)]: { ref: 'Tanya, Part I; Likkutei Amarim.1',    titleHe: 'ליקוטי אמרים – פרק א (חזרה)' },
  [md(4,26)]: { ref: 'Tanya, Part I; Likkutei Amarim.2',    titleHe: 'ליקוטי אמרים – פרק ב' },
  [md(4,27)]: { ref: 'Tanya, Part I; Likkutei Amarim.3',    titleHe: 'ליקוטי אמרים – פרק ג' },
  [md(4,28)]: { ref: 'Tanya, Part I; Likkutei Amarim.4',    titleHe: 'ליקוטי אמרים – פרק ד' },
  [md(4,29)]: { ref: 'Tanya, Part I; Likkutei Amarim.5',    titleHe: 'ליקוטי אמרים – פרק ה' },
  // ───── AV (5) ─────
  [md(5,1)]:  { ref: 'Tanya, Part I; Likkutei Amarim.6',  titleHe: 'ליקוטי אמרים – פרק ו' },
  [md(5,2)]:  { ref: 'Tanya, Part I; Likkutei Amarim.7',  titleHe: 'ליקוטי אמרים – פרק ז' },
  [md(5,3)]:  { ref: 'Tanya, Part I; Likkutei Amarim.8',  titleHe: 'ליקוטי אמרים – פרק ח' },
  [md(5,4)]:  { ref: 'Tanya, Part I; Likkutei Amarim.9',  titleHe: 'ליקוטי אמרים – פרק ט' },
  [md(5,5)]:  { ref: 'Tanya, Part I; Likkutei Amarim.10', titleHe: 'ליקוטי אמרים – פרק י' },
  [md(5,6)]:  { ref: 'Tanya, Part I; Likkutei Amarim.11', titleHe: 'ליקוטי אמרים – פרק יא' },
  [md(5,7)]:  { ref: 'Tanya, Part I; Likkutei Amarim.12', titleHe: 'ליקוטי אמרים – פרק יב' },
  [md(5,8)]:  { ref: 'Tanya, Part I; Likkutei Amarim.13', titleHe: 'ליקוטי אמרים – פרק יג' },
  [md(5,9)]:  { ref: 'Tanya, Part I; Likkutei Amarim.14', titleHe: 'ליקוטי אמרים – פרק יד' },
  [md(5,10)]: { ref: 'Tanya, Part I; Likkutei Amarim.15', titleHe: 'ליקוטי אמרים – פרק טו' },
  [md(5,11)]: { ref: 'Tanya, Part I; Likkutei Amarim.16', titleHe: 'ליקוטי אמרים – פרק טז' },
  [md(5,12)]: { ref: 'Tanya, Part I; Likkutei Amarim.17', titleHe: 'ליקוטי אמרים – פרק יז' },
  [md(5,13)]: { ref: 'Tanya, Part I; Likkutei Amarim.18', titleHe: 'ליקוטי אמרים – פרק יח' },
  [md(5,14)]: { ref: 'Tanya, Part I; Likkutei Amarim.19', titleHe: 'ליקוטי אמרים – פרק יט' },
  [md(5,15)]: { ref: 'Tanya, Part I; Likkutei Amarim.20', titleHe: 'ליקוטי אמרים – פרק כ' },
  [md(5,16)]: { ref: 'Tanya, Part I; Likkutei Amarim.21', titleHe: 'ליקוטי אמרים – פרק כא' },
  [md(5,17)]: { ref: 'Tanya, Part I; Likkutei Amarim.22', titleHe: 'ליקוטי אמרים – פרק כב' },
  [md(5,18)]: { ref: 'Tanya, Part I; Likkutei Amarim.23', titleHe: 'ליקוטי אמרים – פרק כג' },
  [md(5,19)]: { ref: 'Tanya, Part I; Likkutei Amarim.24', titleHe: 'ליקוטי אמרים – פרק כד' },
  [md(5,20)]: { ref: 'Tanya, Part I; Likkutei Amarim.25', titleHe: 'ליקוטי אמרים – פרק כה' },
  [md(5,21)]: { ref: 'Tanya, Part I; Likkutei Amarim.26', titleHe: 'ליקוטי אמרים – פרק כו' },
  [md(5,22)]: { ref: 'Tanya, Part I; Likkutei Amarim.27', titleHe: 'ליקוטי אמרים – פרק כז' },
  [md(5,23)]: { ref: 'Tanya, Part I; Likkutei Amarim.28', titleHe: 'ליקוטי אמרים – פרק כח' },
  [md(5,24)]: { ref: 'Tanya, Part I; Likkutei Amarim.29', titleHe: 'ליקוטי אמרים – פרק כט' },
  [md(5,25)]: { ref: 'Tanya, Part I; Likkutei Amarim.30', titleHe: 'ליקוטי אמרים – פרק ל' },
  [md(5,26)]: { ref: 'Tanya, Part I; Likkutei Amarim.31', titleHe: 'ליקוטי אמרים – פרק לא' },
  [md(5,27)]: { ref: 'Tanya, Part I; Likkutei Amarim.32', titleHe: 'ליקוטי אמרים – פרק לב' },
  [md(5,28)]: { ref: 'Tanya, Part I; Likkutei Amarim.33', titleHe: 'ליקוטי אמרים – פרק לג' },
  [md(5,29)]: { ref: 'Tanya, Part I; Likkutei Amarim.34', titleHe: 'ליקוטי אמרים – פרק לד' },
  // ───── ELUL (6) ─────
  [md(6,1)]:  { ref: 'Tanya, Part I; Likkutei Amarim.35', titleHe: 'ליקוטי אמרים – פרק לה' },
  [md(6,2)]:  { ref: 'Tanya, Part I; Likkutei Amarim.36', titleHe: 'ליקוטי אמרים – פרק לו' },
  [md(6,3)]:  { ref: 'Tanya, Part I; Likkutei Amarim.37', titleHe: 'ליקוטי אמרים – פרק לז' },
  [md(6,4)]:  { ref: 'Tanya, Part I; Likkutei Amarim.38', titleHe: 'ליקוטי אמרים – פרק לח' },
  [md(6,5)]:  { ref: 'Tanya, Part I; Likkutei Amarim.39', titleHe: 'ליקוטי אמרים – פרק לט' },
  [md(6,6)]:  { ref: 'Tanya, Part I; Likkutei Amarim.40', titleHe: 'ליקוטי אמרים – פרק מ' },
  [md(6,7)]:  { ref: 'Tanya, Part I; Likkutei Amarim.41', titleHe: 'ליקוטי אמרים – פרק מא' },
  [md(6,8)]:  { ref: 'Tanya, Part I; Likkutei Amarim.42', titleHe: 'ליקוטי אמרים – פרק מב' },
  [md(6,9)]:  { ref: 'Tanya, Part I; Likkutei Amarim.43', titleHe: 'ליקוטי אמרים – פרק מג' },
  [md(6,10)]: { ref: 'Tanya, Part I; Likkutei Amarim.44', titleHe: 'ליקוטי אמרים – פרק מד' },
  [md(6,11)]: { ref: 'Tanya, Part I; Likkutei Amarim.45', titleHe: 'ליקוטי אמרים – פרק מה' },
  [md(6,12)]: { ref: 'Tanya, Part I; Likkutei Amarim.46', titleHe: 'ליקוטי אמרים – פרק מו' },
  [md(6,13)]: { ref: 'Tanya, Part I; Likkutei Amarim.47', titleHe: 'ליקוטי אמרים – פרק מז' },
  [md(6,14)]: { ref: 'Tanya, Part I; Likkutei Amarim.48', titleHe: 'ליקוטי אמרים – פרק מח' },
  [md(6,15)]: { ref: 'Tanya, Part I; Likkutei Amarim.49', titleHe: 'ליקוטי אמרים – פרק מט' },
  [md(6,16)]: { ref: 'Tanya, Part I; Likkutei Amarim.50', titleHe: 'ליקוטי אמרים – פרק נ' },
  [md(6,17)]: { ref: 'Tanya, Part I; Likkutei Amarim.51', titleHe: 'ליקוטי אמרים – פרק נא' },
  [md(6,18)]: { ref: 'Tanya, Part I; Likkutei Amarim.52', titleHe: 'ליקוטי אמרים – פרק נב' },
  [md(6,19)]: { ref: 'Tanya, Part I; Likkutei Amarim.53', titleHe: 'ליקוטי אמרים – פרק נג' },
  [md(6,20)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.1',  titleHe: 'שער היחוד והאמונה – פרק א' },
  [md(6,21)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.2',  titleHe: 'שער היחוד והאמונה – פרק ב' },
  [md(6,22)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.3',  titleHe: 'שער היחוד והאמונה – פרק ג' },
  [md(6,23)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.4',  titleHe: 'שער היחוד והאמונה – פרק ד' },
  [md(6,24)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.5',  titleHe: 'שער היחוד והאמונה – פרק ה' },
  [md(6,25)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.6',  titleHe: 'שער היחוד והאמונה – פרק ו' },
  [md(6,26)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.7',  titleHe: 'שער היחוד והאמונה – פרק ז' },
  [md(6,27)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.8',  titleHe: 'שער היחוד והאמונה – פרק ח' },
  [md(6,28)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.9',  titleHe: 'שער היחוד והאמונה – פרק ט' },
  [md(6,29)]: { ref: 'Tanya, Part II; Shaar HaYichud VehaEmunah.10', titleHe: 'שער היחוד והאמונה – פרק י' },
};

export function getTanyaPortionForDay(date: Date = new Date()): { ref: string; titleHe: string } {
  const hdate = new HDate(date);
  const month = hdate.getMonth();
  const day = hdate.getDate();
  const key = md(month, day);
  return TANYA_BY_DATE[key] ?? { ref: 'Tanya, Part I; Likkutei Amarim.1', titleHe: 'ליקוטי אמרים – פרק א' };
}

export async function fetchTanyaForDay(date: Date = new Date()): Promise<BookContent> {
  // ── Primary path: fully OFFLINE, leap-year-aware local schedule + text.
  //    Correct for both regular and leap Hebrew years (תקנת אדמו"ר הריי"צ),
  //    which fixes the "Tanya not updated" bug and needs no network.
  const local = getLocalTanya(date);
  if (local && local.sections.length > 0) return local;

  // ── Fallback: Sefaria's daily calendar (only if the local lookup ever misses).
  try {
    const { tanya } = await fetchSefariaDailyRefs(date);
    if (tanya) {
      const content = await fetchFromSefaria(tanya);
      if (content.sections.length > 0) return content;
    }
  } catch (calErr) {
    console.warn('[fetchTanyaForDay] Sefaria calendar path failed:', calErr);
  }

  // ── Secondary path: the static 365-day Mora Shiur schedule (tanyaScheduleService)
  // getTanyaRefByDate / fetchTanyaEntry are top-level static imports – no dynamic import needed.
  try {
    const scheduleEntry = getTanyaRefByDate(date);
    const result = await fetchTanyaEntry(scheduleEntry);
    if (result) {
      // Build a rich title: Hebrew date label + portion reference
      const titleHe = `${scheduleEntry.date}  ·  ${result.titleHe}`;
      const portionNote = `${scheduleEntry.start} … ${scheduleEntry.end}`;

      // Use fetched Hebrew text when available; otherwise show the portion note
      const sections =
        result.textHe.length > 0
          ? result.textHe.map((t, i) => ({ verse: i + 1, text: t }))
          : [{ verse: 1, text: portionNote }];

      return { title: 'Tanya', titleHe, sections, ref: scheduleEntry.ref };
    }
  } catch (primaryErr) {
    // log but do not swallow – fall through to legacy
    console.warn('[fetchTanyaForDay] primary path failed:', primaryErr);
  }

  // ── Legacy fallback: TANYA_BY_DATE Hebrew-calendar lookup
  // NOTE: this table may be off by one cycle; use only as last resort.
  const portion = getTanyaPortionForDay(date);
  const refsToTry = [
    portion.ref,
    portion.ref.replace('Tanya, Part I; ', 'Tanya, '),
    portion.ref.replace('Tanya, Part II; ', 'Tanya, '),
    portion.ref.replace('Tanya, Part III; ', 'Tanya, '),
    portion.ref.replace('Tanya, Part IV; ', 'Tanya, '),
    portion.ref.replace('Tanya, Part V; ', 'Tanya, '),
  ];
  for (const ref of refsToTry) {
    try {
      const content = await fetchFromSefaria(ref, portion.titleHe);
      if (content.sections.length > 0) return content;
    } catch {}
  }
  return {
    title: 'Tanya',
    titleHe: portion.titleHe,
    sections: [{ verse: 1, text: 'לא ניתן לטעון את הטקסט. בדוק את חיבור האינטרנט.' }],
    ref: portion.ref,
  };
}

// ─── Chumash ─────────────────────────────────────────────
// Fetches the weekly parasha from Hebcal for the SHABBAT of the current week,
// then selects the aliyah by day of week.
const ALIYAH_NAMES_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שביעי'];

const BOOK_NAMES_HE: Record<string, string> = {
  'Genesis': 'בראשית', 'Exodus': 'שמות', 'Leviticus': 'ויקרא',
  'Numbers': 'במדבר', 'Deuteronomy': 'דברים',
};

// Find the upcoming (or current) Shabbat date from any given date
function getShabbatDate(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun...6=Sat
  const daysUntilShabbat = day === 6 ? 0 : 6 - day;
  d.setDate(d.getDate() + daysUntilShabbat);
  return d;
}

async function fetchHebcalForShabbat(date: Date): Promise<HebcalItem[]> {
  const shabbat = getShabbatDate(date);
  const dateStr = shabbat.toISOString().split('T')[0];
  const cacheKey = HEBCAL_CACHE_PREFIX + 'shabbat_' + dateStr;

  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.ts < HEBCAL_CACHE_TTL) return parsed.data;
    }
  } catch {}

  try {
    const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&s=on&leyning=on&i=on&start=${dateStr}&end=${dateStr}`;
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!resp.ok) return [];
    const data = await resp.json();
    const items: HebcalItem[] = data.items ?? [];
    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify({ data: items, ts: Date.now() }));
    } catch {}
    return items;
  } catch {
    return [];
  }
}

export async function fetchChumashForDay(date: Date = new Date()): Promise<BookContent> {
  try {
    const dayOfWeek = date.getDay(); // 0=Sun
    // Shabbat aliyah 7; Sun aliyah 1; Mon aliyah 2 ... Fri aliyah 6
    const aliyahNum = dayOfWeek === 6 ? 7 : dayOfWeek + 1;
    const aliyahNameHe = ALIYAH_NAMES_HE[aliyahNum - 1] ?? 'ראשון';

    // Fetch parasha from Shabbat of this week
    const items = await fetchHebcalForShabbat(date);
    const parashaItem = items.find(i => i.category === 'parashat');

    if (parashaItem && parashaItem.leyning) {
      const leyning = parashaItem.leyning;
      const aliyahKey = String(aliyahNum);
      const verseRange = leyning[aliyahKey] ?? leyning['1'];
      const parshaHe = parashaItem.hebrew ?? parashaItem.title.replace(/^Parashat\s+/, '');

      if (verseRange) {
        try {
          // Fetch Torah text
          const torah = await fetchFromSefaria(verseRange, `פרשת ${parshaHe} – עליה ${aliyahNameHe}`);
          if (torah.sections.length > 0) {
            // Fetch Rashi commentary for same range
            try {
              const rashiRef = `Rashi on ${verseRange}`;
              const rashi = await fetchFromSefaria(rashiRef, `רש״י על ${parshaHe}`);
              if (rashi.sections.length > 0) {
                // Merge: return torah + rashi as combined sections with separator
                const combined: BookContent = {
                  title: torah.title,
                  titleHe: torah.titleHe,
                  sections: torah.sections,
                  ref: torah.ref,
                };
                // Return Torah only here; Rashi loaded as separate item
                return combined;
              }
            } catch {}
            return torah;
          }
        } catch {}
      }
    }

    // Last fallback: Sedra
    const hdate = new HDate(date);
    const sedra = new Sedra(hdate.getFullYear(), false);
    const result = sedra.lookup(hdate);
    const parshaName = result?.parsha?.[0] ?? 'Bereshit';
    const bookHe = BOOK_NAMES_HE[parshaName] ?? parshaName;
    const content = await fetchFromSefaria(`${parshaName} 1`, `פרשת ${bookHe} – עליה ${aliyahNameHe}`);
    return content;
  } catch {
    return {
      title: 'Chumash',
      titleHe: 'חומש – פרשת השבוע',
      sections: [{ verse: 1, text: 'לא ניתן לטעון את הטקסט. בדוק את חיבור האינטרנט.' }],
      ref: 'Genesis 1',
    };
  }
}

// Fetch Chumash + Rashi together as two BookContent items
export async function fetchChumashWithRashiForDay(date: Date = new Date()): Promise<BookContent[]> {
  try {
    const dayOfWeek = date.getDay();
    const aliyahNum = dayOfWeek === 6 ? 7 : dayOfWeek + 1;
    const aliyahNameHe = ALIYAH_NAMES_HE[aliyahNum - 1] ?? 'ראשון';

    const items = await fetchHebcalForShabbat(date);
    const parashaItem = items.find(i => i.category === 'parashat');

    if (parashaItem && parashaItem.leyning) {
      const leyning = parashaItem.leyning;
      const aliyahKey = String(aliyahNum);
      const verseRange = leyning[aliyahKey] ?? leyning['1'];
      const parshaHe = parashaItem.hebrew ?? parashaItem.title.replace(/^Parashat\s+/, '');

      if (verseRange) {
        const results: BookContent[] = [];

        // 1. Torah text
        try {
          const torah = await fetchFromSefaria(verseRange, `פרשת ${parshaHe} – עליה ${aliyahNameHe}`);
          if (torah.sections.length > 0) results.push(torah);
        } catch {}

        // 2. Rashi
        try {
          const rashiRef = `Rashi on ${verseRange}`;
          const rashi = await fetchFromSefaria(rashiRef, `רש״י`);
          if (rashi.sections.length > 0) results.push(rashi);
        } catch {}

        if (results.length > 0) return results;
      }
    }
  } catch {}

  // Fallback to single item
  const single = await fetchChumashForDay(date);
  return [single];
}

// ─── Rambam (3 chapters/day) from Hebcal ─────────────────
// Uses Hebcal's dr3=on to get the correct daily portion for current Hebrew year
export async function fetchRambamForDay(date: Date = new Date()): Promise<BookContent[]> {
  // ── Primary path: fully OFFLINE. The Daily Rambam (3 chapters) runs a continuous
  //    339-day cycle (restarts Mishneh Torah), keyed by day-in-cycle. Renders with
  //    book (ספר) / section (הלכות) / chapter headers + numbered halachot.
  const local = getLocalRambam(date);
  if (local.length > 0 && local.some((c) => c.sections.length > 0)) return local;

  // ── Authoritative path: Sefaria's daily calendar returns the exact Rambam refs.
  //    (Hebcal stopped returning the `link` field, which the legacy path below relied
  //    on — that's why Rambam showed no text.)
  try {
    const { rambam3 } = await fetchSefariaDailyRefs(date);
    if (rambam3.length > 0) {
      const results: BookContent[] = [];
      for (const ref of rambam3) {
        try {
          const c = await fetchFromSefaria(ref);
          if (c.sections.length > 0) results.push(c);
        } catch {}
      }
      if (results.length > 0) return results;
    }
  } catch (calErr) {
    console.warn('[fetchRambamForDay] Sefaria calendar path failed:', calErr);
  }

  // ── Legacy fallback: Hebcal daily + link parsing (kept in case Sefaria is down)
  try {
    const items = await fetchHebcalDaily(date);
    const rambamItem = items.find(i => i.category === 'dailyRambam3');

    if (rambamItem) {
      // title: "Virgin Maiden 1-3"
      // hebrew: "הלכות נערה בתולה פרק 1-3"
      // link: "https://www.sefaria.org/Mishneh_Torah%2C_Virgin_Maiden.1-3?..."
      const link = rambamItem.link ?? '';
      const hebrewTitle = rambamItem.hebrew ?? rambamItem.title;

      // Extract Sefaria ref from the link
      let sefariaRef = '';
      const match = link.match(/sefaria\.org\/([^?]+)/);
      if (match) {
        sefariaRef = decodeURIComponent(match[1]).replace(/_/g, ' ');
      }

      if (sefariaRef) {
        // The ref like "Mishneh Torah, Virgin Maiden.1-3" might cover 3 chapters
        // Try to fetch each chapter individually
        const rangeMatch = sefariaRef.match(/\.(\d+)-(\d+)$/);
        if (rangeMatch) {
          const baseRef = sefariaRef.replace(/\.\d+-\d+$/, '');
          const start = parseInt(rangeMatch[1]);
          const end = parseInt(rangeMatch[2]);
          const results: BookContent[] = [];

          for (let ch = start; ch <= end; ch++) {
            try {
              const chRef = `${baseRef}.${ch}`;
              // Extract Hebrew name from hebrewTitle
              const heNameMatch = hebrewTitle.match(/^(.+?)(?:\s+פרק|$)/);
              const heName = heNameMatch ? heNameMatch[1] : hebrewTitle;
              const content = await fetchFromSefaria(chRef, `${heName} – פרק ${ch}`);
              results.push(content);
            } catch {
              // try full range ref as single call
            }
          }

          if (results.length > 0) return results;
        }

        // Fallback: fetch the range as one request
        try {
          const content = await fetchFromSefaria(sefariaRef, hebrewTitle);
          return [content];
        } catch {}
      }

      // Last fallback: show what Hebcal said without text
      return [{
        title: rambamItem.title,
        titleHe: hebrewTitle,
        sections: [{ verse: 1, text: 'לא ניתן לטעון את הטקסט. בדוק את חיבור האינטרנט.' }],
        ref: sefariaRef || rambamItem.title,
      }];
    }
  } catch {}

  // Fallback to epoch-based calculation
  return fetchRambamByEpoch(date);
}

// Epoch fallback for Rambam (if Hebcal API fails)
const RAMBAM_BOOKS_SIMPLE: { name: string; nameHe: string; sefariaTitle: string; chapters: number }[] = [
  { name: 'Human Dispositions', nameHe: 'הלכות דעות', sefariaTitle: 'Mishneh Torah, Human Dispositions', chapters: 7 },
  { name: 'Torah Study', nameHe: 'הלכות תלמוד תורה', sefariaTitle: 'Mishneh Torah, Torah Study', chapters: 7 },
  { name: 'Repentance', nameHe: 'הלכות תשובה', sefariaTitle: 'Mishneh Torah, Repentance', chapters: 10 },
  { name: 'Reading the Shema', nameHe: 'הלכות קריאת שמע', sefariaTitle: 'Mishneh Torah, Reading the Shema', chapters: 4 },
  { name: 'Prayer', nameHe: 'הלכות תפילה', sefariaTitle: 'Mishneh Torah, Prayer and Priestly Blessing', chapters: 15 },
  { name: 'Sabbath', nameHe: 'הלכות שבת', sefariaTitle: 'Mishneh Torah, Sabbath', chapters: 30 },
  { name: 'Marriage', nameHe: 'הלכות אישות', sefariaTitle: 'Mishneh Torah, Marriage', chapters: 25 },
  { name: 'Virgin Maiden', nameHe: 'הלכות נערה בתולה', sefariaTitle: 'Mishneh Torah, Virgin Maiden', chapters: 3 },
  { name: 'Forbidden Intercourse', nameHe: 'הלכות איסורי ביאה', sefariaTitle: 'Mishneh Torah, Forbidden Intercourse', chapters: 22 },
  { name: 'Forbidden Foods', nameHe: 'הלכות מאכלות אסורות', sefariaTitle: 'Mishneh Torah, Forbidden Foods', chapters: 17 },
];

interface RambamChapter {
  bookName: string;
  bookNameHe: string;
  sefariaTitle: string;
  chapter: number;
  ref: string;
}

const RAMBAM_FLAT: RambamChapter[] = [];
function buildRambamFlat() {
  if (RAMBAM_FLAT.length > 0) return;
  for (const book of RAMBAM_BOOKS_SIMPLE) {
    for (let ch = 1; ch <= book.chapters; ch++) {
      RAMBAM_FLAT.push({
        bookName: book.name,
        bookNameHe: book.nameHe,
        sefariaTitle: book.sefariaTitle,
        chapter: ch,
        ref: `${book.sefariaTitle}.${ch}`,
      });
    }
  }
}

// Rambam cycle started 11 Nisan 5744 = April 11, 1984
const RAMBAM3_EPOCH_UTC = Date.UTC(1984, 3, 11);

function fetchRambamByEpoch(date: Date): BookContent[] {
  buildRambamFlat();
  const total = RAMBAM_FLAT.length;
  const sets = Math.floor(total / 3);
  const daysSince = Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - RAMBAM3_EPOCH_UTC) / 86400000
  );
  const setIdx = ((daysSince % sets) + sets) % sets;
  const start = setIdx * 3;
  return [
    RAMBAM_FLAT[start % total],
    RAMBAM_FLAT[(start + 1) % total],
    RAMBAM_FLAT[(start + 2) % total],
  ]
    .filter(Boolean)
    .map(ch => ({
      title: ch.bookName,
      titleHe: `${ch.bookNameHe} – פרק ${ch.chapter}`,
      sections: [{ verse: 1, text: 'טוען...' }],
      ref: ch.ref,
    }));
}

export function getRambam3ChaptersForDay(date: Date = new Date()): { bookNameHe: string; chapter: number }[] {
  buildRambamFlat();
  const total = RAMBAM_FLAT.length;
  const sets = Math.floor(total / 3);
  const daysSince = Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - RAMBAM3_EPOCH_UTC) / 86400000
  );
  const setIdx = ((daysSince % sets) + sets) % sets;
  const start = setIdx * 3;
  return [0, 1, 2].map(i => RAMBAM_FLAT[(start + i) % total]).filter(Boolean);
}

// ─── Hayom Yom ────────────────────────────────────────────
// Uses embedded local data from constants/hayomyom
import { getHayomYomText } from '@/constants/hayomyom';

export async function fetchHayomYomForDay(date: Date = new Date()): Promise<BookContent> {
  const hdate = new HDate(date);
  const month = hdate.getMonth();
  const day = hdate.getDate();

  const { hebrewDayToGematria, hebrewMonthDisplay } = require('@/services/hebrewCalendarService');
  const dayHe = hebrewDayToGematria(day);
  const monthHe = hebrewMonthDisplay(month);

  const text = getHayomYomText(month, day);

  if (text) {
    return {
      title: 'Hayom Yom',
      titleHe: 'היום יום',
      sections: [{ verse: 1, text }],
      ref: `היום יום – ${dayHe} ${monthHe}`,
    };
  }

  return {
    title: 'Hayom Yom',
    titleHe: 'היום יום',
    sections: [{ verse: 1, text: `היום יום – ${dayHe} ${monthHe}\n\nלא נמצא תוכן לתאריך זה.` }],
    ref: `היום יום – ${dayHe} ${monthHe}`,
  };
}

// ─── Exports ──────────────────────────────────────────────
export type LearningType = 'tehillim' | 'tanya' | 'chumash' | 'rambam' | 'hayomyom';

export interface ReaderConfig {
  type: LearningType;
  title: string;
  titleHe: string;
  icon: string;
  color: string;
  description: string;
}

export const READER_CONFIGS: Record<LearningType, ReaderConfig> = {
  tehillim: {
    type: 'tehillim',
    title: 'תהלים יומי',
    titleHe: 'תהלים',
    icon: '📜',
    color: '#9B7FCC',
    description: 'פרקי תהלים על פי לוח החודש',
  },
  tanya: {
    type: 'tanya',
    title: 'תניא יומי',
    titleHe: 'תניא',
    icon: '📗',
    color: '#4CAF8A',
    description: 'ספר של בינוניים – אדמו״ר הזקן',
  },
  chumash: {
    type: 'chumash',
    title: 'חומש יומי',
    titleHe: 'חומש',
    icon: '📕',
    color: '#F5A623',
    description: 'פרשת השבוע עם עליה יומית',
  },
  rambam: {
    type: 'rambam',
    title: 'רמב״ם יומי',
    titleHe: 'רמב״ם',
    icon: '📘',
    color: '#5BAFD6',
    description: 'משנה תורה – 3 פרקים ליום',
  },
  hayomyom: {
    type: 'hayomyom',
    title: 'היום יום',
    titleHe: 'היום יום',
    icon: '✨',
    color: '#E8A838',
    description: 'לקוטי דברים – הרבי מליובאוויטש',
  },
};
