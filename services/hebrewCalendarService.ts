// Powered by OnSpace.AI
import { HDate, months } from '@hebcal/core';

export type EventType = 'hilula' | 'geula' | 'birthday' | 'holiday' | 'other';

export interface ChassidicEvent {
  id: string;
  hebrewDay: number;
  hebrewMonth: number; // @hebcal/core month numbers
  title: string;
  subtitle?: string;
  type: EventType;
  icon: string;
}

// Month numbers from @hebcal/core months enum
// NISAN=1, IYAR=2, SIVAN=3, TAMUZ=4, AV=5, ELUL=6,
// TISHREI=7, CHESHVAN=8, KISLEV=9, TEVET=10, SHVAT=11, ADAR_I=12

export const CHASSIDIC_EVENTS: ChassidicEvent[] = [
  // תשרי
  {
    id: 'yud_gimel_tishrei',
    hebrewDay: 13,
    hebrewMonth: months.TISHREI,
    title: 'יום הסתלקות הרבנית חנה',
    subtitle: 'י״ג תשרי',
    type: 'hilula',
    icon: '🕯️',
  },
  {
    id: 'kuf_tishrei',
    hebrewDay: 20,
    hebrewMonth: months.TISHREI,
    title: 'יום הסתלקות המהר״ש',
    subtitle: 'כ׳ תשרי · האדמו״ר הרביעי',
    type: 'hilula',
    icon: '🕯️',
  },
  // חשוון
  {
    id: 'kuf_cheshvan',
    hebrewDay: 20,
    hebrewMonth: months.CHESHVAN,
    title: 'יום הולדת הרש״ב',
    subtitle: 'כ׳ חשוון · האדמו״ר החמישי',
    type: 'birthday',
    icon: '👑',
  },
  // כסלו
  {
    id: 'yud_kislev',
    hebrewDay: 10,
    hebrewMonth: months.KISLEV,
    title: 'חג הגאולה – האדמו״ר האמצעי',
    subtitle: 'י׳ כסלו',
    type: 'geula',
    icon: '✨',
  },
  {
    id: 'yud_tet_kislev',
    hebrewDay: 19,
    hebrewMonth: months.KISLEV,
    title: 'י״ט כסלו – ראש השנה לחסידות',
    subtitle: 'חג הגאולה של האדמו״ר הזקן',
    type: 'geula',
    icon: '✨',
  },
  {
    id: 'kuf_kislev',
    hebrewDay: 20,
    hebrewMonth: months.KISLEV,
    title: 'יום הסתלקות המגיד ממזריטש',
    subtitle: 'כ׳ כסלו',
    type: 'hilula',
    icon: '🕯️',
  },
  // טבת
  {
    id: 'hey_tevet',
    hebrewDay: 5,
    hebrewMonth: months.TEVET,
    title: '"דידן נצח"',
    subtitle: 'ה׳ טבת · ניצחון הספרים',
    type: 'holiday',
    icon: '📚',
  },
  {
    id: 'kuf_dalet_tevet',
    hebrewDay: 24,
    hebrewMonth: months.TEVET,
    title: 'יום הסתלקות האדמו״ר הזקן',
    subtitle: 'כ״ד טבת · בעל התניא',
    type: 'hilula',
    icon: '🕯️',
  },
  // שבט
  {
    id: 'yud_shvat',
    hebrewDay: 10,
    hebrewMonth: months.SHVAT,
    title: 'יום הסתלקות הריי״צ',
    subtitle: 'י׳ שבט · קבלת הנשיאות של הרבי',
    type: 'hilula',
    icon: '🕯️',
  },
  {
    id: 'kuf_bet_shvat',
    hebrewDay: 22,
    hebrewMonth: months.SHVAT,
    title: 'יום הסתלקות הרבנית חיה מושקא',
    subtitle: 'כ״ב שבט',
    type: 'hilula',
    icon: '🕯️',
  },
  // אדר
  {
    id: 'zayin_adar',
    hebrewDay: 7,
    hebrewMonth: months.ADAR_I,
    title: 'יום הולדת והסתלקות משה רבנו',
    subtitle: 'ז׳ אדר',
    type: 'hilula',
    icon: '⭐',
  },
  {
    id: 'yud_alef_adar',
    hebrewDay: 11,
    hebrewMonth: months.ADAR_I,
    title: 'יום הסתלקות אדמו״ר מהר״ש',
    subtitle: 'י״א אדר · האדמו״ר הרביעי',
    type: 'hilula',
    icon: '🕯️',
  },
  // ניסן
  {
    id: 'bet_nisan',
    hebrewDay: 2,
    hebrewMonth: months.NISAN,
    title: 'יום הסתלקות האדמו״ר הרש״ב',
    subtitle: 'ב׳ ניסן · האדמו״ר החמישי',
    type: 'hilula',
    icon: '🕯️',
  },
  {
    id: 'yud_alef_nisan',
    hebrewDay: 11,
    hebrewMonth: months.NISAN,
    title: 'יום הולדת הרבי',
    subtitle: 'י״א ניסן · כ"ק אדמו"ר',
    type: 'birthday',
    icon: '👑',
  },
  {
    id: 'yud_gimel_nisan',
    hebrewDay: 13,
    hebrewMonth: months.NISAN,
    title: 'יום הסתלקות הצמח צדק',
    subtitle: 'י״ג ניסן · האדמו״ר השלישי',
    type: 'hilula',
    icon: '🕯️',
  },
  // אייר
  {
    id: 'bet_iyar',
    hebrewDay: 2,
    hebrewMonth: months.IYAR,
    title: 'יום הולדת אדמו״ר מהר״ש',
    subtitle: 'ב׳ אייר · האדמו״ר הרביעי',
    type: 'birthday',
    icon: '👑',
  },
  {
    id: 'yud_dalet_iyar',
    hebrewDay: 14,
    hebrewMonth: months.IYAR,
    title: 'פסח שני',
    subtitle: 'י״ד אייר',
    type: 'holiday',
    icon: '🫓',
  },
  {
    id: 'yud_chet_iyar',
    hebrewDay: 18,
    hebrewMonth: months.IYAR,
    title: 'ל״ג בעומר',
    subtitle: 'י״ח אייר',
    type: 'holiday',
    icon: '🔥',
  },
  // תמוז
  {
    id: 'gimel_tamuz',
    hebrewDay: 3,
    hebrewMonth: months.TAMUZ,
    title: 'ג׳ תמוז',
    subtitle: 'יום הסתלקות הרבי',
    type: 'hilula',
    icon: '🕯️',
  },
  {
    id: 'yud_bet_tamuz',
    hebrewDay: 12,
    hebrewMonth: months.TAMUZ,
    title: 'חג הגאולה של הריי״צ',
    subtitle: 'י״ב–י״ג תמוז',
    type: 'geula',
    icon: '✨',
  },
  // אב
  {
    id: 'tet_vav_av',
    hebrewDay: 15,
    hebrewMonth: months.AV,
    title: 'ט״ו באב',
    subtitle: 'ט״ו אב',
    type: 'holiday',
    icon: '🌕',
  },
  // אלול
  {
    id: 'chai_elul',
    hebrewDay: 18,
    hebrewMonth: months.ELUL,
    title: 'ח״י אלול – "חי אלול"',
    subtitle: 'יום הולדת הבעש״ט והאדמו״ר הזקן',
    type: 'birthday',
    icon: '🌟',
  },
];

