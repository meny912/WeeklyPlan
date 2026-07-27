// Powered by OnSpace.AI
// Data model for the conditional (date-aware) siddur.
// A tefillah is an ordered list of Blocks. Each block carries a `cond` that the
// luach resolver evaluates against today's Hebrew-date context to decide whether
// the block is shown.

/**
 * Display conditions. Evaluated by services/luachContext.ts -> blockVisible().
 * NOTE: tags marked "// VERIFY" below were inferred (the source docx did not mark
 * them explicitly) and should be confirmed against a printed siddur / a rav.
 */
export type Condition =
  | 'always'
  | 'tachanun'          // days Tachanun IS said
  | 'noTachanun'        // days Tachanun is NOT said (say "יהי שם" instead of nefilat apayim)
  | 'mondayThursday'    // Torah reading + long tachanun additions (Mon & Thu)  // VERIFY split
  | 'geshem'            // "משיב הרוח ומוריד הגשם" period: Shmini Atzeret → Pesach
  | 'tal'               // "מוריד הטל" period: Pesach → Shmini Atzeret
  | 'barechAleinu'      // winter birkat-hashanim ("ברך עלינו…ותן טל ומטר"): Dec 4/5 (chu"l) → Pesach
  | 'barchenu'          // summer birkat-hashanim ("ברכנו…ותן ברכה"): Pesach → Dec 4/5
  | 'fastGedaliaAsara'  // Tzom Gedalia & Asara b'Tevet (extra psalm)
  | 'avelut';           // house of mourning (manual toggle, not date-derived)

export type BlockKind = 'sectionTitle' | 'heading' | 'instruction' | 'text';

export interface Block {
  id: string;
  kind: BlockKind;
  he: string;           // Hebrew content (with nikud where present in the source)
  cond?: Condition;     // default 'always'
  /** For "shir shel yom": 0=Sunday … 6=Shabbat. Block shown only if today matches. */
  weekday?: number;
  /** true = this conditional tag was inferred, not explicit in the source. */
  verify?: boolean;
  note?: string;        // editorial note (shown to devs, not to users)
}

export interface Tefillah {
  id: string;
  title: string;
  nusach: string;
  blocks: Block[];
}
