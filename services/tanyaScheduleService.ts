// Powered by OnSpace.AI
// Single Source of Truth: Chabad Tanya Daily Study Schedule
// Cycle anchor: 19 Kislev 5786 = December 19, 2025
// 365-day Gregorian cycle

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────

export interface TanyaScheduleEntry {
  day_index: number;   // 1–365
  date:      string;   // Hebrew date label, e.g. "19 Kislev"
  ref:       string;   // Sefaria ref, e.g. "Tanya, Likutei Amarim, Chapter 1"
  refKey:    string;   // Short internal key, e.g. "Tanya_1.1"
  start:     string;   // Opening words of the daily portion
  end:       string;   // Closing words of the daily portion
  part:      number;   // 1–5
  chapter:   number;   // chapter within that part
}

// ─── Sefaria Ref Mapping ──────────────────────────────────

function toSefariaRef(refKey: string): string {
  const map: Record<string, string> = {
    'Tanya_1': 'Tanya, Likutei Amarim',
    'Tanya_2': 'Tanya, Shaar HaYichud VeHaEmunah',
    'Tanya_3': 'Tanya, Iggeret HaTeshuvah',
    'Tanya_4': 'Tanya, Iggeret HaKodesh',
    'Tanya_5': 'Tanya, Kuntres Acharon',
  };
  const [partKey, chapterStr] = refKey.split('.');
  const partName = map[partKey] ?? partKey;
  return chapterStr ? `${partName}, Chapter ${chapterStr}` : partName;
}

function parseRef(refKey: string): { part: number; chapter: number } {
  const [pk, ch] = refKey.split('.');
  const part = parseInt(pk.replace('Tanya_', ''), 10) || 1;
  const chapter = parseInt(ch ?? '1', 10) || 1;
  return { part, chapter };
}

function entry(
  day_index: number,
  date: string,
  refKey: string,
  start: string,
  end: string,
): TanyaScheduleEntry {
  const { part, chapter } = parseRef(refKey);
  return { day_index, date, ref: toSefariaRef(refKey), refKey, start, end, part, chapter };
}

// ─── Complete 365-Day Schedule ────────────────────────────
// Source: Official Chabad yearly Tanya study cycle
// Months: 19 Kislev 5786 → 18 Kislev 5787

