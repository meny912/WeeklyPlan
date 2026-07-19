// Powered by OnSpace.AI
import { HDate, Sedra } from '@hebcal/core';
import { getTehillimChaptersForDay, getRambam3ChaptersForDay, getTanyaPortionForDay } from '@/services/sefariaService';
import { hebrewDayToGematria, hebrewMonthDisplay } from '@/services/hebrewCalendarService';

export interface LearningItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
}

// Chumash: day of week → aliyah
function getChumashForDay(hdate: HDate): { parasha: string; aliya: string } {
  const dayOfWeek = hdate.getDay(); // 0=Sun, 6=Sat
  const aliyaNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שביעי'];
  const aliyaIdx = dayOfWeek === 6 ? 6 : dayOfWeek;
  try {
    const sedra = new Sedra(hdate.getFullYear(), false);
    const result = sedra.lookup(hdate);
    if (result && !result.chag) {
      const parsha = Array.isArray(result.parsha) ? result.parsha.join(' – ') : String(result.parsha);
      return { parasha: `פרשת ${parsha}`, aliya: `עליה ${aliyaNames[aliyaIdx] ?? 'ראשון'}` };
    }
  } catch {}
  return { parasha: 'חומש – פרשת השבוע', aliya: `עליה ${aliyaNames[aliyaIdx] ?? 'ראשון'}` };
}

export function getDailyLearning(date: Date = new Date()): LearningItem[] {
  const hdate = new HDate(date);
  const items: LearningItem[] = [];

  // 1. Hayom Yom
  const dayHe = hebrewDayToGematria(hdate.getDate());
  const monthHe = hebrewMonthDisplay(hdate.getMonth());
  items.push({
    id: 'hayomyom',
    title: 'היום יום',
    subtitle: `${dayHe} ${monthHe}`,
    description: 'לקוטי דברים – הרבי מליובאוויטש',
    icon: '✨',
    color: '#E8A838',
  });

  // 2. Tehillim — by Hebrew day of month
  {
    const chapters = getTehillimChaptersForDay(hdate.getDate());
    const first = chapters[0];
    const last = chapters[chapters.length - 1];
    const subtitle = first === last ? `פרק ${first}` : `פרקים ${first}–${last}`;
    items.push({
      id: 'tehillim',
      title: 'תהלים יומי',
      subtitle,
      description: 'פרקי תהלים על פי לוח החודש',
      icon: '📜',
      color: '#9B7FCC',
    });
  }

  // 3. Chumash — parasha + aliyah by day of week
  try {
    const { parasha, aliya } = getChumashForDay(hdate);
    items.push({
      id: 'chumash',
      title: 'חומש יומי',
      subtitle: `${parasha} – ${aliya}`,
      description: 'חיתת – חומש יומי עם רש״י',
      icon: '📕',
      color: '#F5A623',
    });
  } catch {
    items.push({
      id: 'chumash',
      title: 'חומש יומי',
      subtitle: 'פרשת השבוע',
      description: 'חיתת – חומש יומי',
      icon: '📕',
      color: '#F5A623',
    });
  }

  // 4. Tanya — by Hebrew calendar date (month+day mapping)
  try {
    const portion = getTanyaPortionForDay(date);
    items.push({
      id: 'tanya',
      title: 'תניא יומי',
      subtitle: portion.titleHe,
      description: 'ספר של בינוניים – אדמו״ר הזקן',
      icon: '📗',
      color: '#4CAF8A',
    });
  } catch {
    items.push({
      id: 'tanya',
      title: 'תניא יומי',
      subtitle: 'ספר של בינוניים',
      description: 'ספר של בינוניים – אדמו״ר הזקן',
      icon: '📗',
      color: '#4CAF8A',
    });
  }

  // 5. Rambam — show subtitle from epoch calc (Hebcal will load correct content)
  try {
    const chapters = getRambam3ChaptersForDay(date);
    const subtitle = chapters.length > 0
      ? chapters.map(c => `${c.bookNameHe} פ׳${c.chapter}`).join(' | ')
      : '3 פרקים ליום';
    items.push({
      id: 'rambam',
      title: 'רמב״ם יומי',
      subtitle,
      description: 'משנה תורה – מסלול 3 פרקים ליום',
      icon: '📘',
      color: '#5BAFD6',
    });
  } catch {
    items.push({
      id: 'rambam',
      title: 'רמב״ם יומי',
      subtitle: '3 פרקים ליום',
      description: 'משנה תורה – מסלול 3 פרקים ליום',
      icon: '📘',
      color: '#5BAFD6',
    });
  }

  return items;
}
