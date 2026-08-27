// Powered by OnSpace.AI
// Turns a flat list of siddur blocks into render items, folding passages that
// are NOT part of the everyday solo (b'yachid) prayer into collapsible groups
// (Kaddish, Ya'aleh Veyavo, Al HaNisim, Kedusha, Barchu, Aseret Yemei Teshuva
// additions, Nachem, Aneinu…). The user taps a green header to open them.
//
// SAFETY: sacred text must never be hidden by mistake. Each group is folded only
// when it is CLEANLY bounded — an explicit end-anchor, or a heading very close by.
// Otherwise we fold ONLY the single start block. Worst case we fold LESS than
// intended (a passage stays visible) — never more. Big, coarsely-delimited
// sections are intentionally left expanded rather than risk hiding real text.

export interface SBlock {
  k: 'h' | 'i' | 't';
  t: string;
}

export type RenderItem =
  | { kind: 'heading'; block: SBlock }
  | { kind: 'block'; block: SBlock }
  | { kind: 'group'; id: string; title: string; blocks: SBlock[] };

// Normalize Hebrew for matching: drop nikud+cantillation (U+0591–U+05C7),
// bracketed rubrics, punctuation and extra spaces → consonants only.
function norm(s: string): string {
  return s
    .replace(/[֑-ׇ]/g, '')
    .replace(/[()[\]{}"'.,:;|\-–־׃׀]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function includesAny(hayNorm: string, needles: string[]): boolean {
  return needles.some((n) => hayNorm.includes(n));
}

interface InlineGroup {
  id: string;
  title: string;
  start: string[];
  end?: string[];
  single?: boolean; // fold exactly the one start block (self-contained passage)
  span?: number;    // how far to scan for the end-anchor (default MAXFOLD/END_NEAR)
}

// Order matters — the first matching start wins and consumes its range.
const INLINE_GROUPS: InlineGroup[] = [
  { id: 'chatzi-kaddish', title: 'חצי קדיש', start: ['אומר החזן חצי קדיש', 'אומר החזן קדיש'], end: ['ברכו את', 'קש וברכותיה', 'יוצר אור', 'המעריב ערבים'] },
  { id: 'barchu', title: 'ברכו', start: ['ברכו את יהוה המברך', 'ברכו את יהוה'], end: ['יוצר אור', 'המעריב ערבים', 'קש וברכותיה'] },
  { id: 'kaddish', title: 'קדיש', start: ['יתגדל ויתקדש שמה רבא'], single: true },
  { id: 'ata-chonantanu', title: 'אתה חוננתנו (מוצ"ש)', start: ['במוצאי שבת ויום טוב מוסיפים אתה חוננתנו', 'אתה חוננתנו יהוה אלהינו', 'אתה חוננתנו'], end: ['חננו מאתך', 'חכמה בינה ודעת מאתך'] },
  // Long tachanun added only on Monday & Thursday, up to the kaddish that follows.
  { id: 'tachanun-monthu', title: 'תחנון לשני וחמישי', start: ['בימי שני וחמישי מוסיפים', 'בימים שני וחמישי מוסיפים'], end: ['יתגדל ויתקדש שמה רבא'], span: 24 },
  { id: 'kedusha', title: 'קדושה (נקדישך)', start: ['נקדישך ונעריצך', 'נקדש את שמך', 'כתר יתנו לך', 'נקדישך ונקדישך'], end: ['לדור ודור', 'אתה קדוש ושמך קדוש', 'לדר ודר'] },
  { id: 'yaaleh-veyavo', title: 'יעלה ויבוא', start: ['בראש חדש ובחול המועד מוסיפים', 'אלהינו ואלהי אבותינו יעלה ויב', 'יעלה ויבא'], end: ['ואתה ברחמיך', 'ותחזינה עינינו'] },
  // Al HaNisim runs from "ועל הנסים" through בימי מתתיהו (Chanukah) and בימי מרדכי
  // (Purim) up to "ועל כולם" — a long span in the Chabad text, hence span: 18.
  { id: 'al-hanisim', title: 'על הניסים', start: ['ועל הנסים ועל הפרקן', 'על הנסים ועל הפרקן', 'ועל הנסים'], end: ['ועל כלם', 'ועל כולם', 'וכל החיים יודוך'], span: 18 },
  { id: 'birkat-kohanim', title: 'ברכת כהנים', start: ['אלהינו ואלהי אבותינו ברכנו בברכה המשלשת', 'ברכנו בברכה המשלשת בתורה'], end: ['שים שלום', 'שלום רב'] },
  { id: 'nachem', title: 'נחם (ט"ב)', start: ['נחם יהוה אלהינו את אבלי ציון', 'בתשעה באב מוסיפים נחם', 'תשעה באב מוסיפים נחם'], end: ['בונה ירושלים', 'מנחם ציון'] },
  { id: 'aneinu', title: 'עננו (תענית)', start: ['עננו אבינו עננו', 'עננו יהוה עננו', 'עננו יהוה אלהינו', 'עננו בורא עולם', 'ענינו בורא עולם'], end: ['כי אתה שומע', 'העונה בעת צרה', 'רפאנו יהוה'] },
  { id: 'zochreinu', title: 'זכרנו לחיים (עשי"ת)', start: ['זכרנו לחיים מלך חפץ בחיים'], single: true },
  { id: 'mi-chamocha', title: 'מי כמוך (עשי"ת)', start: ['מי כמוך אב הרחמים'], single: true },
  { id: 'uchtov', title: 'וכתוב לחיים (עשי"ת)', start: ['וכתוב לחיים טובים'], single: true },
  { id: 'bsefer', title: 'בספר חיים (עשי"ת)', start: ['בספר חיים ברכה ושלום'], single: true },
];

const MAXFOLD = 10; // never fold more than this many blocks under one label
const HEAD_NEAR = 4; // a heading may close a fold only if it is this close
const END_NEAR = 8; // an end-anchor may close a fold only if it is this close

// Whole SECTIONS (a heading + its body up to a clean boundary) that fold under
// their own heading. Only a small allowlist — a heading here folds only when a
// clean end-anchor or the next heading is found within maxFold; otherwise the
// heading renders normally (never fold an unbounded span).
interface HeadingGroup {
  match: string;
  end: string[];
  maxFold: number;
}
const HEADING_GROUPS: HeadingGroup[] = [
  // Said only with a minyan (chazan's repetition):
  { match: 'מודים דרבנן', end: [], maxFold: 8 },
  { match: 'ברכת כהנים', end: ['שים שלום', 'שלום רב', 'שלום עליך'], maxFold: 20 },
  // Said only on certain days:
  { match: 'על הניסים', end: ['ועל כלם', 'ועל כולם', 'וכל החיים יודוך'], maxFold: 20 }, // חנוכה/פורים
  { match: 'אבינו מלכנו', end: [], maxFold: 44 },                                        // תעניות / עשי"ת
  { match: 'ספר תורה', end: [], maxFold: 28 },                                           // שני וחמישי בלבד
  { match: 'במוצאי שבת', end: [], maxFold: 28 },                                         // מוצאי שבת בלבד
];

function matchInlineStart(t: string): InlineGroup | null {
  const n = norm(t);
  for (const g of INLINE_GROUPS) if (includesAny(n, g.start)) return g;
  return null;
}

export function buildRenderItems(blocks: SBlock[]): RenderItem[] {
  const items: RenderItem[] = [];
  let i = 0;
  const N = blocks.length;
  while (i < N) {
    const b = blocks[i];

    if (b.k === 'h') {
      const hn = norm(b.t);
      const hg = HEADING_GROUPS.find((g) => hn.includes(norm(g.match)));
      if (hg) {
        let j = i + 1;
        let endHit = -1;
        let headHit = -1;
        while (j < N && j - i <= hg.maxFold) {
          const nb = blocks[j];
          if (nb.k === 'h') { headHit = j; break; }
          if (includesAny(norm(nb.t), hg.end)) { endHit = j; break; }
          j++;
        }
        let foldEnd = -1; // exclusive
        if (endHit >= 0) foldEnd = endHit;
        else if (headHit >= 0) foldEnd = headHit;
        if (foldEnd > i + 1) {
          items.push({ kind: 'group', id: `hg-${i}`, title: b.t, blocks: blocks.slice(i, foldEnd) });
          i = foldEnd;
          continue;
        }
        // no clean boundary → render the heading normally (never fold unbounded)
      }
      items.push({ kind: 'heading', block: b });
      i++;
      continue;
    }

    const g = matchInlineStart(b.t);
    if (g) {
      if (g.single || !g.end) {
        items.push({ kind: 'group', id: `${g.id}-${i}`, title: g.title, blocks: [b] });
        i++;
        continue;
      }
      // Scan forward for a clean boundary.
      const cap = g.span ?? MAXFOLD;
      const near = g.span ?? END_NEAR;
      let j = i + 1;
      let endHit = -1;
      let headHit = -1;
      while (j < N && j - i <= cap) {
        const nb = blocks[j];
        if (nb.k === 'h') { headHit = j; break; }
        if (includesAny(norm(nb.t), g.end)) { endHit = j; break; }
        j++;
      }
      let foldEnd = -1; // exclusive
      if (endHit >= 0 && endHit - i <= near) foldEnd = endHit;
      else if (headHit >= 0 && headHit - i <= HEAD_NEAR) foldEnd = headHit;

      if (foldEnd >= 0) {
        items.push({ kind: 'group', id: `${g.id}-${i}`, title: g.title, blocks: blocks.slice(i, foldEnd) });
        i = foldEnd;
      } else {
        // no clean boundary → fail-safe: fold only the start block
        items.push({ kind: 'group', id: `${g.id}-${i}`, title: g.title, blocks: [b] });
        i++;
      }
      continue;
    }

    items.push({ kind: 'block', block: b });
    i++;
  }
  return items;
}
