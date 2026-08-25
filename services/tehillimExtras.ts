// Powered by OnSpace.AI
// Extra Tehillim schedules: the Chabad "3 chapters a day in Elul" custom (date-aware),
// and the user's own personal chapters (stored on device).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HDate, months } from '@hebcal/core';

/**
 * Chabad custom: from Rosh Chodesh Elul, say 3 chapters of Tehillim each day in order.
 * Day N of Elul → chapters (3N-2, 3N-1, 3N). (Elul 1 → 1-3 … Elul 29 → 85-87.)
 * Auto-updates every day via the device's Hebrew date. Returns null outside Elul.
 */
export function getElulTehillim(date: Date = new Date()): number[] | null {
  try {
    const h = new HDate(date);
    if (h.getMonth() !== months.ELUL) return null;
    const d = h.getDate();
    const base = (d - 1) * 3;
    return [base + 1, base + 2, base + 3].filter((n) => n >= 1 && n <= 150);
  } catch {
    return null;
  }
}

const PERSONAL_KEY = 'tehillim_personal_v1';

/** Chapters the user chose to add to their daily Tehillim. */
export async function getPersonalTehillim(): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(PERSONAL_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? (arr as number[]) : [];
  } catch {
    return [];
  }
}

/** Replace the personal-chapter list (deduped, in range, sorted). */
export async function savePersonalTehillim(chapters: number[]): Promise<number[]> {
  const clean = [...new Set(chapters.filter((n) => Number.isInteger(n) && n >= 1 && n <= 150))].sort(
    (a, b) => a - b,
  );
  try {
    await AsyncStorage.setItem(PERSONAL_KEY, JSON.stringify(clean));
  } catch {}
  return clean;
}
