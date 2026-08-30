// Powered by OnSpace.AI
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeoLocation, Zmanim } from '@hebcal/core';

export interface ZmanimTimes {
  alotHaShachar?: string;
  misheyakir?: string;
  sunrise?: string;
  sofZmanShmaMGA?: string;
  sofZmanShma?: string;
  sofZmanTfillaMGA?: string;
  sofZmanTfilla?: string;
  chatzot?: string;
  minchaGedola?: string;
  minchaKetana?: string;
  plagHaMincha?: string;
  sunset?: string;
  tzeit7083deg?: string;
  tzeit42min?: string;
  beinHaShmashos?: string;
}

export interface ZmanimResult {
  times: ZmanimTimes;
  location: string;
  date: string;
  shabbatEntry?: string; // Friday sunset - 18min
  shabbatExit?: string;  // Saturday tzeit
}

const CACHE_KEY = 'zmanim_cache';

function formatTime(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return iso;
  }
}

function getDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function isFriday(d: Date = new Date()): boolean {
  return d.getDay() === 5;
}
function isSaturday(d: Date = new Date()): boolean {
  return d.getDay() === 6;
}

function addMinutes(iso: string, min: number): string {
  try {
    const d = new Date(iso);
    d.setMinutes(d.getMinutes() - min);
    return d.toISOString();
  } catch {
    return iso;
  }
}

// ── Local zmanim (OFFLINE) via @hebcal/core ─────────────────
// Computes every halachic time from lat/long/date on-device — no network, so it
// can never fail with a false "no network". Returns null only if the library API
// is unexpectedly unavailable, in which case we fall back to the Hebcal web API.
function computeLocalTimes(lat: number, lng: number, tzid: string, name: string, date: Date): ZmanimTimes | null {
  try {
    const gloc = new GeoLocation(name, lat, lng, 0, tzid);
    const z = new Zmanim(gloc, date, false);
    const iso = (fn: () => Date): string | undefined => {
      try {
        const d = fn();
        return d instanceof Date && !isNaN(d.getTime()) ? d.toISOString() : undefined;
      } catch {
        return undefined;
      }
    };
    const sunsetD = (() => { try { return z.sunset(); } catch { return null; } })();
    const tzeit42 = sunsetD ? new Date(sunsetD.getTime() + 42 * 60000).toISOString() : undefined;
    const zz = z as any;
    const times: ZmanimTimes = {
      alotHaShachar: iso(() => (typeof zz.alotHaShachar === 'function' ? zz.alotHaShachar() : zz.dawn())),
      misheyakir: iso(() => z.misheyakir()),
      sunrise: iso(() => z.sunrise()),
      sofZmanShmaMGA: iso(() => z.sofZmanShmaMGA()),
      sofZmanShma: iso(() => z.sofZmanShma()),
      sofZmanTfillaMGA: iso(() => z.sofZmanTfillaMGA()),
      sofZmanTfilla: iso(() => z.sofZmanTfilla()),
      chatzot: iso(() => z.chatzot()),
      minchaGedola: iso(() => z.minchaGedola()),
      minchaKetana: iso(() => z.minchaKetana()),
      plagHaMincha: iso(() => z.plagHaMincha()),
      sunset: iso(() => z.sunset()),
      tzeit42min: tzeit42,
      tzeit7083deg: iso(() => z.tzeit(7.083)),
    };
    // Valid only if the core solar AND a derived halachic time resolved — otherwise
    // the library API differs from what we expect, so fall back to the web API
    // rather than show a half-empty list.
    if (!times.sunrise || !times.sunset || !times.sofZmanShma || !times.chatzot) return null;
    return times;
  } catch {
    return null;
  }
}

export async function fetchZmanim(): Promise<ZmanimResult> {
  const today = new Date();
  const dateStr = getDateStr(today);

  // Try cache
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.date === dateStr) return parsed;
    }
  } catch {}

  // Device timezone (used both for local computation and, as a fallback, the API).
  let tzid = 'Asia/Jerusalem';
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) tzid = tz;
  } catch {}

  // Request location (fully guarded — a location failure must never break zmanim;
  // we simply fall back to Jerusalem defaults).
  let lat = 31.7683; // Jerusalem default
  let lng = 35.2137;
  let locationName = 'ירושלים';
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      // getCurrentPositionAsync can hang indefinitely on some devices → race a timeout.
      const loc = (await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<null>((res) => setTimeout(() => res(null), 8000)),
      ])) as Location.LocationObject | null;
      if (loc) {
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
        try {
          const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          if (geo.length > 0) {
            const g = geo[0];
            locationName = g.city ?? g.region ?? g.country ?? locationName;
          }
        } catch {}
      }
    }
  } catch {}

  // ── PRIMARY: compute everything locally (offline). ──
  let rawTimes = computeLocalTimes(lat, lng, tzid, locationName, today);
  let shabbatExit: string | undefined;
  if (rawTimes) {
    if (isFriday(today)) {
      const satDate = new Date(today);
      satDate.setDate(satDate.getDate() + 1);
      const satTimes = computeLocalTimes(lat, lng, tzid, locationName, satDate);
      shabbatExit = satTimes?.tzeit42min;
    }
  } else {
    // ── FALLBACK: Hebcal web API (only if the local library is unavailable). ──
    try {
      const url = `https://www.hebcal.com/zmanim?cfg=json&latitude=${lat}&longitude=${lng}&tzid=${encodeURIComponent(tzid)}&date=${dateStr}&sec=0`;
      const resp = await fetch(url);
      if (resp.ok) {
        const data = await resp.json();
        rawTimes = data.times ?? {};
      }
    } catch {}
    if (isFriday(today) && rawTimes) {
      const satDate = new Date(today);
      satDate.setDate(satDate.getDate() + 1);
      const satStr = getDateStr(satDate);
      try {
        const satResp = await fetch(`https://www.hebcal.com/zmanim?cfg=json&latitude=${lat}&longitude=${lng}&tzid=${encodeURIComponent(tzid)}&date=${satStr}&sec=0`);
        if (satResp.ok) {
          const satData = await satResp.json();
          shabbatExit = satData.times?.tzeit42min;
        }
      } catch {}
    }
  }

  const t = rawTimes ?? {};
  const result: ZmanimResult = {
    times: t,
    location: locationName,
    date: dateStr,
    shabbatEntry: isFriday(today) ? addMinutes(t.sunset ?? '', 18) : undefined,
    shabbatExit: isSaturday(today) ? t.tzeit42min : shabbatExit,
  };

  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(result));
  } catch {}

  return result;
}

