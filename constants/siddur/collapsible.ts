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
    .replace(/[֑-ׇ]/g, '')       // nikud + cantillation
    .replace(/[׳״]/g, '')        // geresh / gershayim
    .replace(/יהוה/g, 'יי')       // unify the divine name (Chabad writes יי, Sephardi יהוה)
    .replace(/[()[\]{}"'.,:;|\-–־׃׀]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Space-insensitive match: the Chabad Sefaria text often joins words with no
// space ("ועלכלם", "וכלהחיים", "מיכמוך"), so compare with all spaces removed.
function includesAny(hayNorm: string, needles: string[]): boolean {
  const h = hayNorm.replace(/ /g, '');
  return needles.some((n) => h.includes(n.replace(/ /g, '')));
}

interface InlineGroup {
  id: string;
  title: string;
  start: string[];
  end?: string[];
  single?: boolean; // fold exactly the one start block (self-contained passage)
  span?: number;    // how far to scan for the end-anchor (default MAXFOLD/END_NEAR)
  maxLen?: number;  // for single folds: skip if the block is longer (avoids folding
                    // a long daily blessing that merely CONTAINS the anchor phrase)
}

// Order matters — the first matching start wins and consumes its range.
const INLINE_GROUPS: InlineGroup[] = [
  { id: 'barchu', title: 'ברכו', start: ['ברכו את יהוה המברך', 'ברכו את יהוה'], end: ['יוצר אור', 'המעריב ערבים', 'קש וברכותיה'] },
  { id: 'kaddish', title: 'קדיש', start: ['יתגדל ויתקדש שמה רבא'], single: true },
  { id: 'ata-chonantanu', title: 'אתה חוננתנו (מוצ"ש)', start: ['במוצאי שבת ויום טוב מוסיפים אתה חוננתנו', 'במוצאי שבת ויום טוב אומרים', 'אתה חוננתנו יי אלהינו', 'אתה חוננתנו למדע', 'אתה חוננתנו'], end: ['חננו מאתך', 'חכמה בינה ודעת מאתך', 'אתה חונן לאדם דעת'] },
  // Long tachanun added only on Monday & Thursday, up to the kaddish that follows.
  { id: 'tachanun-monthu', title: 'תחנון לשני וחמישי', start: ['בימי שני וחמישי מוסיפים', 'בימים שני וחמישי מוסיפים'], end: ['יתגדל ויתקדש שמה רבא'], span: 24 },
  { id: 'kedusha', title: 'קדושה (נקדישך)', start: ['נקדישך ונעריצך', 'נקדש את שמך', 'כתר יתנו לך', 'נקדישך ונקדישך'], end: ['לדור ודור', 'אתה קדוש ושמך קדוש', 'לדר ודר'] },
  { id: 'yaaleh-veyavo', title: 'יעלה ויבוא', start: ['בראש חדש ובחול המועד מוסיפים', 'אלהינו ואלהי אבותינו יעלה ויב', 'יעלה ויבא'], end: ['ואתה ברחמיך', 'ותחזינה עינינו'] },
  // Al HaNisim runs from "ועל הנסים" through בימי מתתיהו (Chanukah) and בימי מרדכי
  // (Purim) up to "ועל כולם" — a long span in the Chabad text, hence span: 18.
  { id: 'al-hanisim', title: 'על הניסים', start: ['ועל הנסים ועל הפרקן', 'על הנסים ועל הפרקן'], end: ['ועל כלם', 'ועל כולם', 'וכל החיים יודוך'], span: 18 },
  { id: 'birkat-kohanim', title: 'ברכת כהנים', start: ['אלהינו ואלהי אבותינו ברכנו בברכה המשלשת', 'ברכנו בברכה המשלשת בתורה'], end: ['שים שלום', 'שלום רב'] },
  { id: 'nachem', title: 'נחם (ט"ב)', start: ['נחם יי אלהינו את אבלי ציון', 'נחם יי אלהינו', 'במנחת תשעה באב נחם', 'בתשעה באב מוסיפים נחם', 'תשעה באב מוסיפים נחם'], end: ['בונה ירושלים', 'מנחם ציון'] },
  { id: 'aneinu', title: 'עננו (תענית)', start: ['עננו אבינו עננו', 'עננו יי עננו', 'עננו יי אלהינו', 'עננו ביום צום', 'עננו בורא עולם', 'ענינו בורא עולם'], end: ['כי אתה שומע', 'העונה בעת צרה', 'רפאנו יי'] },
  // Aseret Yemei Teshuva insertions — short standalone lines; maxLen guards against
  // folding a long daily blessing that merely contains the phrase (e.g. Sephardi גבורות).
  { id: 'zochreinu', title: 'זכרנו לחיים (עשי"ת)', start: ['זכרנו לחיים מלך חפץ בחיים'], single: true, maxLen: 160 },
  { id: 'mi-chamocha', title: 'מי כמוך (עשי"ת)', start: ['מיכמוך אב הרחמן', 'מי כמוך אב הרחמן', 'מי כמוך אב הרחמים'], single: true, maxLen: 130 },
  { id: 'uchtov', title: 'וכתוב לחיים (עשי"ת)', start: ['וכתוב לחיים טובים'], single: true, maxLen: 160 },
  { id: 'bsefer', title: 'בספר חיים (עשי"ת)', start: ['בספר חיים ברכה ושלום', 'ובספר חיים ברכה ושלום'], single: true, maxLen: 220 },
  // Avinu Malkeinu inline (Chabad has no heading for it) — fasts / Aseret Yemei Teshuva.
  { id: 'avinu-malkeinu', title: 'אבינו מלכנו', start: ['בתענית ציבור ובעשית אומרים כאן אבינו מלכנו', 'אבינו מלכנו חטאנו לפניך', 'אבינו מלכנו אבינו אתה'], end: ['ואנחנו לא נדע', 'זכר רחמיך', 'תהלה לדוד'], span: 8 },
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

const AL_HANISIM_OPEN = ['ועל הנסים ועל הפרקן', 'על הנסים ועל הפרקן'];

function splitAlHanisim(blocks: SBlock[], i: number): { items: RenderItem[]; next: number } | null {
  // "על הניסים" heading and/or a short rubric line may come before the opening.
  const lead: RenderItem[] = [];
  while (i < blocks.length && lead.length < 2) {
    const n = norm(blocks[i].t);
    const isRubric = blocks[i].k === 'h' || (blocks[i].k === 'i' && !includesAny(n, ['בימי מתתיה', 'בימי מרדכי']));
    if (!isRubric || includesAny(n, AL_HANISIM_OPEN)) break;
    if (!includesAny(n, ['על הנסים', 'על הניסים'])) return null;
    if (blocks[i].k !== 'h') lead.push({ kind: 'block', block: blocks[i] }); // keep the instruction visible
    i++;
  }
  if (i >= blocks.length) return null;
  const open = blocks[i];
  if (open.k === 'h' || !includesAny(norm(open.t), AL_HANISIM_OPEN)) return null;
  // The opening block must not itself already contain a whole paragraph.
  if (includesAny(norm(open.t), ['בימי מתתיה', 'בימי מרדכי'])) return null;
  let chanukah = -1;
  let purim = -1;
  for (let j = i + 1; j < blocks.length && j <= i + 4; j++) {
    if (blocks[j].k === 'h') break;
    const n = norm(blocks[j].t);
    if (chanukah < 0 && includesAny(n, ['בימי מתתיה'])) chanukah = j;
    else if (purim < 0 && includesAny(n, ['בימי מרדכי'])) purim = j;
  }
  // Only split the clean, expected shape: opening → Chanukah → Purim, back to back.
  if (chanukah !== i + 1 || purim !== i + 2) return null;
  // Some texts mark the paragraphs as instructions ("(בחנוכה אומרים:) בימי…");
  // inside the box they are prayer text, so render them as such.
  const asText = (blk: SBlock): SBlock => (blk.k === 'i' ? { k: 't', t: blk.t } : blk);
  return {
    items: [
      ...lead,
      { kind: 'group', id: `al-hanisim-chanukah-${i}`, title: 'על הניסים לחנוכה', blocks: [open, asText(blocks[chanukah])] },
      { kind: 'group', id: `al-hanisim-purim-${i}`, title: 'על הניסים לפורים', blocks: [open, asText(blocks[purim])] },
    ],
    next: purim + 1,
  };
}

// Before Birkat HaMazon (Chabad): "ביום שאין אומרים בו תחנון:" + שיר המעלות בשוב.
function shirHamaalot(blocks: SBlock[], i: number): { items: RenderItem[]; next: number } | null {
  const b = blocks[i];
  const nb = blocks[i + 1];
  if (!nb || b.k === 'h' || nb.k === 'h') return null;
  if (!includesAny(norm(b.t), ['ביום שאין אומרים בו תחנון'])) return null;
  if (!includesAny(norm(nb.t), ['שיר המעלות בשוב'])) return null;
  const box = [b, nb];
  const korach = blocks[i + 2];
  if (korach && korach.k !== 'h' && includesAny(norm(korach.t), ['לבני קרח מזמור שיר'])) box.push(korach);
  return {
    items: [{ kind: 'group', id: `shir-hamaalot-${i}`, title: 'שיר המעלות – ביום שאין אומרים תחנון', blocks: box }],
    next: i + box.length,
  };
}

// Kaddish: keep every line of it in one box, from "יתגדל" through "עושה שלום".
const KADDISH_LINES = [
  'יתגדל ויתקדש', 'יהא שמה רבא', 'יתברך וישתבח', 'לעלא מן כל', 'דאמירן בעלמא',
  'תתקבל', 'יהא שלמא רבא', 'עשה שלום', 'עושה שלום', 'על ישראל ועל רבנן',
];
function kaddishBox(blocks: SBlock[], i: number): { items: RenderItem[]; next: number } | null {
  let start = i;
  // A short rubric right before it ("אומר החזן קדיש…") goes into the same box.
  const r = blocks[i];
  if (r.k === 'i' && norm(r.t).length < 120 && includesAny(norm(r.t), ['קדיש']) && blocks[i + 1]
      && includesAny(norm(blocks[i + 1].t), ['יתגדל ויתקדש שמה רבא'])) {
    i += 1;
  }
  const b = blocks[i];
  if (b.k === 'h' || !includesAny(norm(b.t), ['יתגדל ויתקדש שמה רבא'])) return null;
  let last = i;
  for (let j = i + 1; j < blocks.length && j <= i + 10; j++) {
    const nb = blocks[j];
    if (nb.k === 'h') break;
    const n = norm(nb.t);
    if (nb.k === 'i' && n.length < 80) continue;      // short rubric inside the Kaddish
    if (!includesAny(n, KADDISH_LINES)) break;
    last = j;
    if (includesAny(n, ['עשה שלום', 'עושה שלום'])) break; // the Kaddish's last line
  }
  const box = blocks.slice(start, last + 1);
  const has = (needle: string) => box.some((x) => includesAny(norm(x.t), [needle]));
  const title = has('על ישראל ועל רבנן') ? 'קדיש דרבנן'
    : has('תתקבל') ? 'קדיש תתקבל'
    : has('יהא שלמא רבא') ? 'קדיש יתום'
    : 'חצי קדיש';
  return { items: [{ kind: 'group', id: `kaddish-${start}`, title, blocks: box }], next: last + 1 };
}

export function buildRenderItems(blocks: SBlock[]): RenderItem[] {
  const items: RenderItem[] = [];
  let i = 0;
  const N = blocks.length;
  while (i < N) {
    const b = blocks[i];

    const special = splitAlHanisim(blocks, i) ?? shirHamaalot(blocks, i) ?? kaddishBox(blocks, i);
    if (special) {
      items.push(...special.items);
      i = special.next;
      continue;
    }

    if (b.k === 'h') {
      const hn = norm(b.t);
      const hg = HEADING_GROUPS.find((g) => includesAny(hn, [g.match]));
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
        // maxLen guard: a short insertion anchor must not fold a long daily blessing
        if (g.maxLen != null && norm(b.t).length > g.maxLen) {
          items.push({ kind: 'block', block: b });
          i++;
          continue;
        }
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