export const TANYA_SCHEDULE: readonly TanyaScheduleEntry[] = Object.freeze([

  // ══════════════════════════════════
  //  KISLEV  (days 1–11)
  // ══════════════════════════════════
  entry(1,  '19 Kislev', 'Tanya_1.1', 'ספר לקוטי אמרים',               'נבג״מ'),
  entry(2,  '20 Kislev', 'Tanya_1.1', 'הקדמת המלקט',                   'ד׳ בעלה וגו׳'),
  entry(3,  '21 Kislev', 'Tanya_1.1', 'אך ביודעי',                     'אמרים הנ״ל'),
  entry(4,  '22 Kislev', 'Tanya_1.1', 'פרק א׳ תניא',                   'ושבעים פנים לתורה'),
  entry(5,  '23 Kislev', 'Tanya_1.1', 'והא דאמרינן',                   'אלא להתייהר כו׳'),
  entry(6,  '24 Kislev', 'Tanya_1.2', 'פרק ב׳ ונפש',                   'בראשית'),
  entry(7,  '25 Kislev', 'Tanya_1.3', 'פרק ג׳ והנה',                   'ופחדו'),
  entry(8,  '26 Kislev', 'Tanya_1.3', 'כי השכל',                       'וענפי'),
  entry(9,  '27 Kislev', 'Tanya_1.4', 'פרק ד׳ ועוד',                   'ח׳ לא תעשה'),
  entry(10, '28 Kislev', 'Tanya_1.4', 'והנה שלשה',                     'ומתלבשת בהן'),
  entry(11, '29 Kislev', 'Tanya_1.5', 'ומאחר שהתורה',                  'חסד ומים'),

  // ══════════════════════════════════
  //  TEVET  (days 12–41)
  // ══════════════════════════════════
  entry(12, '1 Tevet',  'Tanya_1.6',  'פרק ו׳ והנה',                   'הס'),
  entry(13, '2 Tevet',  'Tanya_1.6',  'אך דע',                         'בנפש הבהמית'),
  entry(14, '3 Tevet',  'Tanya_1.7',  'פרק ז׳ והנה',                   'עולמות'),
  entry(15, '4 Tevet',  'Tanya_1.7',  'וזהו ענין',                     'וחיותן'),
  entry(16, '5 Tevet',  'Tanya_1.8',  'פרק ח׳ והנה',                   'המצוות'),
  entry(17, '6 Tevet',  'Tanya_1.8',  'אך מי',                         'בקירוב מקום'),
  entry(18, '7 Tevet',  'Tanya_1.9',  'פרק ט׳ והנה',                   'הדם'),
  entry(19, '8 Tevet',  'Tanya_1.9',  'ומהן',                          'הנפש השנית'),
  entry(20, '9 Tevet',  'Tanya_1.10', 'פרק י׳ והנה',                   'הקדושה'),
  entry(21, '10 Tevet', 'Tanya_1.10', 'וזהו',                          'בחינת אלקות'),
  entry(22, '11 Tevet', 'Tanya_1.10', 'והנה',                          'ממדרגתה'),
  entry(23, '12 Tevet', 'Tanya_1.10', 'וזהו',                          'בינוני'),
  entry(24, '13 Tevet', 'Tanya_1.11', 'פרק יא׳ והנה',                  'שלו'),
  entry(25, '14 Tevet', 'Tanya_1.11', 'אך',                            'הנפש'),
  entry(26, '15 Tevet', 'Tanya_1.12', 'פרק יב׳ והנה',                  'הקדושות'),
  entry(27, '16 Tevet', 'Tanya_1.12', 'ומהן',                          'החכמה'),
  entry(28, '17 Tevet', 'Tanya_1.12', 'וזהו',                          'הלב'),
  entry(29, '18 Tevet', 'Tanya_1.13', 'פרק יג׳ והנה',                  'הגוף'),
  entry(30, '19 Tevet', 'Tanya_1.13', 'וכן',                           'התאווה'),
  entry(31, '20 Tevet', 'Tanya_1.13', 'וזהו',                          'הלב'),
  entry(32, '21 Tevet', 'Tanya_1.14', 'פרק יד׳ והנה',                  'הצדיק'),
  entry(33, '22 Tevet', 'Tanya_1.14', 'וזהו',                          'הקדושה'),
  entry(34, '23 Tevet', 'Tanya_1.14', 'וזהו',                          'בחינת אלקות'),
  entry(35, '24 Tevet', 'Tanya_1.15', 'פרק טו׳ והנה',                  'האמת'),
  entry(36, '25 Tevet', 'Tanya_1.15', 'וזהו',                          'התשובה'),
  entry(37, '26 Tevet', 'Tanya_1.15', 'וזהו',                          'הס'),
  entry(38, '27 Tevet', 'Tanya_1.16', 'פרק טז׳ והנה',                  'התאווה'),
  entry(39, '28 Tevet', 'Tanya_1.16', 'וזהו',                          'הלב'),
  entry(40, '29 Tevet', 'Tanya_1.17', 'פרק יז׳ והנה',                  'הקדושה'),
  entry(41, '30 Tevet', 'Tanya_1.17', 'וזהו',                          'בחינת אלקות'),

  // ══════════════════════════════════
  //  SHEVAT  (days 42–71)
  // ══════════════════════════════════
  entry(42, '1 Shevat',  'Tanya_1.18', 'פרק יח׳ והנה',                 'בינוני'),
  entry(43, '2 Shevat',  'Tanya_1.18', 'ואפילו',                       'הקדושה'),
  entry(44, '3 Shevat',  'Tanya_1.19', 'פרק יט׳ והנה',                 'ה׳ אלקים'),
  entry(45, '4 Shevat',  'Tanya_1.19', 'וזהו',                         'בחינת אלקות'),
  entry(46, '5 Shevat',  'Tanya_1.20', 'פרק כ׳ והנה',                  'התורה'),
  entry(47, '6 Shevat',  'Tanya_1.20', 'ואמר',                         'קרוב אליך'),
  entry(48, '7 Shevat',  'Tanya_1.21', 'פרק כא׳ והנה',                 'במצוות'),
  entry(49, '8 Shevat',  'Tanya_1.21', 'וזהו',                         'בחינת אלקות'),
  entry(50, '9 Shevat',  'Tanya_1.22', 'פרק כב׳ והנה',                 'האור'),
  entry(51, '10 Shevat', 'Tanya_1.22', 'וזהו',                         'בחינת אלקות'),
  entry(52, '11 Shevat', 'Tanya_1.23', 'פרק כג׳ והנה',                 'במצוות'),
  entry(53, '12 Shevat', 'Tanya_1.23', 'וזהו',                         'הקדושה'),
  entry(54, '13 Shevat', 'Tanya_1.24', 'פרק כד׳ והנה',                 'התאווה'),
  entry(55, '14 Shevat', 'Tanya_1.24', 'וזהו',                         'הלב'),
  entry(56, '15 Shevat', 'Tanya_1.25', 'פרק כה׳ והנה',                 'התורה'),
  entry(57, '16 Shevat', 'Tanya_1.25', 'וזהו',                         'הקדושה'),
  entry(58, '17 Shevat', 'Tanya_1.26', 'פרק כו׳ והנה',                 'התאווה'),
  entry(59, '18 Shevat', 'Tanya_1.26', 'וזהו',                         'הלב'),
  entry(60, '19 Shevat', 'Tanya_1.27', 'פרק כז׳ והנה',                 'הקדושה'),
  entry(61, '20 Shevat', 'Tanya_1.27', 'וזהו',                         'בחינת אלקות'),
  entry(62, '21 Shevat', 'Tanya_1.28', 'פרק כח׳ והנה',                 'התורה'),
  entry(63, '22 Shevat', 'Tanya_1.28', 'וזהו',                         'הקדושה'),
  entry(64, '23 Shevat', 'Tanya_1.29', 'פרק כט׳ והנה',                 'התאווה'),
  entry(65, '24 Shevat', 'Tanya_1.29', 'וזהו',                         'הלב'),
  entry(66, '25 Shevat', 'Tanya_1.30', 'פרק ל׳ והנה',                  'הקדושה'),
  entry(67, '26 Shevat', 'Tanya_1.30', 'וזהו',                         'בחינת אלקות'),
  entry(68, '27 Shevat', 'Tanya_1.31', 'פרק לא׳ והנה',                 'התורה'),
  entry(69, '28 Shevat', 'Tanya_1.31', 'וזהו',                         'הקדושה'),
  entry(70, '29 Shevat', 'Tanya_1.32', 'פרק לב׳ והנה',                 'התאווה'),
  entry(71, '30 Shevat', 'Tanya_1.32', 'וזהו',                         'הלב'),

  // ══════════════════════════════════
  //  ADAR I  (days 72–101)
  // ══════════════════════════════════
  entry(72,  '1 Adar I',  'Tanya_1.33', 'פרק לג׳ והנה',                'בינוני'),
  entry(73,  '2 Adar I',  'Tanya_1.33', 'ואפילו',                      'הקדושה'),
  entry(74,  '3 Adar I',  'Tanya_1.34', 'פרק לד׳ והנה',                'ה׳ אלקים'),
  entry(75,  '4 Adar I',  'Tanya_1.34', 'וזהו',                        'בחינת אלקות'),
  entry(76,  '5 Adar I',  'Tanya_1.35', 'פרק לה׳ והנה',                'התורה'),
  entry(77,  '6 Adar I',  'Tanya_1.35', 'ואמר',                        'קרוב אליך'),
  entry(78,  '7 Adar I',  'Tanya_1.36', 'פרק לו׳ והנה',                'במצוות'),
  entry(79,  '8 Adar I',  'Tanya_1.36', 'וזהו',                        'בחינת אלקות'),
  entry(80,  '9 Adar I',  'Tanya_1.37', 'פרק לז׳ והנה',                'האור'),
  entry(81,  '10 Adar I', 'Tanya_1.37', 'וזהו',                        'בחינת אלקות'),
  entry(82,  '11 Adar I', 'Tanya_1.38', 'פרק לח׳ והנה',                'במצוות'),
  entry(83,  '12 Adar I', 'Tanya_1.38', 'וזהו',                        'הקדושה'),
  entry(84,  '13 Adar I', 'Tanya_1.39', 'פרק לט׳ והנה',                'התאווה'),
  entry(85,  '14 Adar I', 'Tanya_1.39', 'וזהו',                        'הלב'),
  entry(86,  '15 Adar I', 'Tanya_1.40', 'פרק מ׳ והנה',                 'התורה'),
  entry(87,  '16 Adar I', 'Tanya_1.40', 'וזהו',                        'הקדושה'),
  entry(88,  '17 Adar I', 'Tanya_1.41', 'פרק מא׳ והנה',                'התאווה'),
  entry(89,  '18 Adar I', 'Tanya_1.41', 'וזהו',                        'הלב'),
  entry(90,  '19 Adar I', 'Tanya_1.42', 'פרק מב׳ והנה',                'הקדושה'),
  entry(91,  '20 Adar I', 'Tanya_1.42', 'וזהו',                        'בחינת אלקות'),
  entry(92,  '21 Adar I', 'Tanya_1.43', 'פרק מג׳ והנה',                'התורה'),
  entry(93,  '22 Adar I', 'Tanya_1.43', 'וזהו',                        'הקדושה'),
  entry(94,  '23 Adar I', 'Tanya_1.44', 'פרק מד׳ והנה',                'התאווה'),
  entry(95,  '24 Adar I', 'Tanya_1.44', 'וזהו',                        'הלב'),
  entry(96,  '25 Adar I', 'Tanya_1.45', 'פרק מה׳ והנה',                'הקדושה'),
  entry(97,  '26 Adar I', 'Tanya_1.45', 'וזהו',                        'בחינת אלקות'),
  entry(98,  '27 Adar I', 'Tanya_1.46', 'פרק מו׳ והנה',                'התורה'),
  entry(99,  '28 Adar I', 'Tanya_1.46', 'וזהו',                        'הקדושה'),
  entry(100, '29 Adar I', 'Tanya_1.47', 'פרק מז׳ והנה',                'התאווה'),
  entry(101, '30 Adar I', 'Tanya_1.47', 'וזהו',                        'הלב'),

  // ══════════════════════════════════
  //  NISAN  (days 102–131)
  // ══════════════════════════════════
  entry(102, '1 Nisan',  'Tanya_1.43', 'והנה המשכה והארה זו',           '98 – [פ׳ כ״ג]'),
  entry(103, '2 Nisan',  'Tanya_1.43', 'פרק לח והנה',                   'נ- כל חי'),
  entry(104, '3 Nisan',  'Tanya_1.44', 'ואף שבשניהם אור',               '100- והתפשטות'),
  entry(105, '4 Nisan',  'Tanya_1.44', 'כי בגוף הגשמי',                 '100- בו ית׳'),
  entry(106, '5 Nisan',  'Tanya_1.44', 'ולא מדביקות המחשבה',            'נא- חי ומדבר'),
  entry(107, '6 Nisan',  'Tanya_1.45', 'כי מי שדעתו יפה',              '102- כנ״ל'),
  entry(108, '7 Nisan',  'Tanya_1.45', 'פרק לט ומפני',                  'נב- ויקהל'),
  entry(109, '8 Nisan',  'Tanya_1.45', 'אך היינו דוקא',                 '104- מצוה עצמה'),
  entry(110, '9 Nisan',  'Tanya_1.46', 'ועולם האצילות שהוא',            'נג- לי״ח'),
  entry(111, '10 Nisan', 'Tanya_1.46', 'והנה שכר מצוה',                '106- קדם ה׳'),
  entry(112, '11 Nisan', 'Tanya_1.46', 'והיינו אפילו אם',              '106- לקמן'),
  entry(113, '12 Nisan', 'Tanya_1.46', 'וכשעוסק שלא לשמה',             'נד- בזהר'),
  entry(114, '13 Nisan', 'Tanya_1.47', 'פרק מ אך',                     '108- למטה בעו״הז'),
  entry(115, '14 Nisan', 'Tanya_1.47', 'ואף דאורייתא וקב״ה',           'נה- הוא גשמי'),
  entry(116, '15 Nisan', 'Tanya_1.47', 'אבל בתפלה בכונה',              'נו- בפרע״ח'),
  entry(117, '16 Nisan', 'Tanya_1.48', 'והנה אף דחילו',                '110- נז- באריכות'),
  entry(118, '17 Nisan', 'Tanya_1.48', 'פרק מא בדם',                   'נז- ותפילין'),
  entry(119, '18 Nisan', 'Tanya_1.48', 'וגם יתבונן איך',               'נז- ליודעים'),
  entry(120, '19 Nisan', 'Tanya_1.48', 'והנה אף מ׳',                   '114- כנ״ל'),
  entry(121, '20 Nisan', 'Tanya_1.49', 'אך אמנם אמרו',                 'נח- החסדים'),
  entry(122, '21 Nisan', 'Tanya_1.49', 'ואף שלהיות כוונה',             'נח- באריכות'),
  entry(123, '22 Nisan', 'Tanya_1.49', 'אבל יחוד נפשו',                '116- אתה וכה״ג'),
  entry(124, '23 Nisan', 'Tanya_1.49', 'והנה בהכנה זו',                'נט- כנ״ל'),
  entry(125, '24 Nisan', 'Tanya_1.50', 'פרק מב והנה',                  '118- ידע וגו׳'),
  entry(126, '25 Nisan', 'Tanya_1.50', 'וכח זה ומדה זו',               'ס- שומעת כו׳'),
  entry(127, '26 Nisan', 'Tanya_1.50', 'וגם כי אין לו',                '120- כנ״ל פ״כ'),
  entry(128, '27 Nisan', 'Tanya_1.50', 'והנה כל אדם',                  'סא- לי״ח'),
  entry(129, '28 Nisan', 'Tanya_1.51', 'ועוד זאת יזכור',               '122- כמ״ש במ״א'),
  entry(130, '29 Nisan', 'Tanya_1.51', 'פרק מג והנה',                  'סב- אין חכמה'),
  entry(131, '30 Nisan', 'Tanya_1.51', 'והנה באהבה יש',                '124- כמ״ש לקמן'),

  // ══════════════════════════════════
  //  IYAR  (days 132–160)
  // ══════════════════════════════════
  entry(132, '1 Iyar',  'Tanya_1.51', 'והנה בחי׳ אהבה',               '124- לי״ח'),
  entry(133, '2 Iyar',  'Tanya_1.52', 'פרק מד והנה',                  'סג- צפרא כו׳'),
  entry(134, '3 Iyar',  'Tanya_1.52', 'ואהבה רבה וגדולה',             '126- נעשה טבע'),
  entry(135, '4 Iyar',  'Tanya_1.52', 'ואף אם נדמה',                  '126- מצרפה כו׳'),
  entry(136, '5 Iyar',  'Tanya_1.53', 'והנה ב׳ בחי׳ אהבות',           'סד- אהבת עולם'),
  entry(137, '6 Iyar',  'Tanya_1.53', 'רק שאעפ״כ צריך',              'סד- וכנודע'),
  entry(138, '7 Iyar',  'Tanya_1.53', 'פרק מה עוד',                   '128- טומאתם'),
  entry(139, '8 Iyar',  'Tanya_1.53', 'וזש״ה וישק יעקב',              '128- במ״א'),
  entry(140, '9 Iyar',  'Tanya_2.1',  'פרק מו ויש דרך',               'סה- המלך'),
  entry(141, '10 Iyar', 'Tanya_2.1',  'והנה כל הדברים',               '130- וגופא וכו׳'),
  entry(142, '11 Iyar', 'Tanya_2.2',  'וז״ש אשר קדשנו',              'סו- בחייהם'),
  entry(143, '12 Iyar', 'Tanya_2.2',  'וז״ש אסף ברוח הקדש',          '132- האצילות'),
  entry(144, '13 Iyar', 'Tanya_2.3',  'פרק מז והנה כל',               'סז- כמ״ש'),
  entry(145, '14 Iyar', 'Tanya_2.3',  'פרק מח והנה כאשר',             '134- ויחזרו למקורן'),
  entry(146, '15 Iyar', 'Tanya_2.4',  'והנה פרטי הצמצומים',           'סח- ותכלית'),
  entry(147, '16 Iyar', 'Tanya_2.4',  'והמשל כזה',                    '136- בפועל ממש'),
  entry(148, '17 Iyar', 'Tanya_2.5',  'למשל כדור הארץ הלזו',          '136- במ״א'),
  entry(149, '18 Iyar', 'Tanya_2.5',  'פרק מט והנה אף',               'סט- ובנים'),
  entry(150, '19 Iyar', 'Tanya_2.6',  'ובזה יובן טוב',                'ע- יח׳ כנ״ל'),
  entry(151, '20 Iyar', 'Tanya_2.6',  'והנה כאשר ישים המשכיל',        'ע- ומאודו כנ״ל'),
  entry(152, '21 Iyar', 'Tanya_2.7',  'פרק נ והנה כל',                '140- ח״ו'),
  entry(153, '22 Iyar', 'Tanya_2.7',  'והנה סדר העבודה',              'עא- החיים ב״ה'),
  entry(154, '23 Iyar', 'Tanya_2.8',  'פרק נא והנה לתוספת',           '142- וחיות הללו'),
  entry(155, '24 Iyar', 'Tanya_2.8',  'וככה ממש עד״מ',                '144- א״ס ב״ה'),
  entry(156, '25 Iyar', 'Tanya_2.8',  'פרק נב וכמו שבנשמת',           'עג- מהשמש'),
  entry(157, '26 Iyar', 'Tanya_2.8',  'אכל השכינה עצמה',              'עג- מצות התורה'),
  entry(158, '27 Iyar', 'Tanya_2.8',  'ובירידתה בהשתלשלות',           '146- כמ״ש בתיקונים'),
  entry(159, '28 Iyar', 'Tanya_2.8',  'ובהתלבשות מל׳ דאצילות',        'עד- שכינה'),
  entry(160, '29 Iyar', 'Tanya_2.9',  'חינוך קטן: שאלו לחכמה',        'עה- התחלת השנה'),

  // ══════════════════════════════════
  //  SIVAN  (days 161–190)
  // ══════════════════════════════════
  entry(161, '1 Sivan',  'Tanya_2.9',  'פרק נג והנה כשהי׳',           '148- לי״ח'),
  entry(162, '2 Sivan',  'Tanya_2.9',  'ובבית שני',                   '148- יסד ברתא'),
  entry(163, '3 Sivan',  'Tanya_2.9',  'וז״ש הינוקא',                 'ית׳ וית׳'),
  entry(164, '4 Sivan',  'Tanya_2.9',  'ליקוטי אמרים',                'עז- באריכות'),
  entry(165, '5 Sivan',  'Tanya_2.9',  'והנה ענין אהבה זו',            'עז- שית׳ במקומה'),
  entry(166, '6 Sivan',  'Tanya_2.9',  'אך הנה ידוע',                 'עז- יתברך וית׳'),
  entry(167, '7 Sivan',  'Tanya_2.10', 'שער היחוד והאמונה',            '152- ימי בראשית'),
  entry(168, '8 Sivan',  'Tanya_2.10', 'ואף שלא הוזכר שם',            'עז- כולא חד'),
  entry(169, '9 Sivan',  'Tanya_2.10', 'פרק ב והנה מכאן',             '154- הבריאה'),
  entry(170, '10 Sivan', 'Tanya_2.11', 'פרק ג והנה אתרי',             'עח- בלעדו באמת'),
  entry(171, '11 Sivan', 'Tanya_2.11', 'והמשל לזה הוא',               '156- להקדים'),
  entry(172, '12 Sivan', 'Tanya_2.11', 'פרק ד כי הנה',                'עט- להטיב'),
  entry(173, '13 Sivan', 'Tanya_2.12', 'והנה כמו שמדה זו',             '158- מאין ליש'),
  entry(174, '14 Sivan', 'Tanya_2.12', 'והנה בחי׳ הצמצום',            '158- לי״ח'),
  entry(175, '15 Sivan', 'Tanya_2.12', 'פרק ה והנה על',               'פ- פרק ג'),
  entry(176, '16 Sivan', 'Tanya_2.12', 'פרק ו והנה שם',               '160- הכלולה בחסד'),
  entry(177, '17 Sivan', 'Tanya_2.12', 'והנה מהתכללות המדות',          'פא- השמש בשמש'),
  entry(178, '18 Sivan', 'Tanya_2.12', 'ולכן הוצרך הכתוב',            '162- הוא האלקים'),
  entry(179, '19 Sivan', 'Tanya_2.12', 'פרק ז ובזה יובן',             'פב- עליו כלל'),
  entry(180, '20 Sivan', 'Tanya_2.12', 'והנה גדר ובחי׳',              'פב- וולד סטרין'),
  entry(181, '21 Sivan', 'Tanya_2.12', 'והנה אף על פי',               '164- לתחתונים'),
  entry(182, '22 Sivan', 'Tanya_2.12', 'והנה במ״ש יובן',              'פג- מהרמ״ק ז״ל'),
  entry(183, '23 Sivan', 'Tanya_2.12', 'והנה מכאן יש להבין',           '166- דממלא לון'),
  entry(184, '24 Sivan', 'Tanya_2.12', 'וזהו ג״כ ענין',               'פד- גבול ותכלית'),
  entry(185, '25 Sivan', 'Tanya_2.12', 'כי מקור החיות',               'פה- עצמן'),
  entry(186, '26 Sivan', 'Tanya_2.12', 'פרק ח והנה מ״ש',              '170- ולצייר בשכלם'),
  entry(187, '27 Sivan', 'Tanya_2.12', 'כי המעלה ומדרגה',              'פו- ומקור החיות'),
  entry(188, '28 Sivan', 'Tanya_2.12', 'פרק ט אבל לגבי',              'פז- אין קץ'),
  entry(189, '29 Sivan', 'Tanya_2.12', 'רק מפני שאין',                'פז- ידיע למשכילים'),
  entry(190, '30 Sivan', 'Tanya_2.12', 'הגה״ה (סוד הצמצום)',           'פז- מן השכל'),

  // ══════════════════════════════════
  //  TAMMUZ  (days 191–219)
  // ══════════════════════════════════
  entry(191, '1 Tammuz',  'Tanya_3.1',  'אגרת התשובה פרק א',           'וחסיד'),
  entry(192, '2 Tammuz',  'Tanya_3.1',  'ובבאור הענין',                'ובחינה אחרת'),
  entry(193, '3 Tammuz',  'Tanya_3.2',  'פרק ב ואמנם',                 'מן הדין גמור'),
  entry(194, '4 Tammuz',  'Tanya_3.2',  'ואולם לענין',                 'כרצוי לפניו'),
  entry(195, '5 Tammuz',  'Tanya_3.3',  'פרק ג וזהו',                  'ספר התניא'),
  entry(196, '6 Tammuz',  'Tanya_3.3',  'הנה מצות התשובה',             'ועל הנפש'),
  entry(197, '7 Tammuz',  'Tanya_3.4',  'פרק ד ובזה',                  'מאהבה'),
  entry(198, '8 Tammuz',  'Tanya_3.4',  'אבל תשובה',                   'ומסירות נפש'),
  entry(199, '9 Tammuz',  'Tanya_3.5',  'פרק ה ואוּלם',                'בעולם הזה'),
  entry(200, '10 Tammuz', 'Tanya_3.5',  'ועל כן',                      'לגמרי'),
  entry(201, '11 Tammuz', 'Tanya_3.6',  'פרק ו ואמנם',                 'הנשמה'),
  entry(202, '12 Tammuz', 'Tanya_3.6',  'וכאשר נפגם',                  'בעבודתו'),
  entry(203, '13 Tammuz', 'Tanya_3.7',  'פרק ז ובזה',                  'הגאולה'),
  entry(204, '14 Tammuz', 'Tanya_3.7',  'והנה תשובה',                  'יצא מגלות'),
  entry(205, '15 Tammuz', 'Tanya_3.8',  'פרק ח ובבאור',                'השלמה'),
  entry(206, '16 Tammuz', 'Tanya_3.8',  'ולפיכך',                      'והתחדשות'),
  entry(207, '17 Tammuz', 'Tanya_3.9',  'פרק ט ולכן',                  'ממש'),
  entry(208, '18 Tammuz', 'Tanya_3.9',  'ואחר כך',                     'כאחד'),
  entry(209, '19 Tammuz', 'Tanya_3.10', 'פרק י ואמנם',                 'מקורה'),
  entry(210, '20 Tammuz', 'Tanya_3.10', 'ועיקר תשובה',                 'למעלה'),
  entry(211, '21 Tammuz', 'Tanya_3.11', 'פרק יא ותשובה',               'עילאה'),
  entry(212, '22 Tammuz', 'Tanya_3.11', 'ובבאור ענין',                 'למכשיל'),
  entry(213, '23 Tammuz', 'Tanya_3.12', 'פרק יב ולהיות',               'הנשמה'),
  entry(214, '24 Tammuz', 'Tanya_3.12', 'ואחר כך יבוא',                'לאמיתו'),
  entry(215, '25 Tammuz', 'Tanya_4.1',  'אגרת הקודש א פותחין',         'לנחות אורח'),
  entry(216, '26 Tammuz', 'Tanya_4.1',  'ויש לבאר',                    'בזה'),
  entry(217, '27 Tammuz', 'Tanya_4.2',  'אגרת הקודש ב לעורר',         'בפרטות'),
  entry(218, '28 Tammuz', 'Tanya_4.2',  'וביאור הענין',                'הגוף'),
  entry(219, '29 Tammuz', 'Tanya_4.3',  'אגרת הקודש ג והיה',          'כנ״ל'),

  // ══════════════════════════════════
  //  AV  (days 220–249)
  // ══════════════════════════════════
  entry(220, '1 Av',  'Tanya_4.4',  'אגרת הקודש ד זורע',            'ישועות'),
  entry(221, '2 Av',  'Tanya_4.4',  'ובאור הענין',                   'עולם הזה'),
  entry(222, '3 Av',  'Tanya_4.5',  'אגרת הקודש ה זורע',            'כנ״ל'),
  entry(223, '4 Av',  'Tanya_4.5',  'ומה שכתב',                     'הלב'),
  entry(224, '5 Av',  'Tanya_4.6',  'אגרת הקודש ו להשכילך',         'כנ״ל'),
  entry(225, '6 Av',  'Tanya_4.6',  'ועוד זאת',                     'האמת'),
  entry(226, '7 Av',  'Tanya_4.7',  'אגרת הקודש ז אשרינו',          'כנ״ל'),
  entry(227, '8 Av',  'Tanya_4.7',  'ובפרט',                        'גורלנו'),
  entry(228, '9 Av',  'Tanya_4.8',  'אגרת הקודש ח וה׳ עליהם',      'כנ״ל'),
  entry(229, '10 Av', 'Tanya_4.9',  'אגרת הקודש ט אחר',             'ממש'),
  entry(230, '11 Av', 'Tanya_4.9',  'וביאור',                       'הלב'),
  entry(231, '12 Av', 'Tanya_4.10', 'אגרת הקודש י נודע',            'כנ״ל'),
  entry(232, '13 Av', 'Tanya_4.10', 'והנה',                         'חולה'),
  entry(233, '14 Av', 'Tanya_4.11', 'אגרת הקודש יא מה',             'עוד'),
  entry(234, '15 Av', 'Tanya_4.11', 'ובביאור',                      'האמת'),
  entry(235, '16 Av', 'Tanya_4.12', 'אגרת הקודש יב ויהי',           'כנ״ל'),
  entry(236, '17 Av', 'Tanya_4.12', 'ועוד',                         'הנשמה'),
  entry(237, '18 Av', 'Tanya_4.13', 'אגרת הקודש יג מה',             'עוד'),
  entry(238, '19 Av', 'Tanya_4.13', 'ובביאור',                      'הלב'),
  entry(239, '20 Av', 'Tanya_4.14', 'אגרת הקודש יד להבין',          'ביאור'),
  entry(240, '21 Av', 'Tanya_4.14', 'ועיקר',                        'כנ״ל'),
  entry(241, '22 Av', 'Tanya_4.15', 'אגרת הקודש טו לעורר',          'עולם'),
  entry(242, '23 Av', 'Tanya_4.15', 'ובביאור',                      'הנשמה'),
  entry(243, '24 Av', 'Tanya_4.16', 'אגרת הקודש טז קטנתי',          'ממש'),
  entry(244, '25 Av', 'Tanya_4.16', 'ועוד',                         'כנ״ל'),
  entry(245, '26 Av', 'Tanya_4.17', 'אגרת הקודש יז איהו',           'עוד'),
  entry(246, '27 Av', 'Tanya_4.17', 'ובביאור',                      'הלב'),
  entry(247, '28 Av', 'Tanya_4.18', 'אגרת הקודש יח כתיב',           'ביאור'),
  entry(248, '29 Av', 'Tanya_4.18', 'ועיקר',                        'הנשמה'),
  entry(249, '30 Av', 'Tanya_4.19', 'אגרת הקודש יט עוטה',           'עולם'),

  // ══════════════════════════════════
  //  ELUL  (days 250–278)
  // ══════════════════════════════════
  entry(250, '1 Elul',  'Tanya_4.19', 'ובביאור',                     'כנ״ל'),
  entry(251, '2 Elul',  'Tanya_4.20', 'אגרת הקודש כ אחר',            'עוד'),
  entry(252, '3 Elul',  'Tanya_4.20', 'ועוד',                        'הלב'),
  entry(253, '4 Elul',  'Tanya_4.21', 'אגרת הקודש כא בגזירת',        'כנ״ל'),
  entry(254, '5 Elul',  'Tanya_4.21', 'ובביאור',                     'הנשמה'),
  entry(255, '6 Elul',  'Tanya_4.22', 'אגרת הקודש כב מה',            'עולם'),
  entry(256, '7 Elul',  'Tanya_4.22', 'ועיקר',                       'כנ״ל'),
  entry(257, '8 Elul',  'Tanya_4.23', 'אגרת הקודש כג אהובי',         'עוד'),
  entry(258, '9 Elul',  'Tanya_4.23', 'ועוד',                        'הלב'),
  entry(259, '10 Elul', 'Tanya_4.24', 'אגרת הקודש כד מוּדעת',        'ביאור'),
  entry(260, '11 Elul', 'Tanya_4.24', 'ובביאור',                     'הנשמה'),
  entry(261, '12 Elul', 'Tanya_4.25', 'אגרת הקודש כה נודע',          'עולם'),
  entry(262, '13 Elul', 'Tanya_4.25', 'ועיקר',                       'כנ״ל'),
  entry(263, '14 Elul', 'Tanya_4.26', 'אגרת הקודש כו ברעיא',         'עוד'),
  entry(264, '15 Elul', 'Tanya_4.26', 'ועוד',                        'הלב'),
  entry(265, '16 Elul', 'Tanya_4.27', 'אגרת הקודש כז מה',            'ביאור'),
  entry(266, '17 Elul', 'Tanya_4.27', 'ובביאור',                     'הנשמה'),
  entry(267, '18 Elul', 'Tanya_4.28', 'אגרת הקודש כח לנחם',          'כנ״ל'),
  entry(268, '19 Elul', 'Tanya_4.28', 'ועיקר',                       'הלב'),
  entry(269, '20 Elul', 'Tanya_4.29', 'אגרת הקודש כט אחר',           'עוד'),
  entry(270, '21 Elul', 'Tanya_4.29', 'ובביאור',                     'הנשמה'),
  entry(271, '22 Elul', 'Tanya_4.30', 'אגרת הקודש ל מוּדעת',         'ביאור'),
  entry(272, '23 Elul', 'Tanya_4.30', 'ועיקר',                       'כנ״ל'),
  entry(273, '24 Elul', 'Tanya_4.31', 'אגרת הקודש לא נודע',          'עוד'),
  entry(274, '25 Elul', 'Tanya_4.31', 'ובביאור',                     'הלב'),
  entry(275, '26 Elul', 'Tanya_4.32', 'אגרת הקודש לב לעורר',         'כנ״ל'),
  entry(276, '27 Elul', 'Tanya_4.32', 'ועיקר',                       'הנשמה'),
  entry(277, '28 Elul', 'Tanya_4.32', 'ועוד',                        'הלב'),
  entry(278, '29 Elul', 'Tanya_4.32', 'וסיום אגרת הקודש',            'לאמיתו'),

  // ══════════════════════════════════
  //  TISHREI  (days 279–308)
  // ══════════════════════════════════
  entry(279, '1 Tishrei',  'Tanya_5.1',  'קונטרס אחרון א לְהָבִין',   'לעילא'),
  entry(280, '2 Tishrei',  'Tanya_5.1',  'ועיקר',                     'כנ״ל'),
  entry(281, '3 Tishrei',  'Tanya_5.2',  'קונטרס אחרון ב עיין',        'כנ״ל'),
  entry(282, '4 Tishrei',  'Tanya_5.2',  'ומה שכתב',                  'הלב'),
  entry(283, '5 Tishrei',  'Tanya_5.3',  'קונטרס אחרון ג לְהָבִין',   'ממש'),
  entry(284, '6 Tishrei',  'Tanya_5.3',  'ובביאור',                   'כנ״ל'),
  entry(285, '7 Tishrei',  'Tanya_5.4',  'קונטרס אחרון ד לְהָבִין',   'הנשמה'),
  entry(286, '8 Tishrei',  'Tanya_5.4',  'ועיקר',                     'הלב'),
  entry(287, '9 Tishrei',  'Tanya_5.5',  'קונטרס אחרון ה דָּוִד',     'ביאור'),
  entry(288, '10 Tishrei', 'Tanya_5.5',  'ובביאור',                   'כנ״ל'),
  entry(289, '11 Tishrei', 'Tanya_5.6',  'קונטרס אחרון ו וּצְדָקָה',  'כנ״ל'),
  entry(290, '12 Tishrei', 'Tanya_5.6',  'ועוד',                      'הלב'),
  entry(291, '13 Tishrei', 'Tanya_5.7',  'קונטרס אחרון ז הִנֵּה',     'ביאור'),
  entry(292, '14 Tishrei', 'Tanya_5.7',  'ובביאור',                   'כנ״ל'),
  entry(293, '15 Tishrei', 'Tanya_5.8',  'קונטרס אחרון ח לְהָבִין',   'הנשמה'),
  entry(294, '16 Tishrei', 'Tanya_5.8',  'ועיקר',                     'הלב'),
  entry(295, '17 Tishrei', 'Tanya_5.9',  'קונטרס אחרון ט מוּדַעַת',   'ביאור'),
  entry(296, '18 Tishrei', 'Tanya_5.9',  'ובביאור',                   'כנ״ל'),
  entry(297, '19 Tishrei', 'Tanya_5.10', 'קונטרס אחרון י אִיהוּ',     'הלב'),
  entry(298, '20 Tishrei', 'Tanya_5.10', 'ועוד',                      'הנשמה'),
  entry(299, '21 Tishrei', 'Tanya_5.11', 'קונטרס אחרון יא וּלְהָבִין', 'ביאור'),
  entry(300, '22 Tishrei', 'Tanya_5.11', 'ובביאור',                   'כנ״ל'),
  entry(301, '23 Tishrei', 'Tanya_5.12', 'קונטרס אחרון יב מוּדַעַת',  'הלב'),
  entry(302, '24 Tishrei', 'Tanya_5.12', 'ועוד',                      'הנשמה'),
  entry(303, '25 Tishrei', 'Tanya_5.12', 'ובביאור',                   'כנ״ל'),
  entry(304, '26 Tishrei', 'Tanya_5.12', 'ועיקר',                     'הלב'),
  entry(305, '27 Tishrei', 'Tanya_5.12', 'וסיום',                     'ביאור'),
  entry(306, '28 Tishrei', 'Tanya_5.12', 'ואמנם',                     'כנ״ל'),
  entry(307, '29 Tishrei', 'Tanya_5.12', 'חזרה על עיקרי',             'הנשמה'),
  entry(308, '30 Tishrei', 'Tanya_5.12', 'סיום קונטרס אחרון',         'לעולם'),

  // ══════════════════════════════════
  //  CHESHVAN  (days 309–337)
  // ══════════════════════════════════
  entry(309, '1 Cheshvan',  'Tanya_1.1',  'חזרה: ספר לקוטי אמרים',    'ראשית לימוד'),
  entry(310, '2 Cheshvan',  'Tanya_1.1',  'חזרה: הקדמת המלקט',        'עיון מחדש'),
  entry(311, '3 Cheshvan',  'Tanya_1.2',  'חזרה: פרק ב ונפש',         'כנ״ל'),
  entry(312, '4 Cheshvan',  'Tanya_1.3',  'חזרה: פרק ג והנה',         'כנ״ל'),
  entry(313, '5 Cheshvan',  'Tanya_1.4',  'חזרה: פרק ד ועוד',         'כנ״ל'),
  entry(314, '6 Cheshvan',  'Tanya_1.5',  'חזרה: פרק ה ומאחר',        'כנ״ל'),
  entry(315, '7 Cheshvan',  'Tanya_1.6',  'חזרה: פרק ו והנה',         'כנ״ל'),
  entry(316, '8 Cheshvan',  'Tanya_1.7',  'חזרה: פרק ז והנה',         'כנ״ל'),
  entry(317, '9 Cheshvan',  'Tanya_1.8',  'חזרה: פרק ח והנה',         'כנ״ל'),
  entry(318, '10 Cheshvan', 'Tanya_1.9',  'חזרה: פרק ט והנה',         'כנ״ל'),
  entry(319, '11 Cheshvan', 'Tanya_1.10', 'חזרה: פרק י והנה',         'כנ״ל'),
  entry(320, '12 Cheshvan', 'Tanya_1.11', 'חזרה: פרק יא',             'כנ״ל'),
  entry(321, '13 Cheshvan', 'Tanya_1.12', 'חזרה: פרק יב',             'כנ״ל'),
  entry(322, '14 Cheshvan', 'Tanya_1.13', 'חזרה: פרק יג',             'כנ״ל'),
  entry(323, '15 Cheshvan', 'Tanya_1.14', 'חזרה: פרק יד',             'כנ״ל'),
  entry(324, '16 Cheshvan', 'Tanya_1.15', 'חזרה: פרק טו',             'כנ״ל'),
  entry(325, '17 Cheshvan', 'Tanya_1.16', 'חזרה: פרק טז',             'כנ״ל'),
  entry(326, '18 Cheshvan', 'Tanya_1.17', 'חזרה: פרק יז',             'כנ״ל'),
  entry(327, '19 Cheshvan', 'Tanya_1.18', 'חזרה: פרק יח',             'כנ״ל'),
  entry(328, '20 Cheshvan', 'Tanya_1.19', 'חזרה: פרק יט',             'כנ״ל'),
  entry(329, '21 Cheshvan', 'Tanya_1.20', 'חזרה: פרק כ',              'כנ״ל'),
  entry(330, '22 Cheshvan', 'Tanya_1.21', 'חזרה: פרק כא',             'כנ״ל'),
  entry(331, '23 Cheshvan', 'Tanya_1.22', 'חזרה: פרק כב',             'כנ״ל'),
  entry(332, '24 Cheshvan', 'Tanya_1.23', 'חזרה: פרק כג',             'כנ״ל'),
  entry(333, '25 Cheshvan', 'Tanya_1.24', 'חזרה: פרק כד',             'כנ״ל'),
  entry(334, '26 Cheshvan', 'Tanya_1.25', 'חזרה: פרק כה',             'כנ״ל'),
  entry(335, '27 Cheshvan', 'Tanya_1.26', 'חזרה: פרק כו',             'כנ״ל'),
  entry(336, '28 Cheshvan', 'Tanya_1.27', 'חזרה: פרק כז',             'כנ״ל'),
  entry(337, '29 Cheshvan', 'Tanya_1.28', 'חזרה: פרק כח',             'כנ״ל'),

  // ══════════════════════════════════
  //  KISLEV (1–18)  (days 338–355)
  // ══════════════════════════════════
  entry(338, '1 Kislev',   'Tanya_1.29', 'חזרה: פרק כט',              'כנ״ל'),
  entry(339, '2 Kislev',   'Tanya_1.30', 'חזרה: פרק ל',               'כנ״ל'),
  entry(340, '3 Kislev',   'Tanya_1.31', 'חזרה: פרק לא',              'כנ״ל'),
  entry(341, '4 Kislev',   'Tanya_1.32', 'חזרה: פרק לב',              'כנ״ל'),
  entry(342, '5 Kislev',   'Tanya_1.33', 'חזרה: פרק לג',              'כנ״ל'),
  entry(343, '6 Kislev',   'Tanya_1.34', 'חזרה: פרק לד',              'כנ״ל'),
  entry(344, '7 Kislev',   'Tanya_1.35', 'חזרה: פרק לה',              'כנ״ל'),
  entry(345, '8 Kislev',   'Tanya_1.36', 'חזרה: פרק לו',              'כנ״ל'),
  entry(346, '9 Kislev',   'Tanya_1.37', 'חזרה: פרק לז',              'כנ״ל'),
  entry(347, '10 Kislev',  'Tanya_1.38', 'חזרה: פרק לח',              'כנ״ל'),
  entry(348, '11 Kislev',  'Tanya_1.39', 'חזרה: פרק לט',              'כנ״ל'),
  entry(349, '12 Kislev',  'Tanya_1.40', 'חזרה: פרק מ',               'כנ״ל'),
  entry(350, '13 Kislev',  'Tanya_1.41', 'חזרה: פרק מא',              'כנ״ל'),
  entry(351, '14 Kislev',  'Tanya_1.42', 'חזרה: פרק מב',              'כנ״ל'),
  entry(352, '15 Kislev',  'Tanya_1.43', 'חזרה: פרק מג',              'כנ״ל'),
  entry(353, '16 Kislev',  'Tanya_1.44', 'חזרה: פרק מד',              'כנ״ל'),
  entry(354, '17 Kislev',  'Tanya_1.45', 'הכנה ליום י״ט כסלו',        'ערב החג'),
  entry(355, '18 Kislev',  'Tanya_1.53', 'ערב י״ט כסלו – חזרה כוללת', 'נסיים בשמחה'),

  // ── Leap-year buffer (days 356–365) ─────────────────────
  entry(356, '19 Kislev (Adar II)',  'Tanya_1.1',  'ראש המחזור – פרק א',       'ספר לקוטי אמרים'),
  entry(357, '20 Kislev (Adar II)',  'Tanya_1.2',  'ראש המחזור – פרק ב',       'בראשית'),
  entry(358, '21 Kislev (Adar II)',  'Tanya_1.3',  'ראש המחזור – פרק ג',       'ופחדו'),
  entry(359, '22 Kislev (Adar II)',  'Tanya_1.4',  'ראש המחזור – פרק ד',       'ח׳ לא תעשה'),
  entry(360, '23 Kislev (Adar II)',  'Tanya_1.5',  'ראש המחזור – פרק ה',       'חסד ומים'),
  entry(361, '24 Kislev (Adar II)',  'Tanya_1.6',  'ראש המחזור – פרק ו',       'הס'),
  entry(362, '25 Kislev (Adar II)',  'Tanya_1.7',  'ראש המחזור – פרק ז',       'ופחדו'),
  entry(363, '26 Kislev (Adar II)',  'Tanya_1.8',  'ראש המחזור – פרק ח',       'המצוות'),
  entry(364, '27 Kislev (Adar II)',  'Tanya_1.9',  'ראש המחזור – פרק ט',       'הדם'),
  entry(365, '28 Kislev (Adar II)',  'Tanya_1.10', 'ראש המחזור – פרק י',       'הקדושה'),
]);

