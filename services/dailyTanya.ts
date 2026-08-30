// Powered by OnSpace.AI
// Leap-year-aware daily Tanya (Tanya Yomi, תקנת אדמו"ר הריי"צ).
// Primary: the bundled local schedule + text (offline, instant). Belt-and-braces
// fallback: if the bundled modules didn't load, fetch the day's portion ONCE from
// Sefaria and cache it on-device, so the shiur is always correct and works offline
// after the first sync — as the user requested.
import { HDate } from '@hebcal/core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TANYA_YOMI_REGULAR, TANYA_YOMI_LEAP } from '@/constants/learning/tanyaSchedule';
import TANYA_TEXT from '@/constants/learning/tanyaText';

export interface TanyaDaily {
  title: string;
  titleHe: string;
  sections: { verse: number; text: string }[];
  ref: string;
}

const ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
function gematria(n: number): string {
  if (n <= 0) return '';
  let s = '';
  const h = Math.floor(n / 100);
  let rem = n % 100;
  if (h > 0) s += 'ק'.repeat(h);
  const t = Math.floor(rem / 10);
  const o = rem % 10;
  if (t === 1 && o === 5) return s + 'טו';
  if (t === 1 && o === 6) return s + 'טז';
  return s + TENS[t] + ONES[o];
}

const PART_HE: Record<string, { name: string; unit: string }> = {
  'Likkutei Amarim': { name: 'ליקוטי אמרים', unit: 'פרק' },
  'Shaar HaYichud VeHaEmunah': { name: 'שער היחוד והאמונה', unit: 'פרק' },
  'Iggeret HaTeshuvah': { name: 'אגרת התשובה', unit: 'פרק' },
  'Iggeret HaKodesh': { name: 'אגרת הקודש', unit: 'סימן' },
  'Kuntres Acharon': { name: 'קונטרס אחרון', unit: 'סימן' },
};
const STRUCTURAL: Record<string, string> = {
  'Title Page': 'שער',
  Approbation: 'הסכמה',
  'Compiler’s Foreword': 'הקדמת המלקט',
  "Compiler's Foreword": 'הקדמת המלקט',
  Foreword: 'הקדמה',
  Introduction: 'הקדמה',
};

/** Human Hebrew title from a Sefaria Tanya ref, e.g.
 *  "Tanya, Part IV; Iggeret HaKodesh 19:4" → "אגרת הקודש · סימן יט". */
function refToTitle(ref: string): string {
  const afterSemi = ref.includes(';') ? ref.split(';').slice(1).join(';').trim() : ref;
  // Find the part name that this ref belongs to.
  for (const key of Object.keys(PART_HE)) {
    if (afterSemi.includes(key)) {
      const { name, unit } = PART_HE[key];
      const rest = afterSemi.slice(afterSemi.indexOf(key) + key.length).trim();
      // structural label (Title Page / Approbation / Foreword …)
      for (const sk of Object.keys(STRUCTURAL)) {
        if (rest.includes(sk)) return `${name} · ${STRUCTURAL[sk]}`;
      }
      const m = rest.match(/(\d+)/);
      if (m) return `${name} · ${unit} ${gematria(parseInt(m[1], 10))}`;
      return name;
    }
  }
  return 'תניא';
}

/** Today's Tanya portion, offline and leap-year-aware. Null if not found. */
export function getLocalTanya(date: Date = new Date()): TanyaDaily | null {
  try {
    const hd = new HDate(date);
    const key = `${hd.getMonth()}-${hd.getDate()}`;
    // Robust leap detection: prefer the static API, then the instance method.
    let leap = false;
    try {
      leap = typeof (HDate as any).isLeapYear === 'function'
        ? (HDate as any).isLeapYear(hd.getFullYear())
        : (hd as any).isLeapYear();
    } catch {
      try { leap = (hd as any).isLeapYear(); } catch { leap = false; }
    }
    const map = leap ? TANYA_YOMI_LEAP : TANYA_YOMI_REGULAR;
    const ref = map[key];
    if (!ref) return null;
    const lines = TANYA_TEXT[ref] ?? [];
    if (lines.length === 0) return null;
    return {
      title: 'Tanya',
      titleHe: refToTitle(ref),
      sections: lines.map((t, i) => ({ verse: i + 1, text: t })),
      ref,
    };
  } catch {
    return null;
  }
}

