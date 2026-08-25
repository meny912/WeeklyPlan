
// Powered by OnSpace.AI
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import {
  fetchZmanim,
  buildZmanimDisplay,
  formatZmanTime,
  ZmanimResult,
  ZmanDisplay,
} from '@/services/zmanimService';
import { getTanyaRefByDate } from '@/services/tanyaScheduleService';
import { getDailyLearning } from '@/services/dailyLearningService';
import { getTodayHebrew, hebrewDayToGematria, hebrewMonthDisplay } from '@/services/hebrewCalendarService';
import { getHayomYomText } from '@/constants/hayomyom';
import { CHABAD_SIDDUR, currentTefillahId, type SiddurCategory, type SiddurTag } from '@/constants/siddur/chabadSiddur';
import { getLuachContext } from '@/services/luachContext';
import { useTranslation, useDayLabels } from '@/contexts/SettingsContext';

const DAY_KEYS_ORDER = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// ─── Learning category configs (translated dynamically) ────

function useLearningCategories() {
  const { t } = useTranslation();
  return useMemo(() => [
    {
      id: 'hayomyom',
      title: 'היום יום',
      subtitle: t('cat_hayomyom_sub'),
      description: t('cat_hayomyom_desc'),
      icon: '✨',
      color: '#E8A838',
      bgColor: '#E8A83815',
    },
    {
      id: 'tehillim',
      title: 'תהלים',
      subtitle: t('cat_tehillim_sub'),
      description: t('cat_tehillim_desc'),
      icon: '📜',
      color: '#9B7FCC',
      bgColor: '#9B7FCC15',
    },
    {
      id: 'chumash',
      title: 'חומש',
      subtitle: t('cat_chumash_sub'),
      description: t('cat_chumash_desc'),
      icon: '📕',
      color: '#E67E45',
      bgColor: '#E67E4515',
    },
    {
      id: 'tanya',
      title: 'תניא',
      subtitle: t('cat_tanya_sub'),
      description: t('cat_tanya_desc'),
      icon: '📗',
      color: '#4CAF8A',
      bgColor: '#4CAF8A15',
    },
    {
      id: 'rambam',
      title: 'רמב״ם',
      subtitle: t('cat_rambam_sub'),
      description: t('cat_rambam_desc'),
      icon: '📘',
      color: '#5BAFD6',
      bgColor: '#5BAFD615',
    },
  ], [t]);
}

// ─── Zman Row ──────────────────────────────────────────────
function ZmanRow({ item, now }: { item: ZmanDisplay; now: Date }) {
  const timeStr = formatZmanTime(item.iso);
  const isPast  = item.iso ? new Date(item.iso) < now : false;

  return (
    <View style={[
      zmanStyles.row,
      item.highlight && zmanStyles.rowHighlight,
      item.isShabbat && zmanStyles.rowShabbat,
      isPast && zmanStyles.rowPast,
    ]}>
      <Text style={[zmanStyles.time, isPast && zmanStyles.timePast, item.isShabbat && zmanStyles.timeShabbat]}>
        {timeStr}
      </Text>
      <View style={zmanStyles.body}>
        <Text style={[zmanStyles.label, isPast && zmanStyles.labelPast]}>{item.label}</Text>
        {item.sublabel ? <Text style={zmanStyles.sublabel}>{item.sublabel}</Text> : null}
      </View>
      <Text style={zmanStyles.icon}>{item.icon}</Text>
    </View>
  );
}

const zmanStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 11,
    paddingHorizontal: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.sm,
  },
  rowHighlight: { backgroundColor: 'rgba(245,166,35,0.04)' },
  rowShabbat: { backgroundColor: 'rgba(91,175,214,0.08)' },
  rowPast: { opacity: 0.42 },
  time: {
    fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary,
    width: 54, textAlign: 'left', fontVariant: ['tabular-nums'],
  },
  timePast: { color: Colors.textMuted },
  timeShabbat: { color: '#5BAFD6' },
  body: { flex: 1 },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text, textAlign: 'right' },
  labelPast: { color: Colors.textSecondary },
  sublabel: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', marginTop: 1 },
  icon: { fontSize: 20, width: 28, textAlign: 'center' },
});

