// Powered by OnSpace.AI
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import {
  BookContent,
  LearningType,
  READER_CONFIGS,
  fetchTanyaForDay,
  fetchChumashWithRashiForDay,
  fetchRambamForDay,
  fetchHayomYomForDay,
} from '@/services/sefariaService';
import { getElulTehillim, getPersonalTehillim, savePersonalTehillim } from '@/services/tehillimExtras';
import { getChapterVerses, getChapterVersesRange, chapterGematria, TEHILLIM_ATTRIBUTION } from '@/constants/tehillim/tehillimText';
import { getDailyTehillim } from '@/constants/tehillim/tehillimSchedule';
// clearAllSefariaCache purges every cached text so the refresh always fetches
// the correct chapter from the live schedule (fixes stale-cache / wrong-chapter bug)
import { clearAllSefariaCache } from '@/services/tanyaScheduleService';
import {
  getTodayHebrew,
  hebrewDayToGematria,
  hebrewMonthDisplay,
} from '@/services/hebrewCalendarService';

// Reading surface: white paper, black ink (independent of the app theme).
const PAPER = '#FFFFFF';
const INK = '#1A1A1A';
const RUBRIC = '#5F5F5F';
const GREEN = '#1B7A3D';
const HAIRLINE = '#E5E5E5';

// ─── Verse Component ──────────────────────────────────────
function VerseRow({ verse, text, fontSize }: { verse: number; text: string; fontSize: number }) {
  return (
    <View style={verseStyles.row}>
      <Text style={verseStyles.num}>{verse}</Text>
      <Text style={[verseStyles.text, { fontSize, lineHeight: fontSize * 1.75 }]}>{text}</Text>
    </View>
  );
}

const verseStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  num: {
    fontSize: FontSize.xs,
    color: GREEN,
    fontWeight: FontWeight.bold,
    minWidth: 24,
    marginTop: 4,
    textAlign: 'center',
  },
  text: {
    flex: 1,
    color: INK,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});

// ─── Book Section ─────────────────────────────────────────
function BookSection({ content, accentColor, fontSize }: { content: BookContent; accentColor: string; fontSize: number }) {
  const hebrewRef = content.ref && /^[\u05d0-\u05ea]/.test(content.ref) ? content.ref : null;
  return (
    <View style={secStyles.container}>
      <View style={[secStyles.header, { borderLeftColor: GREEN }]}>
        <Text style={[secStyles.title, { color: INK }]}>{content.titleHe || content.title}</Text>
        {hebrewRef ? (
          <Text style={secStyles.ref}>{hebrewRef}</Text>
        ) : null}
      </View>
      {content.sections.map((s, i) => (
        <VerseRow key={i} verse={s.verse} text={s.text} fontSize={fontSize} />
      ))}
    </View>
  );
}

const secStyles = StyleSheet.create({
  container: { marginBottom: Spacing.xl },
  header: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.md,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    textAlign: 'right',
  },
  ref: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'right',
  },
});

// ─── Font Size Control ────────────────────────────────────
function FontSizeControl({ size, onIncrease, onDecrease }: {
  size: number;
  onIncrease: () => void;
  onDecrease: () => void;
}) {
  return (
    <View style={fsStyles.container}>
      <Pressable onPress={onIncrease} style={fsStyles.btn} hitSlop={8}>
        <MaterialIcons name="text-increase" size={20} color={RUBRIC} />
      </Pressable>
      <Text style={fsStyles.label}>{size}</Text>
      <Pressable onPress={onDecrease} style={fsStyles.btn} hitSlop={8}>
        <MaterialIcons name="text-decrease" size={20} color={RUBRIC} />
      </Pressable>
    </View>
  );
}

const fsStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  btn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: HAIRLINE,
  },
  label: { fontSize: FontSize.sm, color: RUBRIC, minWidth: 24, textAlign: 'center' },
});