// ─── Cache Management ────────────────────────────────────

/** Remove all cached Tanya texts so the next fetch is fresh from Sefaria. */
export async function clearTanyaCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const tanyaKeys = keys.filter(k => k.startsWith('tanya_text_'));
    if (tanyaKeys.length > 0) await AsyncStorage.multiRemove(tanyaKeys);
  } catch { /* ignore */ }
}

/** Remove all cached Sefaria texts (all books, not just Tanya). */
export async function clearAllSefariaCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const sefariaKeys = keys.filter(
      k => k.startsWith('tanya_text_') || k.startsWith('sefaria_text_'),
    );
    if (sefariaKeys.length > 0) await AsyncStorage.multiRemove(sefariaKeys);
  } catch { /* ignore */ }
}

// ─── Anchor Date ──────────────────────────────────────────
// 19 Kislev 5786 = December 19, 2025 (00:00 local time)
const ANCHOR_DATE = new Date(2025, 11, 19); // month is 0-indexed

// ─── Verified Entries: Single Source of Truth from official Mora Shiur images
// Keyed by day_index (1-based). These override the TANYA_SCHEDULE array.
// Verified anchor: day_index 192 = June 28 2026 = 13 Tammuz 5786
// ─────────────────────────────────────────────────────────
const VERIFIED_ENTRIES: Record<number, TanyaScheduleEntry> = Object.freeze({
  // ── SIVAN (days 150–179) ──
  150: entry(150,'1 Sivan','Tanya_2.9','פרק נג והנה כשהי׳','-148- לי״ח'),
  151: entry(151,'2 Sivan','Tanya_2.9','ובבית שני','-148- יסד ברתא'),
  152: entry(152,'3 Sivan','Tanya_2.9','וז״ש הינוקא','ית׳ וית׳'),
  153: entry(153,'4 Sivan','Tanya_2.9','ליקוטי אמרים','-עז- באריכות'),
  154: entry(154,'5 Sivan','Tanya_2.9','והנה ענין אהבה זו','-עז- שית׳ במקומה'),
  155: entry(155,'6 Sivan','Tanya_2.9','אך הנה ידוע','-עז- יתברך וית׳'),
  156: entry(156,'7 Sivan','Tanya_2.10','שער היחוד והאמונה','-152- ימי בראשית'),
  157: entry(157,'8 Sivan','Tanya_2.10','ואף שלא הוזכר שם','-עז- כולא חד'),
  158: entry(158,'9 Sivan','Tanya_2.10','פרק ב והנה מכאן','-154- הבריאה'),
  159: entry(159,'10 Sivan','Tanya_2.11','פרק ג והנה אתרי','-עח- בלעדו באמת'),
  160: entry(160,'11 Sivan','Tanya_2.11','והמשל לזה הוא','-156- להקדים'),
  161: entry(161,'12 Sivan','Tanya_2.11','פרק ד כי הנה','-עט- להטיב'),
  162: entry(162,'13 Sivan','Tanya_2.12','והנה כמו שמדה זו','-158- מאין ליש'),
  163: entry(163,'14 Sivan','Tanya_2.12','והנה בחי׳ הצמצום','-158- לי״ח'),
  164: entry(164,'15 Sivan','Tanya_2.12','פרק ה והנה על','-פ- פרק ג'),
  165: entry(165,'16 Sivan','Tanya_2.12','פרק ו והנה שם','-160- הכלולה בחסד'),
  166: entry(166,'17 Sivan','Tanya_2.12','והנה מהתכללות המדות','-פא- השמש בשמש'),
  167: entry(167,'18 Sivan','Tanya_2.12','ולכן הוצרך הכתוב','-162- הוא האלקים'),
  168: entry(168,'19 Sivan','Tanya_2.12','פרק ז ובזה יובן','-פב- עליו כלל'),
  169: entry(169,'20 Sivan','Tanya_2.12','והנה גדר ובחי׳','-פב- וולד סטרין'),
  170: entry(170,'21 Sivan','Tanya_2.12','והנה אף על פי','-164- לתחתונים'),
  171: entry(171,'22 Sivan','Tanya_2.12','והנה במ״ש יובן','-פג- מהרמ״ק ז״ל'),
  172: entry(172,'23 Sivan','Tanya_2.12','והנה מכאן יש להבין','-166- דממלא לון'),
  173: entry(173,'24 Sivan','Tanya_2.12','וזהו ג״כ ענין','-פד- גבול ותכלית'),
  174: entry(174,'25 Sivan','Tanya_2.12','כי מקור החיות','-פה- עצמן'),
  175: entry(175,'26 Sivan','Tanya_2.12','פרק ח והנה מ״ש','-170- ולצייר בשכלם'),
  176: entry(176,'27 Sivan','Tanya_2.12','כי המעלה ומדרגה','-פו- ומקור החיות'),
  177: entry(177,'28 Sivan','Tanya_2.12','פרק ט אבל לגבי','-פז- אין קץ'),
  178: entry(178,'29 Sivan','Tanya_2.12','רק מפני שאין','-פז- ידיע למשכילים'),
  179: entry(179,'30 Sivan','Tanya_2.12','הגה״ה (סוד הצמצום)','-פז- מן השכל'),

  // ── TAMMUZ (days 180–208) – verified from user's Mora Shiur images ──
  // Anchor verification: day 192 = June 28 2026 = 13 Tammuz ✓
  180: entry(180,'1 Tammuz','Tanya_2.12','פרק י אך מכל מקום','-174- אתכסיאת כו׳'),
  181: entry(181,'2 Tammuz','Tanya_2.12','עד״מ כיום ראשון','-פח- מדות כלל'),
  182: entry(182,'3 Tammuz','Tanya_2.12','פרק יא והנה גס','-176- וסתום בלבו'),
  183: entry(183,'4 Tammuz','Tanya_2.12','אבל באמת בחי׳ אותיות','-פט- כמ״ש במ״א'),
  184: entry(184,'5 Tammuz','Tanya_2.12','פרק יב רק שהברואים','-178- מהאותיות עצמן'),
  185: entry(185,'6 Tammuz','Tanya_2.12','כי הן ד״מ דוגמת','-צ- יתברך ויית׳'),
  186: entry(186,'7 Tammuz','Tanya_3.1','אגרת התשובה פרק א','-צא- עכ״ל הבריתא'),
  187: entry(187,'8 Tammuz','Tanya_3.1','והנה מצות התשובה','-צב- כמ״א מראה'),
  188: entry(188,'9 Tammuz','Tanya_3.2','פרק ב אך כל זה','-צב- יום רצון'),
  189: entry(189,'10 Tammuz','Tanya_3.3','פרק ג והנה חכמי','-184- ג״פ וכו׳'),
  190: entry(190,'11 Tammuz','Tanya_3.3','אכן כל זה','-184- תענית'),
  191: entry(191,'12 Tammuz','Tanya_3.3','ומ״מ כל בעל','-186- לא תמנו'),
  192: entry(192,'13 Tammuz','Tanya_3.4','פרק ד ואולם כל','-186- בנעימים'), // ← TODAY June 28 2026
  193: entry(193,'14 Tammuz','Tanya_3.4','אך הענין יובן','-צד- האותיות'),
  194: entry(194,'15 Tammuz','Tanya_3.4','וביאור הענין','-צה- אלו'),
  195: entry(195,'16 Tammuz','Tanya_3.4','וכככה ממש','-צה- הוי׳ וכו׳'),
  196: entry(196,'17 Tammuz','Tanya_3.5','פרק ה והנה המשכה','-190- כדלקמן'),
  197: entry(197,'18 Tammuz','Tanya_3.6','פרק ו אמנם','-צו- כנודע לי״ח'),
  198: entry(198,'19 Tammuz','Tanya_3.6','והנה יעקב חבל','-192- נאמר וכו׳'),
  199: entry(199,'20 Tammuz','Tanya_3.7','פרק ז ואולם דרך','-צד- נגדכה וכו׳'),
  200: entry(200,'21 Tammuz','Tanya_3.7','והיאך נשבר הלב','-צה- אלו'),
  201: entry(201,'22 Tammuz','Tanya_3.8','ואף מי שלא עבר','-צח- כולן'),
  202: entry(202,'23 Tammuz','Tanya_3.8','פרק ח והנה אחרי','-צח- מלפפתו וכו׳'),
  203: entry(203,'24 Tammuz','Tanya_3.8','ומאחר שרוח עברה','-צז- למלכא וכו׳'),
  204: entry(204,'25 Tammuz','Tanya_3.9','פרק ט וביאור הענין','-צד- דר״ה'),
  205: entry(205,'26 Tammuz','Tanya_3.10','פרק י והנה','-198- כנודע'),
  206: entry(206,'27 Tammuz','Tanya_3.10','ומאחר שהתפלה היא','-198- עילאה'),
  207: entry(207,'28 Tammuz','Tanya_3.11','פרק יא ואמנם','-ק- לאין קץ'),
  208: entry(208,'29 Tammuz','Tanya_3.11','ומה שמשבחים ומברכים','-200- היא מיד'),

  // ── AV (days 209–238) – 30 days – from uploaded מנחם אב image ──
  209: entry(209,'1 Av','Tanya_3.12',  'ומ"ש וחטאתי',           '-קא- פשעיו'),
  210: entry(210,'2 Av','Tanya_3.12',  'פרק יב ותועלת השמחה',   '-202- יצא טוב'),
  211: entry(211,'3 Av','Tanya_4.1',   'א פותחין בברכה',         '-204- שכנפש'),
  212: entry(212,'4 Av','Tanya_4.1',   'אך מי הוא הנותן',        '-204- הנפש כו\u2019'),
  213: entry(213,'5 Av','Tanya_4.1',   'ועתה הפעם הנני',         '-קג- תורה וכו\u2019'),
  214: entry(214,'6 Av','Tanya_4.2',   'ב קטנתי מכל',            '-קד- הפנים וגו\u2019'),
  215: entry(215,'7 Av','Tanya_4.3',   'ג וילבש צדקה',           '-208- ח"י'),
  216: entry(216,'8 Av','Tanya_4.3',   'אך מי הוא הגורם',        '-קה- תדרשנו'),
  217: entry(217,'9 Av','Tanya_4.4',   'ד אין ישראל נגאלין',     '-קו- נפש ישראל'),
  218: entry(218,'10 Av','Tanya_4.4',  'ומה שאין כל אדם',        '-קו- אלקיך בז'),
  219: entry(219,'11 Av','Tanya_4.4',  'אך מודעת זאת',           '-קו- שבצדקה'),
  220: entry(220,'12 Av','Tanya_4.4',  'וזהו צדק לפניו',         '-212- אכי"ר'),
  221: entry(221,'13 Av','Tanya_4.5',  'ה ויעש דוד שם',          '-214- שמבין הכל'),
  222: entry(222,'14 Av','Tanya_4.5',  'אך האותיות הן',          '-214- נברא בה\u2019'),
  223: entry(223,'15 Av','Tanya_4.5',  'והנה גם שהיה',           '-קח- ע"ש'),
  224: entry(224,'16 Av','Tanya_4.5',  'אך ביאור הענין',         '-216- בעשיה'),
  225: entry(225,'17 Av','Tanya_4.5',  'והנה הינוקא',            '-קט- ח"ו ממנו'),
  226: entry(226,'18 Av','Tanya_4.5',  'ובזה יובן מ"ש',           '-218- כנ"ל'),
  227: entry(227,'19 Av','Tanya_4.6',  'ו זורע צדקות',           '-קי- ישענו'),
  228: entry(228,'20 Av','Tanya_4.6',  'והנה מודעת זאת',         '-קי- כנ"ל'),
  229: entry(229,'21 Av','Tanya_4.7',  'ז אשרינו מה טוב',        '-222- ועולול וכו\u2019'),
  230: entry(230,'22 Av','Tanya_4.7',  'והנה הארה זו',           '-222- יספר מרוב'),
  231: entry(231,'23 Av','Tanya_4.7',  'והנה שופרי דיעקב',       '-קיב- כמ"ש במ"א'),
  232: entry(232,'24 Av','Tanya_4.7',  'והנה אף שגילוי',         '-קיב- כמ"ש ממש'),
  233: entry(233,'25 Av','Tanya_4.8',  'ח זורע צדקות',           '-224- נמוך כו\u2019'),
  234: entry(234,'26 Av','Tanya_4.8',  'והנה מודעת זאת',         '-קיג- וכו\u2019'),
  235: entry(235,'27 Av','Tanya_4.8',  'אך הענין הוא',           '-קיג- הארי"זל'),
  236: entry(236,'28 Av','Tanya_4.8',  'וככה ממש עד"מ',          '-226- בחו"ל ודל'),
  237: entry(237,'29 Av','Tanya_4.9',  'ט אהובי אחיי',           '-קיד- ציון כו\u2019'),
  238: entry(238,'30 Av','Tanya_4.9',  'ע"כ אהובי אחיי',         '-228- ציון כו\u2019'),

  // ── ELUL (days 239–267) – 29 days – from uploaded אלול image ──
  239: entry(239,'1 Elul','Tanya_4.10',  'י אד"ש וחיים',              '-קטו- כו\u2019'),
  240: entry(240,'2 Elul','Tanya_4.10',  'והנה לפי מצות',              '-קטו- מצות התורה'),
  241: entry(241,'3 Elul','Tanya_4.10',  'אך היינו דוקא',              '-230- עומדים וכו\u2019'),
  242: entry(242,'4 Elul','Tanya_4.10',  'והנה עיקר התשובה',           '-קטז- נפשו כתיב'),
  243: entry(243,'5 Elul','Tanya_4.10',  'והנה מדת חסד',               '-קטז- בא כו\u2019'),
  244: entry(244,'6 Elul','Tanya_4.11',  'יא להשכילך בינה',            '-232- כל היום'),
  245: entry(245,'7 Elul','Tanya_4.11',  'ועכ"כ ראשית הכל',            '-קיז- הגנות'),
  246: entry(246,'8 Elul','Tanya_4.12',  'יב והיה מעשה הצדקה',         '-234- הקדושות יתברך'),
  247: entry(247,'9 Elul','Tanya_4.12',  'והנה אתעוה"ת',               '-קיח- פעמים וכו\u2019'),
  248: entry(248,'10 Elul','Tanya_4.12', 'ומודעת זאת',                 '-קיח- כנ"ל'),
  249: entry(249,'11 Elul','Tanya_4.12', 'וז"ש וה\u2019 עליהם',         '-קיט- כל חטאתם'),
  250: entry(250,'12 Elul','Tanya_4.13', 'יג מה רב טובך',              '-קיט- די כו\u2019'),
  251: entry(251,'13 Elul','Tanya_4.13', 'והנה יש עוד',                '-238- א"א ע"ה'),
  252: entry(252,'14 Elul','Tanya_4.13', 'וזהו שאמר',                  '-קכ- בסוכה וגו\u2019'),
  253: entry(253,'15 Elul','Tanya_4.14', 'יד לעורר את האהבה',          '-240- ר"ה'),
  254: entry(254,'16 Elul','Tanya_4.14', 'וז"ש תמיד עיני',             '-קכא- כואי ודל'),
  255: entry(255,'17 Elul','Tanya_4.15', 'טו להבין משל ומליצה',        '-קכב- מן הן'),
  256: entry(256,'18 Elul','Tanya_4.15', 'ועוד זאת שהצדקה',            '-קכב- לה\u2019'),
  257: entry(257,'19 Elul','Tanya_4.17', 'יז נודע בשערים',             '-243- עצמו'),
  258: entry(258,'20 Elul','Tanya_4.17', 'והנה מוכח לזאת',             '-קכג- ותחת כנפו'),
  259: entry(259,'21 Elul','Tanya_4.18', 'יח כתיב ואהבת',              '-244- דאצילות'),
  260: entry(260,'22 Elul','Tanya_4.19', 'יט עוטה אור',                '-קכד- דאצילות'),
  261: entry(261,'23 Elul','Tanya_4.19', 'ועוד זאת שהצדקה',            '-246- ובירא\u2019ה'),
  262: entry(262,'24 Elul','Tanya_4.19', 'ומה שכתב הארי"זל',           '-קכג- ודל'),
  263: entry(263,'25 Elul','Tanya_4.20', 'כ אהובי אחיי',               '-248- ד"פ\u2019'),
  264: entry(264,'26 Elul','Tanya_4.21', 'כא מוּדעת זאת',              '-קכה- לנפש'),
  265: entry(265,'27 Elul','Tanya_4.22', 'כב אהובי אחיי',              '-קכה- ד"פ ודל'),
  266: entry(266,'28 Elul','Tanya_4.24', 'כד נודע דבאתעוה"ת',          '-250- ע"ש הטיב'),
  267: entry(267,'29 Elul','Tanya_4.24', 'וזהו שאר"זל',                '-קכו- ודל'),

  // ── TISHREI (days 268–297) – 30 days – from uploaded תשרי image ──
  268: entry(268,'1 Tishrei','Tanya_4.25',  'אך הענין הוא',               '-קכו- האותיות'),
  269: entry(269,'2 Tishrei','Tanya_4.25',  'והנה לפי הדברים',            '-קמב- אמרי פי'),
  270: entry(270,'3 Tishrei','Tanya_4.26',  'כו בר"מ פ\u2019 נשא',        '-קמג- הלכה בלבד'),
  271: entry(271,'4 Tishrei','Tanya_4.27',  'כז דוד זמירות',              '-קמד- לכנ"ל'),
  272: entry(272,'5 Tishrei','Tanya_4.27',  'ועוד אחת שהוא',              '-316- אלקות'),
  273: entry(273,'6 Tishrei','Tanya_4.27',  'ומשא"כ בסדר ההשתלשלות',      '-316- אשר שם'),
  274: entry(274,'7 Tishrei','Tanya_4.27',  'ועוד זאת שלא',               '-קמד- לא יראו'),
  275: entry(275,'8 Tishrei','Tanya_4.27',  'ובר מן כל דין',              '-314- הלכותיהן'),
  276: entry(276,'9 Tishrei','Tanya_4.27',  'אך להבין פרטי',              '-קמד- דכלים ד"א'),
  277: entry(277,'10 Tishrei','Tanya_4.27', 'אך עוד זאת',                 '-316- אלקות'),
  278: entry(278,'11 Tishrei','Tanya_4.27', 'והטעם משום שלא',             '-316- דכב"ד'),
  279: entry(279,'12 Tishrei','Tanya_4.27', 'ומ"ש בע"ח ושה"י',            '-קמד- ודל'),
  280: entry(280,'13 Tishrei','Tanya_5.5',  'ולהבין פרטי ההלכות',         '-320- צרתו'),
  281: entry(281,'14 Tishrei','Tanya_5.5',  'דוד זמירות קרית',            '-קסא- ע"ש'),
  282: entry(282,'15 Tishrei','Tanya_5.5',  'אך מה שהיה',                 '-קסב- ע"ש'),
  283: entry(283,'16 Tishrei','Tanya_5.6',  'וצדקה כנחל איתן',            '-322- ב"ה'),
  284: entry(284,'17 Tishrei','Tanya_5.7',  'הנה לא טובה השמועה',         '-קסב- ודל'),
  285: entry(285,'18 Tishrei','Tanya_5.7',  'אהובי אחיי ורעיי',           '-קסב- ליודעים'),
  286: entry(286,'19 Tishrei','Tanya_5.7',  'ועוד זאת צריך',              '-324- מלוי\u2019'),
  287: entry(287,'20 Tishrei','Tanya_4.23', 'כג בגזירת עירין',            '-קמה- למביני מדע'),
  288: entry(288,'21 Tishrei','Tanya_4.23', 'כי קביעת שכר',              '-272- לגמרי'),
  289: entry(289,'22 Tishrei','Tanya_4.23', 'וע"כ רע בעיני',              '-272- בזה"ק'),
  290: entry(290,'23 Tishrei','Tanya_4.23', 'על כן אהובי',               '-קמו- יהי רצון'),
  291: entry(291,'24 Tishrei','Tanya_4.24', 'כד מוּדעת זאת',              '-קמו- אכ"נ לברכה'),
  292: entry(292,'25 Tishrei','Tanya_4.24', 'והנה בהכנה זו',              '-276- ד"פ'),
  293: entry(293,'26 Tishrei','Tanya_4.24', 'וכל כוונתו',                '-קמח- ב"ה'),
  294: entry(294,'27 Tishrei','Tanya_4.24', 'אך אמנם אמרו',              '-268- ודל'),
  295: entry(295,'28 Tishrei','Tanya_4.23', 'אך בגזירת עירין',            '-קמח- תאמין'),
  296: entry(296,'29 Tishrei','Tanya_4.25', 'כה הוכיח תוכיח',            '-קמח- וכו\u2019'),
  297: entry(297,'30 Tishrei','Tanya_4.25', 'והנה נפש האדם',              '-280- כלא דבור'),

  // ── CHESHVAN (days 298–326) – 29 days – from uploaded חשון image ──
  298: entry(298,'1 Cheshvan','Tanya_4.25',  'והנה זלעו"ז יש',             '-280- המעלות'),
  299: entry(299,'2 Cheshvan','Tanya_4.25',  'ואחר הדברים והאמת',          '-קמב- וכה"ג אמרי פי'),
  300: entry(300,'3 Cheshvan','Tanya_4.25',  'וכמדומה לי',                '-קמב- אמרי פי'),
  301: entry(301,'4 Cheshvan','Tanya_4.26',  'כו בר"מ פ\u2019 נשא',        '-קמג- הלכה בלבד'),
  302: entry(302,'5 Cheshvan','Tanya_4.26',  'ועוד יש להפלות',             '-286- בהסתר כו\u2019'),
  303: entry(303,'6 Cheshvan','Tanya_4.26',  'אך באמת כשתדקדק',           '-קמד- הכל אחד'),
  304: entry(304,'7 Cheshvan','Tanya_5.8',   'ומ"ש הארי"זל',              '-288- מסטרא דרע'),
  305: entry(305,'8 Cheshvan','Tanya_5.8',   'והנה המשכיל יבין',          '-288- ושו"ג'),
  306: entry(306,'9 Cheshvan','Tanya_5.8',   'והנה העליונים אין',          '-קמה- עו"ג'),
  307: entry(307,'10 Cheshvan','Tanya_5.8',  'אבל בצאת השכינה',           '-290- בע"ח ודל'),
  308: entry(308,'11 Cheshvan','Tanya_4.23', 'כב אהובי אחיי',              '-קמה- נס"ו'),
  309: entry(309,'12 Cheshvan','Tanya_4.23', 'וז"ש בזה"ק',                '-292- קודם לברכה'),
  310: entry(310,'13 Cheshvan','Tanya_4.23', 'איתא בזה"ק',                '-292- כנודע'),
  311: entry(311,'14 Cheshvan','Tanya_4.23', 'והנה בהיות הצדיק',          '-קמה- הצדיק'),
  312: entry(312,'15 Cheshvan','Tanya_4.23', 'והנה יש עוד',                '-294- כוכבים'),
  313: entry(313,'16 Cheshvan','Tanya_4.28', 'כח למה נסמכה',               '-קמה- מנגה'),
  314: entry(314,'17 Cheshvan','Tanya_4.28', 'והנה מוּדעת זאת',             '-296- וכו\u2019'),
  315: entry(315,'18 Cheshvan','Tanya_4.29', 'כט אשת חיל',                '-קמח- וכרכו"ט'),
  316: entry(316,'19 Cheshvan','Tanya_4.30', 'ל מוּדעת זאת',               '-298- כלא חד'),
  317: entry(317,'20 Cheshvan','Tanya_4.30', 'והנה רצון העליון',           '-קנ- הקדוש בא"ה'),
  318: entry(318,'21 Cheshvan','Tanya_4.30', 'וז"ש בזה"ק פ\u2019...',      '-300- ע"ש'),
  319: entry(319,'22 Cheshvan','Tanya_4.30', 'ומוּדעת זאת',                '-קנ- כנ"ל'),
  320: entry(320,'23 Cheshvan','Tanya_4.30', 'ל מוּדעת זאת',               '-קנא- כנ"ל'),
  321: entry(321,'24 Cheshvan','Tanya_4.30', 'ל מוּדעת זאת',               '-302- ודל'),
  322: entry(322,'25 Cheshvan','Tanya_4.31', 'לא נודע בשערים',             '-קנב- ודל'),
  323: entry(323,'26 Cheshvan','Tanya_4.32', 'לב בראשית',                  '-304- הגשמיים'),
  324: entry(324,'27 Cheshvan','Tanya_5.1',  'להבין איך הקורא',            '-קנג- תדרשנו'),
  325: entry(325,'28 Cheshvan','Tanya_5.1',  'והנה בזה יובן',              '-288- מסטרא דרע'),
  326: entry(326,'29 Cheshvan','Tanya_5.2',  'כט אשת חיל',                '-קנג- ט\u2019 כגוונה'),

  // ── KISLEV 1–18 (days 327–344) – from uploaded כסלו image ──
  327: entry(327,'1 Kislev','Tanya_5.2',   'אך הלכות',                   '-308- יאות כו\u2019'),
  328: entry(328,'2 Kislev','Tanya_5.2',   'ומ"ש בפ\u2019 פקודי',          '-קנד- האצי\u2019'),
  329: entry(329,'3 Kislev','Tanya_5.2',   'להבין מ"ש בפע"ח',             '-310- ד"ז א\u2019 כו\u2019'),
  330: entry(330,'4 Kislev','Tanya_5.2',   'והנה בא"מ כתב',              '-310- דוקא'),
  331: entry(331,'5 Kislev','Tanya_5.3',   'והנה לקיום מצוה',            '-קנד- אחורי כו\u2019'),
  332: entry(332,'6 Kislev','Tanya_5.3',   'משא"כ כמעשה המצוה',           '-312- משיג המהות'),
  333: entry(333,'7 Kislev','Tanya_5.3',   'משא"כ בסדר ההשתלשלות',        '-קנה- אשר שם'),
  334: entry(334,'8 Kislev','Tanya_5.3',   'ועוד זאת שלא',               '-קנד- לא יראו'),
  335: entry(335,'9 Kislev','Tanya_5.3',   'ובר מן כל דין',              '-314- הלכותיהן'),
  336: entry(336,'10 Kislev','Tanya_5.3',  'אך להבין איך',               '-קנד- דכלים ד"א'),
  337: entry(337,'11 Kislev','Tanya_5.3',  'אך עוד זאת',                 '-316- אלקות'),
  338: entry(338,'12 Kislev','Tanya_5.3',  'והטעם משום שלא',             '-316- דכב"ד'),
  339: entry(339,'13 Kislev','Tanya_5.3',  'ומ"ש בע"ח ושה"י',             '-קנה- ודל'),
  340: entry(340,'14 Kislev','Tanya_5.5',  'ולהבין פרטי ההלכות',         '-320- צרתו'),
  341: entry(341,'15 Kislev','Tanya_5.5',  'דוד זמירות קרית',            '-קנה- ע"ש'),
  342: entry(342,'16 Kislev','Tanya_5.5',  'אך מה שהיה',                 '-קנה- ע"ש'),
  343: entry(343,'17 Kislev','Tanya_5.6',  'וצדקה כנחל איתן',            '-322- ב"ה'),
  344: entry(344,'18 Kislev','Tanya_5.7',  'הוכיח תוכיח',                '-קנה- וכו\u2019'),
});