// ─── Category Card ─────────────────────────────────────────
function CategoryCard({
  id, title, subtitle, description, icon, color, bgColor, onPress, learningInfo, preview,
}: {
  id: string; title: string; subtitle: string; description: string;
  icon: string; color: string; bgColor: string;
  onPress: () => void; learningInfo?: string; preview?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [catStyles.card, pressed && { opacity: 0.82 }]}
    >
      <View style={[catStyles.stripe, { backgroundColor: color }]} />
      <View style={catStyles.cardInner}>
        <View style={catStyles.cardTop}>
          <View style={[catStyles.iconWrap, { backgroundColor: bgColor }]}>
            <Text style={catStyles.icon}>{icon}</Text>
          </View>
          <View style={catStyles.body}>
            <Text style={catStyles.title}>{title}</Text>
            <Text style={catStyles.subtitle} numberOfLines={1}>{learningInfo ?? subtitle}</Text>
            <Text style={catStyles.desc}>{description}</Text>
          </View>
          <View style={[catStyles.arrow, { backgroundColor: bgColor }]}>
            <MaterialIcons name="chevron-left" size={20} color={color} />
          </View>
        </View>
        {preview ? (
          <View style={[catStyles.previewBox, { borderTopColor: color + '25' }]}>
            <Text style={catStyles.previewText} numberOfLines={2}>{preview}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const catStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.border, marginBottom: Spacing.sm, overflow: 'hidden',
  },
  stripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  cardInner: { paddingLeft: Spacing.md + 3 },
  cardTop: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingRight: Spacing.sm, paddingVertical: Spacing.md,
  },
  iconWrap: { width: 52, height: 52, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  icon: { fontSize: 28 },
  body: { flex: 1, gap: 2 },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text, textAlign: 'right' },
  subtitle: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold, textAlign: 'right' },
  desc: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right' },
  arrow: { width: 32, height: 32, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  previewBox: { borderTopWidth: 1, paddingVertical: Spacing.sm, paddingRight: Spacing.sm, paddingLeft: 0 },
  previewText: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'right', lineHeight: 18, fontStyle: 'italic' },
});

// ─── Prayer Row (Chabad siddur categories, shown above daily learning) ──
function PrayerRow({ category, highlight, onPress }: { category: SiddurCategory; highlight?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [prayerStyles.row, highlight && prayerStyles.rowHi, pressed && { opacity: 0.82 }]}>
      <View style={[prayerStyles.icon, highlight && prayerStyles.iconHi]}>
        <MaterialIcons name={category.icon as any} size={20} color={highlight ? Colors.background : Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={prayerStyles.title}>{category.title}</Text>
        {!!category.subtitle && <Text style={prayerStyles.sub} numberOfLines={1}>{category.subtitle}</Text>}
      </View>
      {highlight && <Text style={prayerStyles.nowPill}>עכשיו</Text>}
      <MaterialIcons name="chevron-left" size={22} color={Colors.textSecondary} />
    </Pressable>
  );
}

const prayerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.sm + 2,
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  rowHi: { borderColor: Colors.primary, backgroundColor: Colors.surfaceElevated },
  icon: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.primaryDim, alignItems: 'center', justifyContent: 'center' },
  iconHi: { backgroundColor: Colors.primary },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, textAlign: 'right' },
  sub: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'right', marginTop: 1 },
  nowPill: {
    fontSize: FontSize.xs, color: Colors.primary, backgroundColor: 'rgba(245,166,35,0.12)',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full, overflow: 'hidden',
  },
});

// ─── Section Header ────────────────────────────────────────
function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <View style={secStyles.container}>
      <View style={{ gap: 2 }}>
        <Text style={secStyles.title}>{title}</Text>
        {subtitle ? <Text style={secStyles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={secStyles.icon}>{icon}</Text>
    </View>
  );
}

