// Powered by OnSpace.AI
// Tehillim extras: Elul daily portion + personal chapter list (persisted).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HDate, months } from '@hebcal/core';

const PERSONAL_KEY = 'tehillim_personal_chapters_v1';

/**
 * Returns the Tehillim chapters for today's Elul Chabad schedule
 * (3 chapters/day for the first 29 days, 36 chapters on the 30th).
 * Returns null if today is not in Elul.
 */
export function getElulTehillim(date: Date = new Date()): number[] | null {
  try {
    const hdate = new HDate(date);
    if (hdate.getMonth() !== months.ELUL) return null;
    const day = hdate.getDate(); // 1..29/30
    // Chabad custom: 3 psalms/day for days 1-29, last day gets the remainder.
    // 29 days × 3 = 87 chapters (1-87). Day 30 = chapters 88-150 (Rosh Hashana eve).
    if (day <= 29) {
      const start = (day - 1) * 3 + 1;
      return [start, start + 1, start + 2];
    }
    // Day 30 (or last day when month is 29 days → handled below): 88-150
    const start = 88;
    const end = 150;
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  } catch {
    return null;
  }
}

/** Load the user's personal list of Tehillim chapter numbers from storage. */
export async function getPersonalTehillim(): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(PERSONAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((n: unknown) => typeof n === 'number' && n >= 1 && n <= 150);
  } catch {
    return [];
  }
}

/** Save the user's personal list. Returns the saved (validated) list. */
export async function savePersonalTehillim(chapters: number[]): Promise<number[]> {
  const valid = [...new Set(chapters.filter((n) => n >= 1 && n <= 150))].sort((a, b) => a - b);
  try {
    await AsyncStorage.setItem(PERSONAL_KEY, JSON.stringify(valid));
  } catch {}
  return valid;
}
