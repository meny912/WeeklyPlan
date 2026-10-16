import { HDate, months } from '@hebcal/core';

export type EventType = 'hilula' | 'geula' | 'birthday' | 'holiday' | 'other';

export interface ChassidicEvent {
  id: string;
  hebrewDay: number;
  hebrewMonth: number; // @hebcal/core month numbers (ADAR_I = Adar in a regular year)
  /** In a leap year, which Adar the day falls in. Birthdays and Purim-like days
   *  go to Adar II; a yahrzeit stays in Adar I. */
  leapAdar?: 'I' | 'II';
  title: string;
  subtitle?: string;
  type: EventType;
}

// Month numbers from @hebcal/core months enum
// NISAN=1, IYAR=2, SIVAN=3, TAMUZ=4, AV=5, ELUL=6,
// TISHREI=7, CHESHVAN=8, KISLEV=9, TEVET=10, SHVAT=11, ADAR_I=12, ADAR_II=13

const ev = (
  id: string, hebrewDay: number, hebrewMonth: number, type: EventType,
  title: string, subtitle?: string, leapAdar?: 'I' | 'II',
): ChassidicEvent => ({ id, hebrewDay, hebrewMonth, type, title, subtitle, leapAdar });

// Days of the Chabad calendar (Luach Kollel Chabad / Sefer HaMinhagim).
export const CHASSIDIC_EVENTS: ChassidicEvent[] = [
  // תשרי
  ev('vav_tishrei', 6, months.TISHREI, 'hilula', 'יום ההילולא של הרבנית חנה', 'אמו של הרבי · תשכ״ה'),
  ev('yud_gimel_tishrei', 13, months.TISHREI, 'hilula', 'יום ההילולא של אדמו״ר מהר״ש', 'האדמו״ר הרביעי · תרמ״ג'),
  // חשוון
  ev('chaf_cheshvan', 20, months.CHESHVAN, 'birthday', 'יום הולדת אדמו״ר הרש״ב', 'האדמו״ר החמישי · תרכ״א'),
  // כסלו
  ev('tes_kislev_birth', 9, months.KISLEV, 'birthday', 'יום הולדת אדמו״ר האמצעי', 'האדמו״ר השני · תקל״ד'),
  ev('tes_kislev_hilula', 9, months.KISLEV, 'hilula', 'יום ההילולא של אדמו״ר האמצעי', 'האדמו״ר השני · תקפ״ח'),
  ev('yud_kislev', 10, months.KISLEV, 'geula', 'חג הגאולה של אדמו״ר האמצעי', 'תקפ״ז'),
  ev('yud_dalet_kislev', 14, months.KISLEV, 'other', 'יום חתונת הרבי והרבנית', 'תרפ״ט'),
  ev('yud_tes_kislev', 19, months.KISLEV, 'geula', 'י״ט כסלו – ראש השנה לחסידות', 'חג הגאולה של אדמו״ר הזקן · תקנ״ט'),
  ev('yud_tes_kislev_maggid', 19, months.KISLEV, 'hilula', 'יום ההילולא של המגיד ממעזריטש', 'תקל״ג'),
  // טבת
  ev('hey_tevet', 5, months.TEVET, 'geula', 'ה׳ טבת – דידן נצח', 'ניצחון הספרים · תשמ״ז'),
  ev('chaf_dalet_tevet', 24, months.TEVET, 'hilula', 'יום ההילולא של אדמו״ר הזקן', 'בעל התניא והשולחן ערוך · תקע״ג'),
  // שבט
  ev('yud_shvat', 10, months.SHVAT, 'hilula', 'יום ההילולא של אדמו״ר הריי״צ', 'תש״י · ותחילת נשיאות הרבי, תשי״א'),
  ev('chaf_beis_shvat', 22, months.SHVAT, 'hilula', 'יום ההילולא של הרבנית חיה מושקא', 'תשמ״ח'),
  // אדר
  ev('zayin_adar', 7, months.ADAR_I, 'hilula', 'יום הולדת ויום הסתלקות משה רבנו', undefined, 'I'),
  ev('chaf_hey_adar', 25, months.ADAR_I, 'birthday', 'יום הולדת הרבנית חיה מושקא', 'תרס״א', 'II'),
  // ניסן
  ev('beis_nisan', 2, months.NISAN, 'hilula', 'יום ההילולא של אדמו״ר הרש״ב', 'האדמו״ר החמישי · תר״ף'),
  ev('yud_alef_nisan', 11, months.NISAN, 'birthday', 'יום הולדת הרבי', 'י״א ניסן · תרס״ב'),
  ev('yud_gimel_nisan', 13, months.NISAN, 'hilula', 'יום ההילולא של הצמח צדק', 'האדמו״ר השלישי · תרכ״ו'),
  // אייר
  ev('beis_iyar', 2, months.IYYAR, 'birthday', 'יום הולדת אדמו״ר מהר״ש', 'האדמו״ר הרביעי · תקצ״ד'),
  ev('pesach_sheni', 14, months.IYYAR, 'holiday', 'פסח שני'),
  ev('lag_baomer', 18, months.IYYAR, 'holiday', 'ל״ג בעומר', 'יום ההילולא של רשב״י'),
  // סיון
  ev('chaf_ches_sivan', 28, months.SIVAN, 'geula', 'הצלת הרבי והגעתו לארצות הברית', 'תש״א'),
  // תמוז
  ev('gimmel_tammuz', 3, months.TAMUZ, 'hilula', 'ג׳ תמוז – יום ההילולא של הרבי', 'תשנ״ד'),
  ev('yud_beis_tammuz', 12, months.TAMUZ, 'geula', 'חג הגאולה של אדמו״ר הריי״צ', 'י״ב–י״ג תמוז · תרפ״ז · ויום הולדתו, תר״ם'),
  // אב
  ev('tu_beav', 15, months.AV, 'holiday', 'ט״ו באב'),
  ev('chaf_av', 20, months.AV, 'hilula', 'יום ההילולא של הרב לוי יצחק', 'אביו של הרבי · תש״ד'),
  // אלול
  ev('tes_vav_elul', 15, months.ELUL, 'other', 'ייסוד ישיבת תומכי תמימים', 'תרנ״ז'),
  ev('chai_elul', 18, months.ELUL, 'birthday', 'ח״י אלול', 'יום הולדת הבעל שם טוב ואדמו״ר הזקן'),
  ev('chaf_tes_elul', 29, months.ELUL, 'birthday', 'יום הולדת הצמח צדק', 'האדמו״ר השלישי · תקמ״ט'),
];