const secStyles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.sm, marginTop: Spacing.lg,
  },
  icon: { fontSize: 26 },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, textAlign: 'right' },
  subtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'right' },
});

// ─── Tab Selector ──────────────────────────────────────────
type Tab = 'learning' | 'zmanim';

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const { t } = useTranslation();
  return (
    <View style={tabStyles.bar}>
      <Pressable
        style={[tabStyles.btn, active === 'learning' && tabStyles.btnActive]}
        onPress={() => onChange('learning')}
      >
        <Text style={[tabStyles.text, active === 'learning' && tabStyles.textActive]}>
          {t('tab_learning')}
        </Text>
      </Pressable>
      <Pressable
        style={[tabStyles.btn, active === 'zmanim' && tabStyles.btnActive]}
        onPress={() => onChange('zmanim')}
      >
        <Text style={[tabStyles.text, active === 'zmanim' && tabStyles.textActive]}>
          {t('tab_zmanim')}
        </Text>
      </Pressable>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: 4, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  btn: { flex: 1, paddingVertical: 10, borderRadius: Radius.md, alignItems: 'center' },
  btnActive: { backgroundColor: Colors.primary },
  text: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  textActive: { color: Colors.background, fontWeight: FontWeight.bold },
});

// ─── Main Screen ───────────────────────────────────────────
export default function TodayScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const dayLabels = useDayLabels();
  const categories = useLearningCategories();

  const [zmanimResult, setZmanimResult] = useState<ZmanimResult | null>(null);
  const [zmanimError, setZmanimError]   = useState<string | null>(null);
  const [loadingZmanim, setLoadingZmanim] = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [activeTab, setActiveTab]       = useState<Tab>('learning');
  const [now, setNow]                   = useState(new Date());

  // ── Hebrew date ────────────────────────────────────────────
  const { hdate } = useMemo(() => getTodayHebrew(), []);

  const todayHebrewLabel = useMemo(() => {
    const day   = hebrewDayToGematria(hdate.getDate());
    const month = hebrewMonthDisplay(hdate.getMonth());
    return `${day} ${month}`;
  }, [hdate]);

  // ── Day name (reactive via useDayLabels) ────────────────────
  const todayDayKey  = DAY_KEYS_ORDER[new Date().getDay()];
  const todayDayName = dayLabels[todayDayKey] ?? '';

  // ── Learning content ────────────────────────────────────────
  const learningItems = useMemo(() => {
    try { return getDailyLearning(new Date()); } catch { return []; }
  }, [hdate]);

  // ── Chabad siddur categories relevant to today (shown above daily learning) ──
  const siddurHourId = useMemo(() => currentTefillahId(new Date()), []);
  const siddurCategories = useMemo(() => {
    try {
      const c = getLuachContext(new Date());
      const active = new Set<SiddurTag>(['always']);
      if (c.isRoshChodesh) active.add('roshChodesh');
      if (c.isCholHamoed) active.add('cholHamoed');
      if (c.omerDay != null) active.add('omer');
      if (c.isChanukah) active.add('chanukah');
      if (c.isPurim) active.add('purim');
      const vis = CHABAD_SIDDUR.filter(cat => cat.tags.some(t => active.has(t)));
      // Put the prayer-of-the-hour first.
      return vis.sort((a, b) => (a.id === siddurHourId ? -1 : b.id === siddurHourId ? 1 : 0));
    } catch {
      return [];
    }
  }, [hdate, siddurHourId]);

  const tanyaScheduleEntry = useMemo(() => {
    try { return getTanyaRefByDate(new Date()); } catch { return null; }
  }, [hdate]);

  const getLearningSubtitle = (id: string) => {
    if (id === 'tanya' && tanyaScheduleEntry) {
      return `${tanyaScheduleEntry.date}  ·  יום ${tanyaScheduleEntry.day_index} / 365`;
    }
    return learningItems.find(i => i.id === id)?.subtitle;
  };

  const tanyaPortionPreview = useMemo(() => {
    if (!tanyaScheduleEntry) return undefined;
    const { start, end, ref } = tanyaScheduleEntry;
    return `${ref}  ·  ${start} … ${end}`;
  }, [tanyaScheduleEntry]);

  const hayomYomPreview = useMemo(() => {
    try {
      const text = getHayomYomText(hdate.getMonth(), hdate.getDate());
      if (!text) return undefined;
      const firstLine = text.split('\n')[0].replace(/^\*.*?\*\s*/, '').trim();
      return firstLine.length > 120 ? firstLine.slice(0, 120) + '...' : firstLine;
    } catch { return undefined; }
  }, [hdate]);

  // ── Zmanim ─────────────────────────────────────────────────
  const loadZmanim = useCallback(async (force = false) => {
    if (!force && zmanimResult) return;
    try {
      setZmanimError(null);
      setLoadingZmanim(true);
      const result = await fetchZmanim();
      setZmanimResult(result);
    } catch {
      setZmanimError(t('zmanim_error'));
    } finally {
      setLoadingZmanim(false);
      setRefreshing(false);
    }
  }, [zmanimResult, t]);

  useEffect(() => {
    if (activeTab === 'zmanim') loadZmanim();
  }, [activeTab, loadZmanim]);

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(i);
  }, []);

  const zmanimDisplay = useMemo(() => {
    if (!zmanimResult) return [];
    return buildZmanimDisplay(zmanimResult, now);
  }, [zmanimResult, now]);

  const nextZman = useMemo(
    () => zmanimDisplay.find(z => z.iso && new Date(z.iso) > now),
    [zmanimDisplay, now],
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadZmanim(true);
  }, [loadZmanim]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Date Hero */}
        <View style={styles.dateHero}>
          <View style={styles.dateLeft}>
            <Text style={styles.hebrewDate}>{todayHebrewLabel}</Text>
            {/* todayDayName re-renders on language switch */}
            <Text style={styles.dayName}>{todayDayName}</Text>
            <Text style={styles.gregDate}>
              {new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          <View style={styles.clockBox}>
            <Text style={styles.clockText}>
              {now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </Text>
            {nextZman && activeTab === 'zmanim' ? (
              <Text style={styles.nextZmanPill}>{nextZman.icon} {formatZmanTime(nextZman.iso)}</Text>
            ) : null}
          </View>
        </View>

        {/* Tab Bar */}
        <TabBar active={activeTab} onChange={setActiveTab} />

        {/* ── Learning Tab ── */}
        {activeTab === 'learning' ? (
          <>
            {hayomYomPreview ? (
              <Pressable
                style={styles.inspirationCard}
                onPress={() => router.push({ pathname: '/reader', params: { type: 'hayomyom' } })}
              >
                <View style={styles.inspirationHeader}>
                  <Text style={styles.inspirationIcon}>✨</Text>
                  <Text style={styles.inspirationLabel}>היום יום – {todayHebrewLabel}</Text>
                  <MaterialIcons name="chevron-left" size={16} color={Colors.primary} />
                </View>
                <Text style={styles.inspirationText}>{hayomYomPreview}</Text>
              </Pressable>
            ) : null}

            {/* Prayers (Chabad siddur) — above the daily learning */}
            {siddurCategories.length > 0 ? (
              <>
                <SectionHeader icon="🕍" title="תפילות" subtitle="סידור חב״ד · מותאם ליום" />
                {siddurCategories.map(cat => (
                  <PrayerRow
                    key={cat.id}
                    category={cat}
                    highlight={cat.id === siddurHourId}
                    onPress={() => router.push({ pathname: '/siddur', params: { open: cat.id } })}
                  />
                ))}
              </>
            ) : null}

            <SectionHeader
              icon="📚"
              title={t('daily_studies_title')}
              subtitle={t('daily_studies_sub')}
            />

            {categories.map(cat => (
              <CategoryCard
                key={cat.id}
                {...cat}
                learningInfo={getLearningSubtitle(cat.id)}
                preview={
                  cat.id === 'hayomyom' ? hayomYomPreview :
                  cat.id === 'tanya'    ? tanyaPortionPreview :
                  undefined
                }
                onPress={() => router.push({ pathname: '/reader', params: { type: cat.id } })}
              />
            ))}

            <View style={styles.sefariaNote}>
              <MaterialIcons name="info-outline" size={13} color={Colors.textMuted} />
              <Text style={styles.sefariaText}>{t('sefaria_credit')}</Text>
            </View>
          </>
        ) : (
          <>
            <SectionHeader
              icon="⏰"
              title={t('tab_zmanim')}
              subtitle={zmanimResult?.location
                ? `${t('location_prefix')}${zmanimResult.location}`
                : undefined}
            />
            {nextZman && !loadingZmanim ? (
              <View style={styles.nextZmanBanner}>
                <View>
                  <Text style={styles.nextZmanLabel}>{t('next_zman_label')}</Text>
                  <Text style={styles.nextZmanName}>{nextZman.icon} {nextZman.label}</Text>
                </View>
                <Text style={styles.nextZmanTime}>{formatZmanTime(nextZman.iso)}</Text>
              </View>
            ) : null}

            {loadingZmanim ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>{t('loading_zmanim')}</Text>
              </View>
            ) : zmanimError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{zmanimError}</Text>
                <Pressable style={styles.retryBtn} onPress={() => loadZmanim(true)}>
                  <Text style={styles.retryText}>{t('retry_btn')}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.zmanimCard}>
                {zmanimDisplay.map(item => (
                  <ZmanRow key={item.key} item={item} now={now} />
                ))}
                <View style={styles.zmanimFooter}>
                  <MaterialIcons name="info-outline" size={12} color={Colors.textMuted} />
                  <Text style={styles.zmanimFooterText}>{t('zmanim_source')}</Text>
                </View>
              </View>
            )}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

  dateHero: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  dateLeft: { gap: 3 },
  dayName: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right' },
  hebrewDate: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.primary, textAlign: 'right' },
  gregDate: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right' },
  clockBox: { alignItems: 'flex-end', gap: 6 },
  clockText: { fontSize: 30, fontWeight: FontWeight.bold, color: Colors.text, fontVariant: ['tabular-nums'] },
  nextZmanPill: {
    fontSize: FontSize.xs, color: Colors.primary,
    backgroundColor: 'rgba(245,166,35,0.12)', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full, overflow: 'hidden',
  },

  nextZmanBanner: {
    backgroundColor: 'rgba(245,166,35,0.08)', borderRadius: Radius.lg, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.md, borderWidth: 1, borderColor: 'rgba(245,166,35,0.25)',
  },
  nextZmanLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  nextZmanName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  nextZmanTime: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary },

  loadingBox: { alignItems: 'center', paddingVertical: 48, gap: Spacing.md },
  loadingText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  errorBox: {
    alignItems: 'center', paddingVertical: 40, gap: Spacing.sm, backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border,
  },
  errorIcon: { fontSize: 36 },
  errorText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    marginTop: Spacing.sm, backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full,
  },
  retryText: { color: Colors.background, fontWeight: FontWeight.bold, fontSize: FontSize.sm },

  zmanimCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.border, overflow: 'hidden',
  },
  zmanimFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    justifyContent: 'center', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
  },
  zmanimFooterText: { fontSize: FontSize.xs, color: Colors.textMuted },

  inspirationCard: {
    backgroundColor: '#E8A83810', borderRadius: Radius.lg, padding: Spacing.md,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: '#E8A83840',
  },
  inspirationHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    marginBottom: Spacing.xs, justifyContent: 'flex-end',
  },
  inspirationIcon: { fontSize: 16 },
  inspirationLabel: {
    flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.semibold,
    color: Colors.primary, textAlign: 'right',
  },
  inspirationText: {
    fontSize: FontSize.sm, color: Colors.textSecondary,
    textAlign: 'right', lineHeight: 20, fontStyle: 'italic',
  },

  sefariaNote: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: Spacing.md,
  },
  sefariaText: { fontSize: FontSize.xs, color: Colors.textMuted },
});