// ── Which portion is today (from the bundled schedule) — sync, tiny. ──
export function getTanyaRefForDate(date: Date = new Date()): { ref: string; titleHe: string } | null {
  try {
    const hd = new HDate(date);
    const key = `${hd.getMonth()}-${hd.getDate()}`;
    let leap = false;
    try {
      leap = typeof (HDate as any).isLeapYear === 'function'
        ? (HDate as any).isLeapYear(hd.getFullYear())
        : (hd as any).isLeapYear();
    } catch { leap = false; }
    const ref = (leap ? TANYA_YOMI_LEAP : TANYA_YOMI_REGULAR)[key];
    return ref ? { ref, titleHe: refToTitle(ref) } : null;
  } catch {
    return null;
  }
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function strip(h: string): string {
  return (h || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/[A-Za-z]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchRefTextOnline(ref: string): Promise<string[]> {
  const enc = encodeURIComponent(ref.replace(/ /g, '_'));
  const url = `https://www.sefaria.org/api/texts/${enc}?context=0&commentary=0&stripItags=1`;
  const resp = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!resp.ok) return [];
  const data = await resp.json();
  const he = data.he;
  const flat: string[] = Array.isArray(he) ? (he as any[]).flat(Infinity).filter((x) => typeof x === 'string') : typeof he === 'string' ? [he] : [];
  return flat.map(strip).filter((t) => t.length > 0);
}

// The authoritative daily Tanya Yomi ref straight from Sefaria's calendar — always
// current, and INDEPENDENT of the bundled schedule (which the build sometimes stubs).
async function fetchTanyaRefFromCalendar(date: Date): Promise<string | null> {
  const url = `https://www.sefaria.org/api/calendars?year=${date.getFullYear()}&month=${date.getMonth() + 1}&day=${date.getDate()}`;
  const resp = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!resp.ok) return null;
  const data = await resp.json();
  for (const it of data.calendar_items ?? []) {
    const en = it?.title?.en ?? '';
    if (en === 'Tanya Yomi' || en === 'Tanya') return it?.ref ?? null;
  }
  return null;
}

/**
 * Resolve today's Tanya, guaranteed. Bundled first (offline); otherwise fetch the
 * exact portion ONCE from Sefaria — both the ref (from the calendar) and the text —
 * and cache it on-device, so it is always correct and works offline after first sync.
 * The ref comes from the network so it works even when the bundled schedule is empty.
 */
export async function resolveDailyTanya(date: Date = new Date()): Promise<TanyaDaily> {
  const bundled = getLocalTanya(date);
  if (bundled) return bundled;

  const dateStr = ymd(date);
  const cacheKey = `tanya_daily_v2_${dateStr}`;
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached) as TanyaDaily;
  } catch {}

  // Get the ref: prefer the bundled schedule; if it is empty, ask Sefaria's calendar.
  let ref = getTanyaRefForDate(date)?.ref ?? null;
  if (!ref) {
    try { ref = await fetchTanyaRefFromCalendar(date); } catch {}
  }

  if (ref) {
    try {
      const lines = await fetchRefTextOnline(ref);
      if (lines.length > 0) {
        const result: TanyaDaily = {
          title: 'Tanya',
          titleHe: refToTitle(ref),
          sections: lines.map((t, i) => ({ verse: i + 1, text: t })),
          ref,
        };
        try { await AsyncStorage.setItem(cacheKey, JSON.stringify(result)); } catch {}
        return result;
      }
    } catch {}
  }

  return {
    title: 'Tanya',
    titleHe: ref ? refToTitle(ref) : 'תניא יומי',
    sections: [{ verse: 1, text: 'לא ניתן לטעון את השיעור. בדוק חיבור אינטרנט פעם אחת והוא יישמר.' }],
    ref: ref ?? 'Tanya',
  };
}