export interface ResolvedEvent extends ChassidicEvent {
  gregDate: Date;
  daysUntil: number;
  isPast: boolean;
  isToday: boolean;
  /** The Hebrew month the day actually falls in this year (Adar I / II resolved). */
  resolvedMonth: number;
}

export function getTodayHebrew(): { hdate: HDate; display: string } {
  const hdate = new HDate(new Date());
  const display = hdate.renderGematriya(true);
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

// HDate.greg() returns *local* midnight. Read the local calendar parts — reading
// the UTC parts shifted every day one day earlier east of Greenwich.
function hdateToGreg(hd: HDate): Date {
  const g = hd.greg();
  return new Date(Date.UTC(g.getFullYear(), g.getMonth(), g.getDate(), 12, 0, 0));
}

function utcDayOf(d: Date): number {
  return Math.floor(d.getTime() / 86400000);
}

function monthInYear(event: ChassidicEvent, year: number): number {
  if (event.hebrewMonth === months.ADAR_I && HDate.isLeapYear(year) && event.leapAdar === 'II') {
    return months.ADAR_II;
  }
  return event.hebrewMonth;
}

export function resolveEvents(): ResolvedEvent[] {
  const now = new Date();
  const todayDay = utcDayOf(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0)));
  const year = new HDate(now).getFullYear();

  return CHASSIDIC_EVENTS.map(event => {
    let y = year;
    let month = monthInYear(event, y);
    let gregDate = hdateToGreg(new HDate(event.hebrewDay, month, y));
    if (utcDayOf(gregDate) < todayDay) {
      y = year + 1;
      month = monthInYear(event, y);
      gregDate = hdateToGreg(new HDate(event.hebrewDay, month, y));
    }
    const daysUntil = utcDayOf(gregDate) - todayDay;
    return { ...event, gregDate, daysUntil, isPast: false, isToday: daysUntil === 0, resolvedMonth: month };
  }).sort((a, b) => a.daysUntil - b.daysUntil);
}

/** Short Hebrew month label for an event's resolved month ("אדר א׳" in a leap year). */
export function eventMonthLabel(e: ResolvedEvent): string {
  if (e.resolvedMonth === months.ADAR_I) {
    const y = new HDate(e.gregDate).getFullYear();
    return HDate.isLeapYear(y) ? 'אדר א׳' : 'אדר';
  }
  return hebrewMonthName(e.resolvedMonth);
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
    case 'hilula': return '#9C8CC4'; // purple
    case 'geula': return colors.primary;  // gold
    case 'birthday': return colors.success; // green
    case 'holiday': return '#7FA3C2'; // blue
    default: return colors.textSecondary;
  }
}
