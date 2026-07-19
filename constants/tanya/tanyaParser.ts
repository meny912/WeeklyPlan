import type { TanyaEntry } from './types';

/**
 * Parses raw Tanya text containing date markers of the form:
 *   <i data-overlay="Vilna Pages" data-value="[מ: יט כסלו]"></i>
 *
 * Groups content by the מניין (מ:) edition dates.
 * No dates are generated or modified — only the existing markers are used.
 *
 * @param rawText - The full Tanya Hebrew text with embedded date markers
 * @returns Array of TanyaEntry, one per date found in the text
 */
export function parseTanyaByDate(rawText: string): TanyaEntry[] {
  // Match מניין (מ:) date markers only
  const dateMarkerRegex =
    /<i[^>]*data-value="\[מ:\s*([^\]]+)\]"[^>]*><\/i>/g;

  const entries: TanyaEntry[] = [];
  let lastIndex = 0;
  let lastDate: { full: string; day: string; month: string } | null = null;
  let lastMatchEnd = 0;

  let match: RegExpExecArray | null;

  while ((match = dateMarkerRegex.exec(rawText)) !== null) {
    const rawDateStr = match[1].trim(); // e.g. "יט כסלו"
    const parts = rawDateStr.split(/\s+/);
    const day = parts[0] ?? '';
    const month = parts.slice(1).join(' ');

    // Save content from the previous date up to this marker
    if (lastDate !== null) {
      const content = rawText
        .slice(lastMatchEnd, match.index)
        .replace(/<i[^>]*data-value="\[פ:[^\]]+\]"[^>]*><\/i>/g, '') // remove פ: markers
        .trim();

      entries.push({
        date: lastDate.full,
        day: lastDate.day,
        month: lastDate.month,
        content,
      });
    }

    lastDate = { full: rawDateStr, day, month };
    lastMatchEnd = match.index + match[0].length;
    lastIndex = match.index;
  }

  // Push the final entry (text after the last date marker)
  if (lastDate !== null) {
    const content = rawText
      .slice(lastMatchEnd)
      .replace(/<i[^>]*data-value="\[פ:[^\]]+\]"[^>]*><\/i>/g, '')
      .trim();

    if (content.length > 0) {
      entries.push({
        date: lastDate.full,
        day: lastDate.day,
        month: lastDate.month,
        content,
      });
    }
  }

  return entries;
}

/**
 * Looks up a specific date's entry.
 * @param entries - parsed array from parseTanyaByDate()
 * @param day - Hebrew day, e.g. "יט"
 * @param month - Hebrew month, e.g. "כסלו"
 */
export function findEntryByDate(
  entries: TanyaEntry[],
  day: string,
  month: string
): TanyaEntry | undefined {
  return entries.find((e) => e.day === day && e.month === month);
}