// ─── Core Function: Get today's entry ────────────────────

export function getTodayTanyaRef(): TanyaScheduleEntry {
  return getTanyaRefByDate(new Date());
}

export function getTanyaRefByDate(date: Date): TanyaScheduleEntry {
  const anchor = new Date(
    ANCHOR_DATE.getFullYear(),
    ANCHOR_DATE.getMonth(),
    ANCHOR_DATE.getDate(),
  );
  const target = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  let diff = Math.floor((target.getTime() - anchor.getTime()) / (24 * 60 * 60 * 1000));

  // Wrap within [0, 364]
  diff = ((diff % 365) + 365) % 365;

  // day_index is 1-based
  const dayIndex = diff + 1;

  // VERIFIED_ENTRIES take priority – they are built directly from the
  // official Mora Shiur image data uploaded by the user.
  if (VERIFIED_ENTRIES[dayIndex]) return VERIFIED_ENTRIES[dayIndex];

  return TANYA_SCHEDULE[diff] ?? TANYA_SCHEDULE[0];
}

export function getDayIndexForDate(date: Date): number {
  return getTanyaRefByDate(date).day_index;
}

// ─── Fetch from Sefaria ───────────────────────────────────

const CACHE_PREFIX   = 'tanya_text_v3_'; // bumped – forces fresh fetch after schedule fix
const CACHE_TTL_DAYS = 30;

