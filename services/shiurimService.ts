// Vienna shiurim from shiurfinder.at, read-only. Uses the site's public
// (anon) key – the same one its web page ships to every visitor – and reads
// only public fields; synagogue access codes are never requested.
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = 'https://mlxvftfymmzkecmkmlxv.backend.onspace.ai/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3ODIyMzkxMDQsImV4cCI6MjA5NzU5OTEwNCwicm9sZSI6ImFub24iLCJpc3MiOiJvbnNwYWNlIiwicmVmIjoibWx4dmZ0ZnltbXprZWNta21seHYifQ.-q4s348TsDfMQTJcyHWWntH-skQcqkPFaasyrNwBAPg';
const CACHE = 'shiurim_v1';
export const SHIURFINDER_URL = 'https://shiurfinder.at';

// shiurfinder calls the seventh day "Shabbat".
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Shabbat'];

export interface Shiur {
  id: string;
  title: string;
  topic: string;
  instructor: string;
  days: string[];
  time: string;
  duration: string;
  language: string;
  gender: string;
  location: string;
  description: string;
  flyerUrl: string | null;
  biweekly: boolean;
  synagogue: { id: number; name: string; nameHe: string; address: string } | null;
}

async function get(path: string): Promise<any[]> {
  const resp = await fetch(`${BASE}/${path}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  if (!resp.ok) throw new Error(`shiurfinder ${resp.status}`);
  return resp.json();
}

/** All active shiurim, sorted by time. Falls back to the last saved copy offline. */
export async function fetchShiurim(): Promise<{ list: Shiur[]; offline: boolean }> {
  try {
    const [classes, synagogues] = await Promise.all([
      get('classes?is_active=eq.true&select=id,synagogue_id,title,topic,instructor,day_of_week,days_of_week,time,duration,language,gender,location,description,flyer_url,recurrence_rule,parent_class_id'),
      get('synagogues?select=id,name,name_he,address'),
    ]);
    const syn = new Map<number, any>(synagogues.map((s: any) => [s.id, s]));
    const list: Shiur[] = classes
      .filter((c: any) => !c.parent_class_id)
      .map((c: any) => {
        const s = syn.get(c.synagogue_id);
        return {
          id: c.id,
          title: c.title ?? '',
          topic: c.topic ?? '',
          instructor: c.instructor ?? '',
          days: (c.days_of_week?.length ? c.days_of_week : [c.day_of_week])
            .filter(Boolean)
            .map((d: string) => (d === 'Saturday' ? 'Shabbat' : d)),
          time: c.time ?? '',
          duration: c.duration ?? '',
          language: c.language ?? '',
          gender: c.gender ?? '',
          location: c.location ?? '',
          description: c.description ?? '',
          flyerUrl: c.flyer_url ?? null,
          biweekly: c.recurrence_rule === 'BIWEEKLY',
          synagogue: s ? { id: s.id, name: s.name, nameHe: s.name_he || s.name, address: s.address ?? '' } : null,
        };
      })
      .sort((a: Shiur, b: Shiur) => a.time.localeCompare(b.time));
    try { await AsyncStorage.setItem(CACHE, JSON.stringify(list)); } catch {}
    return { list, offline: false };
  } catch (e) {
    const saved = await AsyncStorage.getItem(CACHE).catch(() => null);
    if (saved) return { list: JSON.parse(saved), offline: true };
    throw e;
  }
}

const HE: Record<string, string> = {
  Hebrew: 'עברית', German: 'גרמנית', English: 'אנגלית', Russian: 'רוסית', Yiddish: 'יידיש',
  Men: 'גברים', Women: 'נשים', Mixed: 'מעורב', Youth: 'נוער',
  'Torah Study': 'לימוד תורה', Talmud: 'גמרא', Chassidut: 'חסידות', 'Youth Program': 'תוכנית נוער',
  Parasha: 'פרשת השבוע', Halacha: 'הלכה', "Women's Circle": 'חוג נשים', Mussar: 'מוסר',
};
export const heLabel = (s: string) => HE[s] ?? s;
