// Powered by OnSpace.AI
import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { ProgressRing } from '@/components';
import { useTranslation, useDayLabels } from '@/contexts/SettingsContext';
import {
  DAY_KEYS,
  calcStats,
  formatWeekRange,
  WeekHistoryEntry,
  DayBreakdown,
} from '@/services/weeklyPlanService';
import { useEffect } from 'react';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Colour helpers ────────────────────────────────────────

function percentColor(p: number) {
  if (p >= 80) return Colors.success;
  if (p >= 50) return Colors.primary;
  return '#FF6B6B';
}

function percentBg(p: number) {
  if (p >= 80) return Colors.successDim;
  if (p >= 50) return '#4F46E515';
  return '#FF6B6B15';
}

function medalEmoji(p: number) {
  if (p === 100) return '🏆';
  if (p >= 80)  return '🥇';
  if (p >= 50)  return '🥈';
  return '🎯';
}

// ─── Tiny progress bar ──────────────────────────────────────

function MiniBar({ percent, color }: { percent: number; color: string }) {
  return (
    <View style={miniBar.track}>
      <View style={[miniBar.fill, { width: `${percent}%` as any, backgroundColor: color }]} />
    </View>
  );
}

const miniBar = StyleSheet.create({
  track: { flex: 1, height: 6, backgroundColor: Colors.border, borderRadius: Radius.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.full },
});

// ─── Task pill list ─────────────────────────────────────────

function TaskList({ items, done }: { items: string[]; done: boolean }) {
  if (!items.length) return null;
  const color = done ? Colors.success : '#FF6B6B';
  const icon  = done ? 'check-circle' : 'cancel';
  return (
    <View style={tl.wrap}>
      {items.map((txt, i) => (
        <View key={i} style={[tl.pill, { borderColor: color + '40', backgroundColor: color + '10' }]}>
          <MaterialIcons name={icon as any} size={12} color={color} />
          <Text style={[tl.label, { color }]}>{txt}</Text>
        </View>
      ))}
    </View>
  );
}

const tl = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1,
  },
  label: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
});

// ─── Day breakdown row ──────────────────────────────────────

function DayRow({ day, isToday }: { day: DayBreakdown; isToday: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const color = percentColor(day.percent);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(v => !v);
  };

  return (
    <View style={dr.wrap}>
      <Pressable style={dr.row} onPress={toggle} hitSlop={{ top: 6, bottom: 6 }}>
        <View style={dr.labelWrap}>
          <Text style={[dr.label, isToday && dr.labelToday]}>{day.label}</Text>
          {isToday && <View style={dr.dot} />}
        </View>
        <MiniBar percent={day.percent} color={color} />
        <Text style={[dr.percent, { color }]}>{day.percent}%</Text>
        <Text style={dr.count}>{day.done}/{day.total}</Text>
        <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={16} color={Colors.textMuted} />
      </Pressable>

      {open && (
        <View style={dr.detail}>
          {day.completedTaskTitles.length > 0 && (
            <>
              <Text style={[dr.sectionLabel, { color: Colors.success }]}>
                {t('day_completed_label')}
              </Text>
              <TaskList items={day.completedTaskTitles} done={true} />
            </>
          )}
          {day.missedTaskTitles.length > 0 && (
            <>
              <Text style={[dr.sectionLabel, { color: '#FF6B6B', marginTop: 8 }]}>
                {t('day_missed_label')}
              </Text>
              <TaskList items={day.missedTaskTitles} done={false} />
            </>
          )}
        </View>
      )}
    </View>
  );
}

const dr = StyleSheet.create({
  wrap: { marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  labelWrap: { width: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary },
  labelToday: { color: Colors.primary, fontWeight: FontWeight.bold },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  percent: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, width: 36, textAlign: 'right' },
  count: { fontSize: FontSize.xs, color: Colors.textMuted, width: 32, textAlign: 'right' },
  detail: { paddingLeft: 66, paddingBottom: 10 },
  sectionLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
});

// ─── Stat badge ─────────────────────────────────────────────

function StatBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={sb.wrap}>
      <Text style={[sb.value, { color }]}>{value}</Text>
      <Text style={sb.label}>{label}</Text>
    </View>
  );
}