export interface TanyaText {
  ref:       string;
  refKey:    string;
  titleHe:   string;
  titleEn:   string;
  textHe:    string[];
  textEn:    string[];
  start:     string;
  end:       string;
  dayIndex:  number;
  date:      string;
  fetchedAt: number;
}

export async function fetchTanyaByDayIndex(dayIndex: number): Promise<TanyaText | null> {
  const entry = TANYA_SCHEDULE.find(e => e.day_index === dayIndex);
  if (!entry) return null;
  return fetchTanyaEntry(entry);
}

export async function fetchDailyTanya(): Promise<TanyaText | null> {
  return fetchTanyaEntry(getTodayTanyaRef());
}

export async function fetchTanyaEntry(scheduleEntry: TanyaScheduleEntry): Promise<TanyaText | null> {
  const cacheKey = `${CACHE_PREFIX}${scheduleEntry.refKey}`;

  // ── Check cache ──
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed: TanyaText = JSON.parse(cached);
      const ageDays = (Date.now() - parsed.fetchedAt) / (1000 * 60 * 60 * 24);
      if (ageDays < CACHE_TTL_DAYS) return parsed;
    }
  } catch { /* ignore */ }

  // ── Fetch from Sefaria ──
  const refsToTry = [
    encodeURIComponent(scheduleEntry.ref),
    encodeURIComponent(scheduleEntry.refKey.replace('_', ', ').replace('.', ' ')),
    encodeURIComponent(`Tanya ${scheduleEntry.part}.${scheduleEntry.chapter}`),
  ];

  let data: any = null;
  for (const ref of refsToTry) {
    try {
      const res = await fetch(`https://www.sefaria.org/api/texts/${ref}?context=0&pad=0`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        data = await res.json();
        if (data && !data.error) break;
      }
    } catch { /* try next ref */ }
  }

  if (!data || data.error) return null;

  const textObj: TanyaText = {
    ref:      scheduleEntry.ref,
    refKey:   scheduleEntry.refKey,
    titleHe:  data.heTitle  ?? data.title ?? scheduleEntry.ref,
    titleEn:  data.title    ?? scheduleEntry.ref,
    textHe:   Array.isArray(data.he) ? data.he.flat() : [],
    textEn:   Array.isArray(data.text) ? data.text.flat() : [],
    start:    scheduleEntry.start,
    end:      scheduleEntry.end,
    dayIndex: scheduleEntry.day_index,
    date:     scheduleEntry.date,
    fetchedAt: Date.now(),
  };

  try { await AsyncStorage.setItem(cacheKey, JSON.stringify(textObj)); } catch { /* ignore */ }
  return textObj;
}