export interface ResolvedEvent extends ChassidicEvent {
  gregDate: Date;
  daysUntil: number;
  isPast: boolean;
  isToday: boolean;
}

export function getTodayHebrew(): { hdate: HDate; display: string } {
  const hdate = new HDate(new Date());
  const display = hdate.render('he');
  return { hdate, display };
}

function hebrewMonthName(month: number): string {
  const names: Record<number, string> = {
    1: 'ניסן', 2: 'אייר', 3: 'סיון', 4: 'תמוז', 5: 'אב', 6: 'אלול',
    7: 'תשרי', 8: 'חשוון', 9: 'כסלו', 10: 'טבת', 11: 'שבט', 12: 'אדר', 13: 'אדר ב׳',
  };
  return names[month] ?? '';
}

const GEMATRIA: Record<number, string> = {
  1: 'א׳', 2: 'ב׳', 3: 'ג׳', 4: 'ד׳', 5: 'ה׳', 6: 'ו׳', 7: 'ז׳', 8: 'ח׳', 9: 'ט׳',
  10: 'י׳', 11: 'י״א', 12: 'י״ב', 13: 'י״ג', 14: 'י״ד', 15: 'ט״ו', 16: 'ט״ז',
  17: 'י״ז', 18: 'י״ח', 19: 'י״ט', 20: 'כ׳', 21: 'כ״א', 22: 'כ״ב', 23: 'כ״ג',
  24: 'כ״ד', 25: 'כ״ה', 26: 'כ״ו', 27: 'כ״ז', 28: 'כ״ח', 29: 'כ״ט', 30: 'ל׳',
};

