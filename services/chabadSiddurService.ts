// Powered by OnSpace.AI
// Fetches Chabad-siddur text from Sefaria for a given category (constants/siddur/chabadSiddur).
// Same approach as the Tanya/Rambam paths: fetch the Hebrew `he` field, strip HTML,
// cache per-ref in AsyncStorage.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SiddurCategory } from '@/constants/siddur/chabadSiddur';

export interface SiddurSection {
  heading: string;
  lines: string[];
}

const CACHE_PREFIX = 'chabad_siddur_v1_';
const CACHE_TTL = 1000 * 60 * 60 * 24 * 30; // 30 days

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x2F;/g, '/')
    .replace(/\s+/g, ' ')
    .trim();
}

function flatten(he: any): string[] {
  if (!he) return [];
  if (Array.isArray(he)) {
    // may be nested arrays
    return (he as any[]).flat(Infinity).filter((t) => typeof t === 'string');
  }
  return typeof he === 'string' ? [he] : [];
}

async function fetchRefLines(ref: string): Promise<string[]> {
  const key = CACHE_PREFIX + ref.replace(/[\s,;']/g, '_');
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.ts < CACHE_TTL) return parsed.lines as string[];
    }
  } catch {}

  const encoded = encodeURIComponent(ref.replace(/ /g, '_'));
  const url = `https://www.sefaria.org/api/texts/${encoded}?context=0&commentary=0&stripItags=1`;
  const resp = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!resp.ok) throw new Error(`Sefaria ${resp.status}: ${ref}`);
  const data = await resp.json();

  const lines = flatten(data.he)
    .map(stripHtml)
    .filter((t) => t.length > 0);

  if (lines.length > 0) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify({ lines, ts: Date.now() }));
    } catch {}
  }
  return lines;
}

/** Fetch all sections of a category, in order. Sections that fail are skipped. */
export async function fetchCategory(category: SiddurCategory): Promise<SiddurSection[]> {
  const out: SiddurSection[] = [];
  for (const sec of category.sections) {
    try {
      const lines = await fetchRefLines(sec.ref);
      if (lines.length > 0) out.push({ heading: sec.heading, lines });
    } catch {
      // skip a failed section rather than failing the whole prayer
    }
  }
  return out;
}