const sb = StyleSheet.create({
  wrap: { alignItems: 'center', flex: 1 },
  value: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  label: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },
});

// ─── THIS WEEK tab ─────────────────────────────────────────

function ThisWeekTab() {
  const { dayTasks, completions, weekKey } = useWeeklyPlan();
  const { t } = useTranslation();
  const dayLabels = useDayLabels();  // reactive

  const stats     = useMemo(() => calcStats(completions, dayTasks), [completions, dayTasks]);
  const weekRange = useMemo(() => formatWeekRange(weekKey), [weekKey]);
  const todayKey  = DAY_KEYS[new Date().getDay()];

  const dailyBreakdown: DayBreakdown[] = useMemo(() =>
    DAY_KEYS.map(dayKey => {
      const tasks = dayTasks[dayKey] ?? [];
      const completedTaskTitles: string[] = [];
      const missedTaskTitles: string[]    = [];
      for (const task of tasks) {
        const done = !!completions[`${dayKey}-${task.id}`];
        (done ? completedTaskTitles : missedTaskTitles).push(`${task.emoji} ${task.title}`);
      }
      const done    = completedTaskTitles.length;
      const total   = tasks.length;
      const percent = total > 0 ? Math.round((done / total) * 100) : 0;
      return { dayKey, label: dayLabels[dayKey] ?? dayKey, done, total, percent, completedTaskTitles, missedTaskTitles };
    }),
  [dayTasks, completions, dayLabels]);

  const allCompleted = useMemo(() => dailyBreakdown.flatMap(d => d.completedTaskTitles), [dailyBreakdown]);
  const allMissed    = useMemo(() => dailyBreakdown.flatMap(d => d.missedTaskTitles),    [dailyBreakdown]);

  return (
    <>
      {/* Hero card */}
      <View style={tw.heroCard}>
        <ProgressRing percent={stats.percent} size={140} label={t('weekly_completion')} />

        {stats.percent === 100 && (
          <View style={tw.perfectBadge}>
            <Text style={tw.perfectText}>{t('perfect_week')}</Text>
          </View>
        )}

        <View style={tw.statRow}>
          <StatBadge label={t('stat_done')}  value={String(stats.done)}               color={Colors.success} />
          <View style={tw.div} />
          <StatBadge label={t('stat_left')}  value={String(stats.total - stats.done)} color="#FF6B6B" />
          <View style={tw.div} />
          <StatBadge label={t('stat_total')} value={String(stats.total)}              color={Colors.text} />
        </View>

        <View style={tw.rangeBadge}>
          <MaterialIcons name="date-range" size={14} color={Colors.textMuted} />
          <Text style={tw.rangeText}>{weekRange}</Text>
        </View>
      </View>

      {/* Completed tasks */}
      {allCompleted.length > 0 && (
        <View style={tw.card}>
          <View style={tw.cardHeader}>
            <MaterialIcons name="check-circle" size={18} color={Colors.success} />
            <Text style={[tw.cardTitle, { color: Colors.success }]}>
              {t('section_done')} ({allCompleted.length})
            </Text>
          </View>
          <TaskList items={allCompleted} done={true} />
        </View>
      )}

      {/* Missed tasks */}
      {allMissed.length > 0 && (
        <View style={tw.card}>
          <View style={tw.cardHeader}>
            <MaterialIcons name="cancel" size={18} color="#FF6B6B" />
            <Text style={[tw.cardTitle, { color: '#FF6B6B' }]}>
              {t('section_pending')} ({allMissed.length})
            </Text>
          </View>
          <TaskList items={allMissed} done={false} />
        </View>
      )}

      {stats.total === 0 && (
        <View style={tw.emptyCard}>
          <Text style={tw.emptyIcon}>📋</Text>
          <Text style={tw.emptyTitle}>{t('no_tasks_this_week')}</Text>
          <Text style={tw.emptyDesc}>{t('add_tasks_hint')}</Text>
        </View>
      )}

      {/* Daily breakdown */}
      <View style={tw.card}>
        <Text style={tw.cardTitle}>{t('daily_breakdown')}</Text>
        {dailyBreakdown.map(day => (
          <DayRow key={day.dayKey} day={day} isToday={day.dayKey === todayKey} />
        ))}
      </View>
    </>
  );
}