export function formatZmanTime(iso: string | undefined): string {
  if (!iso) return '--:--';
  return formatTime(iso);
}

export interface ZmanDisplay {
  key: string;
  label: string;
  sublabel?: string;
  iso?: string;
  icon: string;
  highlight?: boolean;
  isShabbat?: boolean;
}

export function buildZmanimDisplay(result: ZmanimResult, today: Date = new Date()): ZmanDisplay[] {
  const t = result.times;
  const items: ZmanDisplay[] = [
    {
      key: 'alot',
      label: 'עלות השחר',
      sublabel: 'תחילת זמן ציצית ותפילין',
      iso: t.alotHaShachar,
      icon: '🌌',
    },
    {
      key: 'misheyakir',
      label: 'משיכיר',
      sublabel: 'זמן ציצית ותפילין מהדרין',
      iso: t.misheyakir,
      icon: '🌠',
    },
    {
      key: 'netz',
      label: 'הנץ החמה',
      sublabel: 'זריחה – תחילת זמן שחרית',
      iso: t.sunrise,
      icon: '🌅',
      highlight: true,
    },
    {
      key: 'sof_shma',
      label: 'סוף זמן קריאת שמע',
      sublabel: 'לדעת הגר״א',
      iso: t.sofZmanShma,
      icon: '📖',
      highlight: true,
    },
    {
      key: 'sof_shma_mga',
      label: 'סוף זמן ק״ש',
      sublabel: 'לדעת המגן אברהם',
      iso: t.sofZmanShmaMGA,
      icon: '📖',
    },
    {
      key: 'sof_tfilla',
      label: 'סוף זמן תפילה',
      sublabel: 'שחרית – לדעת הגר״א',
      iso: t.sofZmanTfilla,
      icon: '🙏',
      highlight: true,
    },
    {
      key: 'chatzot',
      label: 'חצות היום',
      sublabel: 'אמצע היום ההלכתי',
      iso: t.chatzot,
      icon: '☀️',
    },
    {
      key: 'mincha_gedola',
      label: 'מנחה גדולה',
      sublabel: 'זמן מנחה מוקדם ביותר',
      iso: t.minchaGedola,
      icon: '🕐',
      highlight: true,
    },
    {
      key: 'mincha_ketana',
      label: 'מנחה קטנה',
      sublabel: 'הזמן המועדף למנחה',
      iso: t.minchaKetana,
      icon: '🕔',
      highlight: true,
    },
    {
      key: 'plag',
      label: 'פלג המנחה',
      sublabel: 'לנוהגים קבלת שבת מפלג',
      iso: t.plagHaMincha,
      icon: '🕖',
    },
    {
      key: 'shkia',
      label: 'שקיעת החמה',
      sublabel: 'שקיעה',
      iso: t.sunset,
      icon: '🌇',
      highlight: true,
    },
  ];

  if (isFriday(today) && result.shabbatEntry) {
    items.push({
      key: 'shabbat_entry',
      label: 'כניסת שבת',
      sublabel: '18 דקות לפני השקיעה',
      iso: result.shabbatEntry,
      icon: '🕯️',
      highlight: true,
      isShabbat: true,
    });
  }

  if (isSaturday(today) && result.shabbatExit) {
    items.push({
      key: 'shabbat_exit',
      label: 'צאת שבת',
      sublabel: 'צאת הכוכבים – 42 דקות',
      iso: result.shabbatExit,
      icon: '✨',
      highlight: true,
      isShabbat: true,
    });
  }

  items.push({
    key: 'tzeit',
    label: 'צאת הכוכבים',
    sublabel: '42 דקות אחרי השקיעה',
    iso: t.tzeit42min,
    icon: '🌃',
  });

  return items;
}
