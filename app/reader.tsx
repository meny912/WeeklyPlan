// Powered by OnSpace.AI
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import {
  BookContent,
  LearningType,
  READER_CONFIGS,
  fetchTehillimForDay,
  fetchTanyaForDay,
  fetchChumashWithRashiForDay,
  fetchRambamForDay,
  fetchHayomYomForDay,
} from '@/services/sefariaService';
// clearAllSefariaCache purges every cached text so the refresh always fetches
// the correct chapter from the live schedule (fixes stale-cache / wrong-chapter bug)
import { clearAllSefariaCache } from '@/services/tanyaScheduleService';
import {
  getTodayHebrew,
  hebrewDayToGematria,
  hebrewMonthDisplay,
} from '@/services/hebrewCalendarService';

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
    color: Colors.primary,
    fontWeight: FontWeight.bold,
    minWidth: 24,
    marginTop: 4,
    textAlign: 'center',
  },
  text: {
    flex: 1,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});

// ─── Book Section ─────────────────────────────────────────
function BookSection({ content, accentColor, fontSize }: { content: BookContent; accentColor: string; fontSize: number }) {
  const hebrewRef = content.ref && /^[\u05d0-\u05ea]/.test(content.ref) ? content.ref : null;
  return (
    <View style={secStyles.container}>
      <View style={[secStyles.header, { borderLeftColor: accentColor }]}>
        <Text style={[secStyles.title, { color: accentColor }]}>{content.titleHe || content.title}</Text>
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
        <MaterialIcons name="text-increase" size={20} color={Colors.textSecondary} />
      </Pressable>
      <Text style={fsStyles.label}>{size}</Text>
      <Pressable onPress={onDecrease} style={fsStyles.btn} hitSlop={8}>
        <MaterialIcons name="text-decrease" size={20} color={Colors.textSecondary} />
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
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, minWidth: 24, textAlign: 'center' },
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
          const portions = await fetchTehillimForDay(hdate.getDate());
          result = portions;
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
  }, [type, hdate]);

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

  const totalVerses = contents.reduce((sum, c) => sum + c.sections.length, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <MaterialIcons name="arrow-forward" size={24} color={Colors.text} />
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
            <MaterialIcons name="info-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.sourceText}>מקור: Sefaria · ספרייה יהודית פתוחה</Text>
          </View>

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
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
    color: Colors.text,
    textAlign: 'right',
  },
  headerDate: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'right',
  },

  // Meta bar
  metaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
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
    color: Colors.textMuted,
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
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  loadingSubText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  errorIcon: { fontSize: 48 },
  errorText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
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
  scroll: { flex: 1 },
  content: { padding: Spacing.lg },

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
    borderTopColor: Colors.border,
  },
  sourceText: { fontSize: FontSize.xs, color: Colors.textMuted },
});