const tw = StyleSheet.create({
  heroCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg,
    alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  perfectBadge: {
    backgroundColor: Colors.successDim, borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  perfectText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.success },
  statRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  div: { width: 1, height: 36, backgroundColor: Colors.border, marginHorizontal: Spacing.sm },
  rangeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.border + '60', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4,
  },
  rangeText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  cardTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, marginBottom: Spacing.sm },
  emptyCard: {
    alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md,
  },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  emptyDesc: { fontSize: FontSize.sm, color: Colors.textSecondary },
});

// ─── History entry card ─────────────────────────────────────

function HistoryCard({ entry }: { entry: WeekHistoryEntry }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const color = percentColor(entry.completionPercent);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(v => !v);
    if (expanded) setShowTasks(false);
  };

  const toggleTasks = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowTasks(v => !v);
  };

  return (
    <View style={hc.card}>
      <Pressable style={hc.header} onPress={toggle} hitSlop={{ top: 6, bottom: 6 }}>
        <View style={hc.left}>
          <Text style={hc.medal}>{medalEmoji(entry.completionPercent)}</Text>
          <View>
            <Text style={hc.weekLabel}>{formatWeekRange(entry.weekKey)}</Text>
            <Text style={hc.weekSub}>{entry.doneTasks} / {entry.totalTasks} {t('tasks_count_label')}</Text>
          </View>
        </View>
        <View style={hc.right}>
          <View style={[hc.percentBadge, { backgroundColor: percentBg(entry.completionPercent) }]}>
            <Text style={[hc.percentText, { color }]}>{entry.completionPercent}%</Text>
          </View>
          <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={20} color={Colors.textMuted} />
        </View>
      </Pressable>

      <View style={hc.barTrack}>
        <View style={[hc.barFill, { width: `${entry.completionPercent}%` as any, backgroundColor: color }]} />
      </View>

      {expanded && (
        <View style={hc.body}>
          <View style={hc.chipRow}>
            <View style={[hc.chip, { backgroundColor: Colors.successDim }]}>
              <MaterialIcons name="check-circle" size={12} color={Colors.success} />
              <Text style={[hc.chipText, { color: Colors.success }]}>{entry.doneTasks} {t('stat_done')}</Text>
            </View>
            {entry.missedTasks.length > 0 && (
              <View style={[hc.chip, { backgroundColor: '#FF6B6B15' }]}>
                <MaterialIcons name="cancel" size={12} color="#FF6B6B" />
                <Text style={[hc.chipText, { color: '#FF6B6B' }]}>{entry.missedTasks.length} {t('section_pending')}</Text>
              </View>
            )}
          </View>

          <Text style={hc.sectionTitle}>{t('daily_breakdown')}</Text>
          {entry.dailyBreakdown.map(day => (
            <DayRow key={day.dayKey} day={day} isToday={false} />
          ))}

          {(entry.dailyBreakdown.some(d => d.completedTaskTitles.length > 0) ||
            entry.dailyBreakdown.some(d => d.missedTaskTitles.length > 0)) && (
            <Pressable style={hc.tasksToggle} onPress={toggleTasks}>
              <Text style={hc.tasksToggleText}>
                {showTasks ? t('hide_task_list') : t('show_task_list')}
              </Text>
            </Pressable>
          )}

          {showTasks && (
            <View style={hc.taskSection}>
              {(() => {
                const all = entry.dailyBreakdown.flatMap(d => d.completedTaskTitles);
                return all.length > 0 ? (
                  <>
                    <Text style={[hc.sectionTitle, { color: Colors.success }]}>{t('completed_tasks_his')}</Text>
                    <TaskList items={all} done={true} />
                  </>
                ) : null;
              })()}
              {(() => {
                const all = entry.dailyBreakdown.flatMap(d => d.missedTaskTitles);
                return all.length > 0 ? (
                  <>
                    <Text style={[hc.sectionTitle, { color: '#FF6B6B', marginTop: 10 }]}>{t('missed_tasks_his')}</Text>
                    <TaskList items={all} done={false} />
                  </>
                ) : null;
              })()}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const hc = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm, overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  right: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  medal: { fontSize: 26 },
  weekLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, textAlign: 'right' },
  weekSub: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', marginTop: 2 },
  percentBadge: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  percentText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  barTrack: {
    height: 4, backgroundColor: Colors.border, marginHorizontal: Spacing.md,
    marginBottom: Spacing.xs, borderRadius: Radius.full, overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: Radius.full },
  body: { borderTopWidth: 1, borderTopColor: Colors.border, padding: Spacing.md },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full,
  },
  chipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  sectionTitle: {
    fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary,
    marginBottom: Spacing.xs, textAlign: 'right',
  },
  tasksToggle: {
    alignSelf: 'center', marginTop: Spacing.md, paddingVertical: 6, paddingHorizontal: 16,
    backgroundColor: Colors.border + '60', borderRadius: Radius.full,
  },
  tasksToggleText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  taskSection: { marginTop: Spacing.sm },
});

// ─── HISTORY tab ────────────────────────────────────────────

function HistoryTab() {
  const { history, reloadHistory, lastResetAt } = useWeeklyPlan();
  const { t } = useTranslation();

  useEffect(() => { reloadHistory(); }, [lastResetAt, reloadHistory]);

  if (history.length === 0) {
    return (
      <View style={ht.empty}>
        <Text style={ht.emptyIcon}>📅</Text>
        <Text style={ht.emptyTitle}>{t('no_history_title')}</Text>
        <Text style={ht.emptyDesc}>{t('no_history_desc')}</Text>
      </View>
    );
  }

  return (
    <>
      <Text style={ht.count}>{history.length} {t('weeks_saved')}</Text>
      {history.map(entry => <HistoryCard key={entry.weekKey} entry={entry} />)}
    </>
  );
}

const ht = StyleSheet.create({
  count: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', marginBottom: Spacing.sm },
  empty: {
    alignItems: 'center', paddingVertical: Spacing.xl * 3, gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
  },
  emptyIcon: { fontSize: 44 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text },
  emptyDesc: {
    fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center',
    paddingHorizontal: Spacing.xl, lineHeight: 20,
  },
});

// ─── Tab selector ───────────────────────────────────────────

type Tab = 'week' | 'history';

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const { t } = useTranslation();
  return (
    <View style={tabBar.wrap}>
      {([
        { key: 'week',    labelKey: 'this_week_tab'   },
        { key: 'history', labelKey: 'history_tab_btn' },
      ] as { key: Tab; labelKey: 'this_week_tab' | 'history_tab_btn' }[]).map(item => (
        <Pressable
          key={item.key}
          style={[tabBar.tab, active === item.key && tabBar.tabActive]}
          onPress={() => onChange(item.key)}
        >
          <Text style={[tabBar.label, active === item.key && tabBar.labelActive]}>
            {t(item.labelKey)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const tabBar = StyleSheet.create({
  wrap: {
    flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, padding: 3, marginBottom: Spacing.md,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: Radius.sm },
  tabActive: { backgroundColor: Colors.primary },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  labelActive: { color: '#FFF', fontWeight: FontWeight.bold },
});

// ─── Root screen ────────────────────────────────────────────

export default function SummaryScreen() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('week');

  const handleTabChange = useCallback((tab: Tab) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  }, []);

  return (
    <SafeAreaView style={root.safe} edges={['top']}>
      <View style={root.header}>
        <Text style={root.title}>{t('summary_title')}</Text>
        <Text style={root.subtitle}>{t('summary_subtitle')}</Text>
      </View>

      <ScrollView style={root.scroll} contentContainerStyle={root.content} showsVerticalScrollIndicator={false}>
        <TabBar active={activeTab} onChange={handleTabChange} />
        {activeTab === 'week' ? <ThisWeekTab /> : <HistoryTab />}
        <View style={{ height: Spacing.xl * 2 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const root = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm,
    paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text, textAlign: 'right' },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', marginTop: 2 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
});
