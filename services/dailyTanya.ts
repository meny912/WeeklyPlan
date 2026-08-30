// Powered by OnSpace.AI
// Offline, leap-year-aware daily Tanya (Tanya Yomi, תקנת אדמו"ר הריי"צ).
// Picks today's portion from the local schedule by the Hebrew date + whether the
// year is a leap year, then serves the bundled local text. No network.
import { HDate } from '@hebcal/core';
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
