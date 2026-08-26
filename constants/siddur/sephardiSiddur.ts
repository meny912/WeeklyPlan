// Powered by OnSpace.AI
// Sephardic (נוסח ספרדים ועדות המזרח) siddur — local text, offline.
// Parsed from the user's siddur file; content in ./sephardiData.ts as ordered
// blocks: k = 'h' heading | 'i' instruction/rubric | 't' prayer text.
import DATA from './sephardiData';
import type { SiddurTime, SiddurTag } from './chabadSiddur';

export interface SiddurBlock {
  k: 'h' | 'i' | 't';
  t: string;
}

export interface SephardiCategory {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  time?: SiddurTime;
  tags: SiddurTag[];
}

const TEXT = DATA as Record<string, SiddurBlock[]>;

export function getSephardiCategory(id: string): SiddurBlock[] {
  return TEXT[id] ?? [];
}

export const SEPHARDI_SIDDUR: SephardiCategory[] = [
  { id: 'shacharit', title: 'שחרית', subtitle: 'תפילת הבוקר', icon: 'wb-sunny', time: 'morning', tags: ['always'] },
  { id: 'mincha', title: 'מנחה', subtitle: 'תפילת הצהריים', icon: 'wb-twilight', time: 'afternoon', tags: ['always'] },
  { id: 'maariv', title: 'ערבית', subtitle: 'תפילת הערב', icon: 'nightlight-round', time: 'evening', tags: ['always'] },
  { id: 'travelers', title: 'תפילת הדרך', subtitle: 'לנסיעות', icon: 'directions-car', tags: ['always'] },
  { id: 'blessings', title: 'ברכות הנהנין', icon: 'restaurant', tags: ['always'] },
  { id: 'birkat', title: 'ברכת המזון', subtitle: 'וברכת מעין שלוש', icon: 'bakery-dining', tags: ['always'] },
  { id: 'bedtime', title: 'קריאת שמע שעל המיטה', icon: 'bedtime', tags: ['always'] },
  { id: 'kiddushLevana', title: 'ברכת הלבנה', subtitle: 'קידוש לבנה', icon: 'brightness-2', tags: ['always'] },
  // date-aware
  { id: 'hallel', title: 'הלל', subtitle: 'ר״ח · חוה״מ · חנוכה', icon: 'celebration', tags: ['roshChodesh', 'cholHamoed', 'chanukah'] },
  { id: 'roshChodesh', title: 'ראש חודש', icon: 'brightness-3', tags: ['roshChodesh'] },
  { id: 'omer', title: 'ספירת העומר', icon: 'grain', tags: ['omer'] },
  { id: 'chanukah', title: 'חנוכה', subtitle: 'הדלקת נרות ושחרית', icon: 'local-fire-department', tags: ['chanukah'] },
  { id: 'purim', title: 'פורים', subtitle: 'מגילה וסדר היום', icon: 'theater-comedy', tags: ['purim'] },
  { id: 'selichot', title: 'סליחות', subtitle: 'לימי צום', icon: 'volunteer-activism', tags: ['fast'] },
];

/** Category id of the prayer for the current hour. */
export function currentSephardiTefillah(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'shacharit';
  if (h < 17) return 'mincha';
  return 'maariv';
}