// ─── Main Screen ──────────────────────────────────────────
export default function ReaderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type: string }>();
  const type = (params.type ?? 'tehillim') as LearningType;
  const config = READER_CONFIGS[type] ?? READER_CONFIGS.tehillim;

  const [contents, setContents] = useState<BookContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(18);
  const [personalOpen, setPersonalOpen] = useState(false);
  const [personalList, setPersonalList] = useState<number[]>([]);
  const [chapterInput, setChapterInput] = useState('');
  // Tehillim has two sub-categories: the daily portion (+ personal chapters) and
  // the Elul "3 a day" schedule. Default to the daily portion.
  const [tehillimMode, setTehillimMode] = useState<'daily' | 'elul'>('daily');

  const { hdate } = useMemo(() => getTodayHebrew(), []);
  const hebrewDateLabel = useMemo(
    () => `${hebrewDayToGematria(hdate.getDate())} ${hebrewMonthDisplay(hdate.getMonth())}`,
    [hdate],
  );
  const gregDateLabel = useMemo(
    () => new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' }),
    [],
  );

  const loadContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      let result: BookContent[] = [];

      switch (type) {
        case 'tehillim': {
          // Local text — offline, instant, no foreign-letter issues.
          const build = (chapters: number[]): BookContent[] =>
            chapters.map((ch) => ({
              title: `Psalms ${ch}`,
              titleHe: `תהלים · פרק ${chapterGematria(ch)}`,
              sections: getChapterVerses(ch).map((txt, i) => ({ verse: i + 1, text: txt })),
              ref: `Psalms ${ch}`,
            }));
          const parts: BookContent[] = [];
          if (tehillimMode === 'elul') {
            // Chabad "3 chapters a day in Elul" (auto by today's Hebrew date)
            const elul = getElulTehillim(today);
            if (elul) parts.push(...build(elul));
            else
              parts.push({
                title: 'Elul',
                titleHe: 'תהלים לחודש אלול',
                sections: [{ verse: 1, text: 'החלוקה של שלושה פרקים ליום מוצגת בחודש אלול בלבד.' }],
                ref: 'Elul',
              });
          } else {
            // Daily portion by day of the month (Psalm 119 is split across days 25/26)
            for (const p of getDailyTehillim(hdate.getDate())) {
              const verses = getChapterVersesRange(p.chapter, p.from, p.to);
              parts.push({
                title: `Psalms ${p.chapter}`,
                titleHe: `תהלים · פרק ${chapterGematria(p.chapter)}${p.label ? ` · ${p.label}` : ''}`,
                sections: verses.map((txt, i) => ({ verse: (p.from ?? 1) + i, text: txt })),
                ref: `Psalms ${p.chapter}`,
              });
            }
            // The user's personal chapters — appended to the daily portion
            const personal = await getPersonalTehillim();
            if (personal.length) {
              for (const ch of personal) {
                parts.push({
                  title: `Psalms ${ch}`,
                  titleHe: `תהלים · פרק ${chapterGematria(ch)} · אישי`,
                  sections: getChapterVerses(ch).map((txt, i) => ({ verse: i + 1, text: txt })),
                  ref: `Psalms ${ch}`,
                });
              }
            }
          }
          result = parts;
          break;
        }
        case 'tanya': {
          const c = await fetchTanyaForDay(today);
          result = [c];
          break;
        }
        case 'chumash': {
          result = await fetchChumashWithRashiForDay(today);
          break;
        }
        case 'rambam': {
          result = await fetchRambamForDay(today);
          break;
        }
        case 'hayomyom': {
          const c = await fetchHayomYomForDay(today);
          result = [c];
          break;
        }
        default:
          result = [];
      }

      setContents(result.filter(c => c.sections.length > 0));
    } catch {
      setError('לא ניתן לטעון את הטקסט.\nבדוק את חיבור האינטרנט ונסה שוב.');
    } finally {
      setLoading(false);
    }
  }, [type, hdate, tehillimMode]);

  // ─── Force refresh: clears cache then reloads ─────────
  const forceRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await clearAllSefariaCache(); // bust stale cached chapter text
    } catch { /* ignore */ }
    setRefreshing(false);
    loadContent();
  }, [loadContent]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Personal Tehillim chapters
  useEffect(() => {
    if (type === 'tehillim') getPersonalTehillim().then(setPersonalList);
  }, [type]);
  const addPersonalChapter = () => {
    const n = parseInt(chapterInput, 10);
    if (!Number.isInteger(n) || n < 1 || n > 150) return;
    setPersonalList(prev => [...new Set([...prev, n])].sort((a, b) => a - b));
    setChapterInput('');
  };
  const savePersonalAndReload = async () => {
    const saved = await savePersonalTehillim(personalList);
    setPersonalList(saved);
    setPersonalOpen(false);
    loadContent();
  };

  const totalVerses = contents.reduce((sum, c) => sum + c.sections.length, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <MaterialIcons name="arrow-forward" size={24} color={INK} />
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={[styles.iconCircle, { backgroundColor: config.color + '25' }]}>
            <Text style={styles.headerIcon}>{config.icon}</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>{config.title}</Text>
            <Text style={styles.headerDate}>{hebrewDateLabel} · {gregDateLabel}</Text>
          </View>
        </View>

        {type === 'tehillim' ? (
          <Pressable
            onPress={() => setPersonalOpen(true)}
            style={[styles.refreshBtn, { backgroundColor: config.color + '18', marginRight: 6 }]}
            hitSlop={8}
            accessibilityLabel="הוסף פרקים אישיים"
          >
            <MaterialIcons name="playlist-add" size={22} color={config.color} />
          </Pressable>
        ) : null}

        {/* Refresh button – clears cache and reloads fresh chapter */}
        <Pressable
          onPress={forceRefresh}
          style={[styles.refreshBtn, { backgroundColor: config.color + '18' }]}
          hitSlop={8}
          disabled={refreshing || loading}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={config.color} />
          ) : (
            <MaterialIcons name="refresh" size={22} color={config.color} />
          )}
        </Pressable>
      </View>

      {/* Meta bar */}
      {!loading && !error && totalVerses > 0 ? (
        <View style={styles.metaBar}>
          <Text style={styles.metaText}>{config.description}</Text>
          <View style={styles.metaRight}>
            <Text style={styles.metaCount}>{totalVerses} פסוקים</Text>
            <FontSizeControl
              size={fontSize}
              onIncrease={() => setFontSize(s => Math.min(s + 2, 30))}
              onDecrease={() => setFontSize(s => Math.max(s - 2, 14))}
            />
          </View>
        </View>
      ) : null}

      {/* Tehillim: two sub-categories + prominent add-personal button */}
      {type === 'tehillim' ? (
        <>
          <View style={styles.modeRow}>
            <Pressable
              onPress={() => setTehillimMode('daily')}
              style={[styles.modePill, tehillimMode === 'daily' && styles.modePillActive]}
            >
              <Text style={[styles.modePillText, tehillimMode === 'daily' && styles.modePillTextActive]}>תהלים יומי</Text>
            </Pressable>
            <Pressable
              onPress={() => setTehillimMode('elul')}
              style={[styles.modePill, tehillimMode === 'elul' && styles.modePillActive]}
            >
              <Text style={[styles.modePillText, tehillimMode === 'elul' && styles.modePillTextActive]}>תהלים לחודש אלול</Text>
            </Pressable>
          </View>
          {tehillimMode === 'daily' ? (
            <Pressable onPress={() => setPersonalOpen(true)} style={styles.addPersonalBtn}>
              <MaterialIcons name="playlist-add" size={18} color={GREEN} />
              <Text style={styles.addPersonalText}>הוסף פרקי תהילים אישיים</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}

      {/* Content */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={config.color} />
          <Text style={styles.loadingText}>טוען טקסט מ-Sefaria...</Text>
          <Text style={styles.loadingSubText}>זה עשוי לקחת כמה שניות</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorIcon}>📡</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={[styles.retryBtn, { backgroundColor: config.color }]} onPress={loadContent}>
            <Text style={styles.retryText}>נסה שנית</Text>
          </Pressable>
          <Pressable
            style={[styles.retryBtn, { backgroundColor: Colors.surface, borderWidth: 1, borderColor: config.color }]}
            onPress={forceRefresh}
          >
            <Text style={[styles.retryText, { color: config.color }]}>נקה מטמון ורענן</Text>
          </Pressable>
        </View>
      ) : contents.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorIcon}>📭</Text>
          <Text style={styles.errorText}>לא נמצא תוכן להיום</Text>
          <Pressable style={[styles.retryBtn, { backgroundColor: config.color }]} onPress={forceRefresh}>
            <Text style={styles.retryText}>נקה מטמון ורענן</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Bismillah */}
          <View style={[styles.bismillah, { borderColor: config.color + '40' }]}>
            <Text style={[styles.bismillahText, { color: config.color }]}>ב״ה</Text>
          </View>

          {contents.map((c, i) => (
            <BookSection key={i} content={c} accentColor={config.color} fontSize={fontSize} />
          ))}

          {/* Source note */}
          <View style={styles.sourceNote}>
            <MaterialIcons name="info-outline" size={14} color={RUBRIC} />
            <Text style={styles.sourceText}>
              {type === 'tehillim' ? TEHILLIM_ATTRIBUTION : 'מקור: Sefaria · ספרייה יהודית פתוחה'}
            </Text>
          </View>

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      )}

      {/* Personal Tehillim chapters modal */}
      <Modal visible={personalOpen} transparent animationType="fade" onRequestClose={() => setPersonalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>פרקי תהילים אישיים</Text>
            <Text style={styles.modalSub}>פרקים שיתווספו בכל יום בסוף התהילים</Text>
            <View style={styles.modalInputRow}>
              <Pressable style={styles.modalAddBtn} onPress={addPersonalChapter}>
                <Text style={styles.modalAddText}>הוסף</Text>
              </Pressable>
              <TextInput
                style={styles.modalInput}
                value={chapterInput}
                onChangeText={setChapterInput}
                keyboardType="number-pad"
                placeholder="מספר פרק (1–150)"
                placeholderTextColor={Colors.textMuted}
                onSubmitEditing={addPersonalChapter}
                maxLength={3}
              />
            </View>
            <View style={styles.chipsWrap}>
              {personalList.length === 0 ? (
                <Text style={styles.modalEmpty}>לא נבחרו פרקים</Text>
              ) : (
                personalList.map(n => (
                  <Pressable key={n} style={styles.chip} onPress={() => setPersonalList(prev => prev.filter(x => x !== n))}>
                    <Text style={styles.chipText}>פרק {chapterGematria(n)}</Text>
                    <MaterialIcons name="close" size={14} color={Colors.primary} />
                  </Pressable>
                ))
              )}
            </View>
            <View style={styles.modalBtns}>
              <Pressable style={styles.modalCancel} onPress={() => setPersonalOpen(false)}>
                <Text style={styles.modalCancelText}>ביטול</Text>
              </Pressable>
              <Pressable style={styles.modalSave} onPress={savePersonalAndReload}>
                <Text style={styles.modalSaveText}>שמור</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PAPER },

  // Personal-chapters modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: Spacing.lg },
  modalCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, textAlign: 'right' },
  modalSub: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'right', marginTop: -6 },
  modalInputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  modalInput: { flex: 1, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 10, color: Colors.text, fontSize: FontSize.md, textAlign: 'right' },
  modalAddBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 11 },
  modalAddText: { color: Colors.background, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, minHeight: 32 },
  modalEmpty: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'right', width: '100%' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primaryDim, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 5 },
  chipText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  modalBtns: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  modalCancel: { flex: 1, paddingVertical: 12, borderRadius: Radius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  modalCancelText: { color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  modalSave: { flex: 1, paddingVertical: 12, borderRadius: Radius.md, alignItems: 'center', backgroundColor: Colors.primary },
  modalSaveText: { color: Colors.background, fontWeight: FontWeight.bold },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: HAIRLINE,
    backgroundColor: PAPER,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F2',
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: { fontSize: 22 },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: INK,
    textAlign: 'right',
  },
  headerDate: {
    fontSize: FontSize.xs,
    color: RUBRIC,
    textAlign: 'right',
  },

  // Meta bar
  metaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#F7F7F5',
    borderBottomWidth: 1,
    borderBottomColor: HAIRLINE,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: RUBRIC,
    flex: 1,
    textAlign: 'right',
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  metaCount: {
    fontSize: FontSize.xs,
    color: RUBRIC,
  },

  // Loading / Error
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: RUBRIC,
    textAlign: 'center',
  },
  loadingSubText: {
    fontSize: FontSize.sm,
    color: RUBRIC,
    textAlign: 'center',
  },
  errorIcon: { fontSize: 48 },
  errorText: {
    fontSize: FontSize.md,
    color: RUBRIC,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
  },
  retryText: {
    color: Colors.background,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.md,
  },

  // Scroll
  scroll: { flex: 1, backgroundColor: PAPER },
  content: { padding: Spacing.lg, backgroundColor: PAPER },

  // Tehillim mode switch (יומי / אלול)
  modeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: PAPER,
  },
  modePill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: Radius.full,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GREEN,
    backgroundColor: PAPER,
  },
  modePillActive: { backgroundColor: GREEN },
  modePillText: { color: GREEN, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  modePillTextActive: { color: '#FFFFFF' },
  addPersonalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    paddingVertical: 11,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: GREEN,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(27,122,61,0.06)',
  },
  addPersonalText: { color: GREEN, fontWeight: FontWeight.bold, fontSize: FontSize.sm },

  // Bismillah
  bismillah: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  bismillahText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },

  // Source
  sourceNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: HAIRLINE,
  },
  sourceText: { fontSize: FontSize.xs, color: RUBRIC },
});
