// Powered by OnSpace.AI
// Luach (Hebrew-calendar) context resolver.
// Given a civil Date, computes the halachic facts a weekday siddur needs in
// order to show/hide conditional blocks. Diaspora (חו״ל) settings — il=false.
//
// ⚠️ HALACHA VERIFICATION NEEDED: the tachanun / season / tal-umatar rules below
// follow common practice but have minhag variations. Review with a rav before
// relying on this in production. Every inferred rule is marked `// VERIFY`.

import { HDate, HebrewCalendar, months, flags, Event } from '@hebcal/core';
import type { Condition } from '@/constants/tefillot/types';

const IL = false; // חו״ל (Diaspora)

export interface LuachContext {
  date: Date;
  hdate: HDate;
  weekday: number;        // 0=Sunday … 6=Shabbat
  isMondayThursday: boolean;
  isRoshChodesh: boolean;
  isCholHamoed: boolean;
  isYomTov: boolean;
  tachanun: boolean;      // is Tachanun said at Shacharit today
  season: 'geshem' | 'tal';
  rain: 'barechAleinu' | 'barchenu'; // birkat-hashanim variant (tal-umatar)
  fast: 'gedalia' | 'asaraBTevet' | null;
  events: string[];       // hebcal event descriptions (for display / debugging)
}

function eventsOn(hdate: HDate): Event[] {
  return HebrewCalendar.getHolidaysOnDate(hdate, IL) || [];
}

/** Absolute (Rata Die) day number for a given Hebrew day/month/year. */
function absOf(year: number, month: number, day: number): number {
  return new HDate(day, month, year).abs();
}

// ── מוריד הגשם / מוריד הטל ─────────────────────────────────────────────
// Geshem ("משיב הרוח ומוריד הגשם") from Musaf of Shmini Atzeret (22 Tishrei)
// through Shacharit of the first day of Pesach; otherwise Tal.
// At Shacharit the first geshem day is 23 Tishrei and the last is 15 Nisan. // VERIFY
function computeSeason(hdate: HDate): 'geshem' | 'tal' {
  // Within a Hebrew year, Tishrei precedes Nisan, so 23 Tishrei → 15 Nisan of the
  // SAME Hebrew year brackets the geshem window.
  const y = hdate.getFullYear();
  const abs = hdate.abs();
  const winterStart = absOf(y, months.TISHREI, 23); // 23 Tishrei
  const winterEnd = absOf(y, months.NISAN, 15);     // 15 Nisan
  return abs >= winterStart && abs <= winterEnd ? 'geshem' : 'tal';
}

// ── ברך עלינו (ותן טל ומטר) / ברכנו ────────────────────────────────────
// Diaspora: start "ותן טל ומטר" at Maariv of Dec 4, or Dec 5 in the (civil) year
// preceding a Gregorian leap year; recite until (and including) Shacharit of Erev
// Pesach — i.e. through 14 Nisan. // VERIFY
function isCivilLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}
function computeRain(date: Date, hdate: HDate): 'barechAleinu' | 'barchenu' {
  const abs = hdate.abs();
  // Which civil December starts THIS winter's tal-umatar window?
  const cm = date.getMonth(); // 0=Jan … 11=Dec
  const decYear = cm >= 9 ? date.getFullYear() : date.getFullYear() - 1; // Oct–Dec → this year
  const startDay = isCivilLeap(decYear + 1) ? 5 : 4; // Dec 5 in the year before a civil leap year
  const decStartAbs = new HDate(new Date(decYear, 11, startDay)).abs();
  // Window ends at Pesach (15 Nisan of the current Hebrew year).
  const pesachAbs = absOf(hdate.getFullYear(), months.NISAN, 15);
  return abs >= decStartAbs && abs < pesachAbs ? 'barechAleinu' : 'barchenu';
}

