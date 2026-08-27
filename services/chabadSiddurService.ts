// Powered by OnSpace.AI
// Chabad-siddur text — now served fully OFFLINE from a bundled local module
// (constants/siddur/chabadSiddurData). No network. The text was pre-fetched from
// Sefaria's "Weekday Siddur Chabad" and cleaned; see that file's header.
import CHABAD_TEXT from '@/constants/siddur/chabadSiddurData';
import type { SiddurCategory } from '@/constants/siddur/chabadSiddur';

export interface SiddurSection {
  heading: string;
  lines: string[];
}

/** All sections of a category, in order, from the bundled local text. */
export async function fetchCategory(category: SiddurCategory): Promise<SiddurSection[]> {
  const out: SiddurSection[] = [];
  for (const sec of category.sections) {
    const lines = CHABAD_TEXT[sec.ref] ?? [];
    if (lines.length > 0) out.push({ heading: sec.heading, lines });
  }
  return out;
}