export function hebrewDayToGematria(day: number): string {
  return GEMATRIA[day] ?? String(day);
}

export function hebrewMonthDisplay(month: number): string {
  return hebrewMonthName(month);
}

// Hebcal month name strings (for API calls)
const HEBCAL_MONTH_NAMES: Record<number, string> = {
  1: 'Nisan', 2: 'Iyyar', 3: 'Sivan', 4: 'Tamuz', 5: 'Av', 6: 'Elul',
  7: 'Tishrei', 8: 'Cheshvan', 9: 'Kislev', 10: 'Tevet', 11: 'Shvat',
  12: 'Adar', 13: 'Adar II',
};

// Cache for Hebrew→Gregorian conversions
const _gregCache: Record<string, Date> = {};

// Convert Hebrew date to Gregorian using Hebcal API (authoritative, handles all edge cases)
export async function hebrewToGreg(day: number, month: number, year: number): Promise<Date | null> {
  const monthName = HEBCAL_MONTH_NAMES[month];
  if (!monthName) return null;
  const cacheKey = `${year}_${month}_${day}`;
  if (_gregCache[cacheKey]) return _gregCache[cacheKey];

  try {
    const url = `https://www.hebcal.com/converter?v=1&cfg=json&hy=${year}&hm=${encodeURIComponent(monthName)}&hd=${day}&h2g=1`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();
    // data: { gy, gm, gd } — gm is 1-based
    const date = new Date(Date.UTC(data.gy, data.gm - 1, data.gd, 12, 0, 0));
    _gregCache[cacheKey] = date;
    return date;
  } catch {
    return null;
  }
}

// Synchronous fallback using HDate (may have small timezone issues)
function hdateToGreg(hd: HDate): Date {
  const g = hd.greg();
  return new Date(Date.UTC(g.getUTCFullYear(), g.getUTCMonth(), g.getUTCDate(), 12, 0, 0));
}

function utcDayOf(d: Date): number {
  return Math.floor(d.getTime() / 86400000);
}

// Resolve events synchronously using HDate (fast, called in render)
// Async version using Hebcal API is called in hebrewCalendarService.resolveEventsAsync
export function resolveEvents(): ResolvedEvent[] {
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0));
  const todayDay = utcDayOf(todayUTC);

  const todayHDate = new HDate(now);
  const currentHebrewYear = todayHDate.getFullYear();

  return CHASSIDIC_EVENTS.map(event => {
    let gregDate: Date;
    let daysUntil: number;

    try {
      // Use Hebcal HDate for current year
      const eventHDate = new HDate(event.hebrewDay, event.hebrewMonth, currentHebrewYear);
      const g = eventHDate.greg();
      gregDate = new Date(Date.UTC(g.getUTCFullYear(), g.getUTCMonth(), g.getUTCDate(), 12, 0, 0));
      daysUntil = utcDayOf(gregDate) - todayDay;

      if (daysUntil < 0) {
        // Past this year → compute next Hebrew year
        const nextHDate = new HDate(event.hebrewDay, event.hebrewMonth, currentHebrewYear + 1);
        const gNext = nextHDate.greg();
        gregDate = new Date(Date.UTC(gNext.getUTCFullYear(), gNext.getUTCMonth(), gNext.getUTCDate(), 12, 0, 0));
        daysUntil = utcDayOf(gregDate) - todayDay;
      }
    } catch {
      gregDate = todayUTC;
      daysUntil = 365;
    }

    return {
      ...event,
      gregDate,
      daysUntil,
      isPast: false,
      isToday: daysUntil === 0,
    };
  }).sort((a, b) => a.daysUntil - b.daysUntil);
}

export function formatGregDate(date: Date): string {
  return date.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function getEventTypeLabel(type: EventType): string {
  switch (type) {
    case 'hilula': return 'הסתלקות';
    case 'geula': return 'גאולה';
    case 'birthday': return 'יום הולדת';
    case 'holiday': return 'חג / מועד';
    default: return '';
  }
}

export function getEventTypeColor(type: EventType, colors: Record<string, string>): string {
  switch (type) {
    case 'hilula': return '#9B7FCC'; // purple
    case 'geula': return colors.primary;  // gold
    case 'birthday': return colors.success; // green
    case 'holiday': return '#5BAFD6'; // blue
    default: return colors.textSecondary;
  }
}
