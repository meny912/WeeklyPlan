// Powered by OnSpace.AI
// Offline Tanya stub — returns null so sefariaService falls through to the
// tanyaScheduleService (which has the full 365-day schedule + Sefaria fetch).
import type { BookContent } from '@/services/sefariaService';

/**
 * Attempt to serve Tanya content from a local bundle.
 * Currently returns null (no bundled text), causing the caller to fall back
 * to the network path via tanyaScheduleService / Sefaria.
 */
export function getLocalTanya(_date: Date): BookContent | null {
  return null;
}
