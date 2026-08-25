
// Powered by OnSpace.AI
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { DayCard, ProgressRing } from '@/components';
import { DAY_KEYS, calcStats, getTodayDayKey } from '@/services/weeklyPlanService';
import { useTranslation, useDayLabels } from '@/contexts/SettingsContext';

export default function WeeklyScreen() {
  const router = useRouter();
  const { dayTasks, completions, loading, toggleTask, weekKey } = useWeeklyPlan();
  const { t, language } = useTranslation();
  const dayLabels = useDayLabels();   // reactive – re-renders on language change
  const todayKey = getTodayDayKey();

  const stats = useMemo(() => calcStats(completions, dayTasks), [completions, dayTasks]);

  // Rebuild weekLabel whenever language or weekKey changes
  const weekLabel = useMemo(() => {
    const match = weekKey.match(/(\d{4})-W(\d+)/);
    if (!match) return weekKey;
    return `${t('week_label_prefix')} ${match[2]}, ${match[1]}`;
  }, [weekKey, language, t]); // Added 't' to the dependency array

  // Build the day label with language-appropriate prefix ("יום ראשון" vs "Sunday")
  const makeDayLabel = (dayKey: string) => {
    const prefix = t('day_prefix');
    const name   = dayLabels[dayKey] ?? dayKey;
    return prefix ? `${prefix} ${name}` : name;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t('weekly_plan_title')}</Text>
            <Text style={styles.subtitle}>{weekLabel}</Text>
          </View>
        </View>

        {/* Chabad siddur (full, date-aware categories) */}
        <Pressable
          style={({ pressed }) => [styles.tefillahCard, pressed && styles.tefillahCardPressed]}
          onPress={() => router.push('/siddur')}
        >
          <View style={styles.tefillahIcon}>
            <MaterialIcons name="auto-stories" size={24} color={Colors.primary} />
          </View>
          <View style={styles.tefillahTextWrap}>
            <Text style={styles.tefillahTitle}>סידור חב״ד</Text>
            <Text style={styles.tefillahSubtitle}>שחרית · מנחה · ערבית · ברכות ועוד</Text>
          </View>
          <MaterialIcons name="chevron-left" size={26} color={Colors.textSecondary} />
        </Pressable>

        {/* Sephardic siddur (full, date-aware categories) */}
        <Pressable
          style={({ pressed }) => [styles.tefillahCard, pressed && styles.tefillahCardPressed]}
          onPress={() => router.push({ pathname: '/siddur', params: { nusach: 'sephardi' } })}
        >
          <View style={styles.tefillahIcon}>
            <MaterialIcons name="menu-book" size={24} color={Colors.primary} />
          </View>
          <View style={styles.tefillahTextWrap}>
            <Text style={styles.tefillahTitle}>סידור ספרדי</Text>
            <Text style={styles.tefillahSubtitle}>נוסח ספרדים ועדות המזרח · כולל סליחות</Text>
          </View>
          <MaterialIcons name="chevron-left" size={26} color={Colors.textSecondary} />
        </Pressable>

        {/* Progress Hero */}
        <View style={styles.progressHero}>
          <ProgressRing
            percent={stats.percent}
            size={150}
            label={t('weekly_completion')}
          />
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.done}</Text>
              <Text style={styles.statLabel}>{t('stat_completed')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total - stats.done}</Text>
              <Text style={styles.statLabel}>{t('stat_remaining')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>{t('stat_total_tasks')}</Text>
            </View>
          </View>
        </View>

        {/* Days */}
        <Text style={styles.sectionTitle}>{t('days_of_week_title')}</Text>
        {DAY_KEYS.map(dayKey => {
          const dayTaskList = dayTasks[dayKey] ?? [];
          const dayStats = stats.byDay[dayKey] ?? { done: 0, total: dayTaskList.length };
          return (
            <DayCard
              key={dayKey}
              dayKey={dayKey}
              label={makeDayLabel(dayKey)}
              isToday={dayKey === todayKey}
              tasks={dayTaskList}
              completions={completions}
              onToggle={toggleTask}
              onOpenTefillah={() =>
                router.push({ pathname: '/siddur', params: { nusach: 'sephardi', open: 'shacharit' } })
              }
              doneCount={dayStats.done}
            />
          );
        })}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'right',
  },
  tefillahCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tefillahCardPressed: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.primary,
  },
  tefillahIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tefillahTextWrap: {
    flex: 1,
  },
  tefillahTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    textAlign: 'right',
  },
  tefillahSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  progressHero: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'right',
  },
});