// ── תחנון ──────────────────────────────────────────────────────────────
// Returns false on the (common) days Tachanun is omitted. Diaspora. // VERIFY (minhagim vary)
function computeTachanun(date: Date, hdate: HDate, evs: Event[]): boolean {
  if (date.getDay() === 6) return false; // Shabbat
  const m = hdate.getMonth();
  const d = hdate.getDate();

  // Whole-period omissions
  if (m === months.NISAN) return false;                       // all of Nisan
  if (m === months.SIVAN && d <= 12) return false;            // Rosh Chodesh Sivan – 12 Sivan
  if (m === months.AV && d >= 9 && d <= 15) return false;     // 9–15 Av
  if (m === months.TISHREI && d >= 9) return false;           // Erev Yom Kippur – end of Tishrei
  if (m === months.TISHREI && d <= 2) return false;           // Rosh Hashana days (safety)

  // Single days
  if (m === months.IYYAR && (d === 14 || d === 18)) return false; // Pesach Sheni, Lag BaOmer
  if (m === months.SHVAT && d === 15) return false;               // Tu BiShvat
  if ((m === months.ADAR_I || m === months.ADAR_II) && (d === 14 || d === 15)) return false; // Purim/Shushan/Katan

  // Event-flag based: Rosh Chodesh, Chanukah, Yom Tov (CHAG), Chol HaMoed, Erev Yom Tov.
  for (const e of evs) {
    const f = e.getFlags();
    if (f & (flags.ROSH_CHODESH | flags.CHANUKAH_CANDLES | flags.CHOL_HAMOED |
             flags.YOM_TOV_ENDS | flags.CHAG | flags.LIGHT_CANDLES)) {
      return false;
    }
    if (/Chanukah|Purim|Shushan|Tu B'Av|Lag BaOmer/i.test(e.getDesc())) return false;
  }
  return true;
}

export function getLuachContext(date: Date = new Date(), opts?: { avelut?: boolean }): LuachContext {
  const hdate = new HDate(date);
  const evs = eventsOn(hdate);
  const descs = evs.map((e) => e.getDesc());

  const isRoshChodesh = evs.some((e) => e.getFlags() & flags.ROSH_CHODESH);
  const isCholHamoed = evs.some((e) => e.getFlags() & flags.CHOL_HAMOED);
  const isYomTov = evs.some((e) => e.getFlags() & (flags.YOM_TOV_ENDS | flags.CHAG));
  const m = hdate.getMonth();
  const d = hdate.getDate();
  const fast: LuachContext['fast'] =
    m === months.TISHREI && d === 3 ? 'gedalia' :
    m === months.TEVET && d === 10 ? 'asaraBTevet' : null;

  return {
    date,
    hdate,
    weekday: date.getDay(),
    isMondayThursday: date.getDay() === 1 || date.getDay() === 4,
    isRoshChodesh,
    isCholHamoed,
    isYomTov,
    tachanun: computeTachanun(date, hdate, evs),
    season: computeSeason(hdate),
    rain: computeRain(date, hdate),
    fast,
    events: descs,
  };
}

/** Decide whether a block with the given condition is shown in this context. */
export function conditionVisible(
  cond: Condition | undefined,
  ctx: LuachContext,
  weekday?: number,
): boolean {
  // "Shir shel yom": show only the block matching today's weekday.
  if (weekday !== undefined) return weekday === ctx.weekday;

  switch (cond) {
    case undefined:
    case 'always':          return true;
    case 'tachanun':        return ctx.tachanun;
    case 'noTachanun':      return !ctx.tachanun;
    case 'mondayThursday':  return ctx.isMondayThursday; // VERIFY: also RC / fast / Chanukah for Torah reading
    case 'geshem':          return ctx.season === 'geshem';
    case 'tal':             return ctx.season === 'tal';
    case 'barechAleinu':    return ctx.rain === 'barechAleinu';
    case 'barchenu':        return ctx.rain === 'barchenu';
    case 'fastGedaliaAsara':return ctx.fast !== null;
    case 'avelut':          return false; // manual toggle; wired via screen state
    default:                return true;
  }
}
