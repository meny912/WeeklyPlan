// Powered by OnSpace.AI
// Chabad (Nusach Ari) siddur — category catalog.
// Text is pulled on demand from Sefaria's "Weekday Siddur Chabad" (all refs below
// were validated against the Sefaria API). Kept separate from the Sephardic
// date-aware Shacharit (app/shacharit.tsx) — the user chose to keep both nuschaot.

export type SiddurTime = 'morning' | 'afternoon' | 'evening';

// Date-aware visibility tags, resolved against services/luachContext.ts.
// 'always' categories are shown every day; the rest appear only when relevant.
export type SiddurTag =
  | 'always'
  | 'roshChodesh'
  | 'cholHamoed'
  | 'omer'
  | 'chanukah'
  | 'purim'
  | 'fast';

export interface SiddurSectionRef {
  ref: string;      // Sefaria ref (fetched via chabadSiddurService)
  heading: string;  // Hebrew sub-heading shown above the section
}

export interface SiddurCategory {
  id: string;
  title: string;         // Hebrew
  subtitle?: string;
  icon: string;          // MaterialIcons name
  time?: SiddurTime;     // if set, this is the "prayer of the hour" for that slot
  tags: SiddurTag[];     // shown when any tag is active (or 'always')
  sections: SiddurSectionRef[];
}

const S = 'Weekday Siddur Chabad';

export const CHABAD_SIDDUR: SiddurCategory[] = [
  // ── The three daily prayers (always; the hour picks the default) ──
  {
    id: 'shacharit',
    title: 'שחרית',
    subtitle: 'תפילת הבוקר',
    icon: 'wb-sunny',
    time: 'morning',
    tags: ['always'],
    sections: [
      { ref: `${S}, Shacharit, Upon Arising`, heading: 'השכמת הבוקר' },
      { ref: `${S}, Shacharit, Morning Blessings`, heading: 'ברכות השחר' },
      { ref: `${S}, Shacharit, Tzitzit and Tallit`, heading: 'ציצית וטלית גדול' },
      { ref: `${S}, Shacharit, Tefillin`, heading: 'תפילין' },
      { ref: `${S}, Shacharit, Morning Prayer`, heading: 'תפילת השחר' },
      { ref: `${S}, Shacharit, Hodu`, heading: 'הודו' },
      { ref: `${S}, Shacharit, Pesukei Dezimra`, heading: 'פסוקי דזמרה' },
      { ref: `${S}, Shacharit, Blessings of the Shema`, heading: 'ברכות קריאת שמע' },
      { ref: `${S}, Shacharit, The Amidah`, heading: 'עמידה' },
      { ref: `${S}, Shacharit, Tachnun`, heading: 'תחנון' },
      { ref: `${S}, Shacharit, Torah Reading`, heading: 'קריאת התורה' },
      { ref: `${S}, Shacharit, Ashrei Uva LeZion`, heading: 'אשרי ובא לציון' },
      { ref: `${S}, Shacharit, Song of the Day`, heading: 'שיר של יום' },
      { ref: `${S}, Shacharit, Aleinu`, heading: 'עלינו' },
      { ref: `${S}, Shacharit, Six Remembrances`, heading: 'שש זכירות' },
    ],
  },
  {
    id: 'mincha',
    title: 'מנחה',
    subtitle: 'תפילת הצהריים',
    icon: 'wb-twilight',
    time: 'afternoon',
    tags: ['always'],
    sections: [
      { ref: `${S}, Mincha, Korbanot`, heading: 'קרבנות' },
      { ref: `${S}, Mincha, Ashrei`, heading: 'אשרי' },
      { ref: `${S}, Mincha, Amidah`, heading: 'עמידה' },
      { ref: `${S}, Mincha, Tachanun`, heading: 'תחנון' },
      { ref: `${S}, Mincha, Aleinu`, heading: 'עלינו' },
    ],
  },
  {
    id: 'maariv',
    title: 'ערבית',
    subtitle: 'תפילת הערב',
    icon: 'nightlight-round',
    time: 'evening',
    tags: ['always'],
    sections: [{ ref: `${S}, Maariv`, heading: 'ערבית' }],
  },

  // ── Practical / everyday & travel (always) ──
  {
    id: 'travelers',
    title: 'תפילת הדרך',
    subtitle: 'לנסיעות',
    icon: 'directions-car',
    tags: ['always'],
    sections: [{ ref: `${S}, Blessings, The Travelers' Prayer`, heading: 'תפילת הדרך' }],
  },
  {
    id: 'blessings',
    title: 'ברכות הנהנין',
    subtitle: 'ברכות על מאכלים ועוד',
    icon: 'restaurant',
    tags: ['always'],
    sections: [{ ref: `${S}, Blessings, Various Blessings`, heading: 'סדר הברכות' }],
  },
  {
    id: 'birkat',
    title: 'ברכת המזון',
    icon: 'bakery-dining',
    tags: ['always'],
    sections: [
      { ref: `${S}, Blessings, Birkat HaMazon`, heading: 'ברכת המזון' },
      { ref: `${S}, Blessings, Berakha Acharona`, heading: 'ברכה אחרונה (מעין שלוש)' },
    ],
  },
  {
    id: 'bedtime',
    title: 'קריאת שמע שעל המיטה',
    icon: 'bedtime',
    tags: ['always'],
    sections: [{ ref: `${S}, Bedtime Shema`, heading: 'קריאת שמע שעל המיטה' }],
  },
  {
    id: 'kiddushLevana',
    title: 'קידוש לבנה',
    icon: 'brightness-2',
    tags: ['always'],
    sections: [{ ref: `${S}, Kiddush Levanah`, heading: 'סדר קידוש לבנה' }],
  },

  // ── Date-aware (shown only when relevant to today) ──
  {
    id: 'hallel',
    title: 'הלל',
    subtitle: 'ראש חודש · חול המועד · חנוכה',
    icon: 'celebration',
    tags: ['roshChodesh', 'cholHamoed', 'chanukah'],
    sections: [{ ref: `${S}, Hallel`, heading: 'סדר הלל' }],
  },
  {
    id: 'roshChodesh',
    title: 'ראש חודש',
    subtitle: 'יעלה ויבוא',
    icon: 'brightness-3',
    tags: ['roshChodesh'],
    sections: [{ ref: `${S}, Rosh Chodesh`, heading: 'ראש חודש' }],
  },
  {
    id: 'omer',
    title: 'ספירת העומר',
    icon: 'grain',
    tags: ['omer'],
    sections: [{ ref: `${S}, Sefirat HaOmer`, heading: 'סדר ספירת העומר' }],
  },
  {
    id: 'chanukah',
    title: 'חנוכה',
    subtitle: 'הדלקת נרות ועל הניסים',
    icon: 'local-fire-department',
    tags: ['chanukah'],
    sections: [{ ref: `${S}, Chanukah`, heading: 'סדר הדלקת נר חנוכה' }],
  },
  {
    id: 'purim',
    title: 'פורים',
    subtitle: 'על הניסים',
    icon: 'theater-comedy',
    tags: ['purim'],
    sections: [{ ref: `${S}, Purim`, heading: 'פורים' }],
  },
];

/** The category that is the "prayer of the hour" for the current time of day. */
export function currentTefillahId(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'shacharit';      // morning
  if (h < 17) return 'mincha';         // afternoon (≈ until late afternoon)
  return 'maariv';                     // evening
}
