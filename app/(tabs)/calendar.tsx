// Powered by OnSpace.AI
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import {
  resolveEvents,
  getTodayHebrew,
  formatGregDate,
  getEventTypeLabel,
  getEventTypeColor,
  hebrewDayToGematria,
  hebrewMonthDisplay,
  ResolvedEvent,
  EventType,
} from '@/services/hebrewCalendarService';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { useTranslation } from '@/contexts/SettingsContext';
import type { TranslationKey } from '@/services/i18n';

const TYPE_COLORS: Record<EventType, string> = {
  hilula: '#9B7FCC',
  geula: Colors.primary,
  birthday: Colors.success,
  holiday: '#5BAFD6',
  other: Colors.textSecondary,
};

const TYPE_BG: Record<EventType, string> = {
  hilula: 'rgba(155,127,204,0.15)',
  geula: 'rgba(245,166,35,0.15)',
  birthday: 'rgba(76,175,138,0.15)',
  holiday: 'rgba(91,175,214,0.15)',
  other: 'rgba(154,145,137,0.12)',
};

type FilterType = 'all' | EventType;

// Map filter keys to i18n keys
const FILTER_KEYS: { key: FilterType; i18nKey: TranslationKey }[] = [
  { key: 'all',      i18nKey: 'cal_filter_all'      },
  { key: 'geula',    i18nKey: 'cal_filter_geula'    },
  { key: 'hilula',   i18nKey: 'cal_filter_hilula'   },
  { key: 'birthday', i18nKey: 'cal_filter_birthday' },
  { key: 'holiday',  i18nKey: 'cal_filter_holiday'  },
];

// ─── Days-until badge ──────────────────────────────────────

function DaysUntilBadge({ days }: { days: number }) {
  const { t } = useTranslation();
  if (days === 0) {
    return (
      <View style={[badge.container, { backgroundColor: Colors.primary }]}>
        <Text style={[badge.text, { color: Colors.background }]}>{t('today_cal')}</Text>
      </View>
    );
  }
  if (days <= 7) {
    return (
      <View style={[badge.container, { backgroundColor: 'rgba(245,166,35,0.15)', borderWidth: 1, borderColor: Colors.primary }]}>
        <Text style={[badge.text, { color: Colors.primary }]}>
          {t('days_until_prefix')} {days} {t('days_suffix')}
        </Text>
      </View>
    );
  }
  if (days <= 30) {
    return (
      <View style={[badge.container, { backgroundColor: Colors.surfaceElevated }]}>
        <Text style={[badge.text, { color: Colors.textSecondary }]}>
          {t('days_until_prefix')} {days} {t('days_suffix')}
        </Text>
      </View>
    );
  }
  return (
    <View style={[badge.container, { backgroundColor: Colors.surfaceElevated }]}>
      <Text style={[badge.text, { color: Colors.textMuted }]}>
        {days} {t('days_suffix')}
      </Text>
    </View>
  );
}

const badge = StyleSheet.create({
  container: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  text: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
});

// ─── Event Card ────────────────────────────────────────────

function EventCard({ event }: { event: ResolvedEvent }) {
  const typeColor = TYPE_COLORS[event.type];
  const typeBg    = TYPE_BG[event.type];

  return (
    <View style={[
      styles.eventCard,
      event.isToday && styles.eventCardToday,
      event.daysUntil <= 7 && !event.isToday && styles.eventCardSoon,
    ]}>
      <View style={[styles.accentBar, { backgroundColor: typeColor }]} />
      <View style={styles.eventIcon}>
        <Text style={styles.eventIconText}>{event.icon}</Text>
      </View>
      <View style={styles.eventBody}>
        <View style={styles.eventTitleRow}>
          <Text style={styles.eventTitle}>{event.title}</Text>
        </View>
        {event.subtitle ? <Text style={styles.eventSubtitle}>{event.subtitle}</Text> : null}
        <View style={styles.eventMeta}>
          <View style={[styles.typePill, { backgroundColor: typeBg }]}>
            <Text style={[styles.typePillText, { color: typeColor }]}>
              {getEventTypeLabel(event.type)}
            </Text>
          </View>
          <Text style={styles.gregDate}>{formatGregDate(event.gregDate)}</Text>
        </View>
      </View>
      <DaysUntilBadge days={event.daysUntil} />
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────

export default function CalendarScreen() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterType>('all');
  const { hdate, display } = useMemo(() => getTodayHebrew(), []);
  const allEvents = useMemo(() => resolveEvents(), []);
  const nextEvent = allEvents.find(e => e.daysUntil >= 0);

  const filtered = useMemo(() => {
    if (filter === 'all') return allEvents;
    return allEvents.filter(e => e.type === filter);
  }, [allEvents, filter]);

  const sectionTitle = useMemo(() => {
    const filterLabel = filter === 'all'
      ? t('all_events_label')
      : FILTER_KEYS.find(f => f.key === filter)?.i18nKey
        ? t(FILTER_KEYS.find(f => f.key === filter)!.i18nKey)
        : filter;
    return `${filterLabel} (${filtered.length})`;
  }, [filter, filtered.length, t]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.screenTitle}>{t('calendar_title')}</Text>

        {/* Today Hebrew Date Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroStarRow}>
            <Text style={styles.heroStar}>✡</Text>
          </View>
          <Text style={styles.heroTitle}>{t('today_heb_title')}</Text>
          <Text style={styles.heroDate}>{display}</Text>
          <Text style={styles.heroGreg}>
            {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>

        {/* Next Upcoming */}
        {nextEvent ? (
          <View style={styles.nextCard}>
            <View style={styles.nextHeader}>
              <MaterialIcons name="event" size={18} color={Colors.primary} />
              <Text style={styles.nextTitle}>{t('upcoming_event')}</Text>
            </View>
            <View style={styles.nextBody}>
              <Text style={styles.nextIcon}>{nextEvent.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextEventTitle}>{nextEvent.title}</Text>
                {nextEvent.subtitle ? <Text style={styles.nextEventSub}>{nextEvent.subtitle}</Text> : null}
                <Text style={styles.nextDate}>{formatGregDate(nextEvent.gregDate)}</Text>
              </View>
              <DaysUntilBadge days={nextEvent.daysUntil} />
            </View>
          </View>
        ) : null}

        {/* Filter Bar – labels come from i18n, re-render on language change */}
        <View style={styles.filterOuter}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterBar}
          >
            {FILTER_KEYS.map(f => (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                  {t(f.i18nKey)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {(Object.entries(TYPE_COLORS) as [EventType, string][]).filter(([k]) => k !== 'other').map(([type, color]) => (
            <View key={type} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendText}>{getEventTypeLabel(type)}</Text>
            </View>
          ))}
        </View>

        {/* Section title */}
        <Text style={styles.sectionTitle}>{sectionTitle}</Text>

        {filtered.map(event => (
          <EventCard key={event.id} event={event} />
        ))}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

  screenTitle: {
    fontSize: FontSize.xxl, fontWeight: FontWeight.bold,
    color: Colors.text, textAlign: 'right', marginBottom: Spacing.md,
  },

  heroCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg,
    alignItems: 'center', marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.xs,
  },
  heroStarRow: { marginBottom: Spacing.xs },
  heroStar: { fontSize: 28, color: Colors.primary },
  heroTitle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  heroDate: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.primary, textAlign: 'center' },
  heroGreg: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },

  nextCard: {
    backgroundColor: 'rgba(245,166,35,0.07)', borderRadius: Radius.lg, padding: Spacing.md,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: 'rgba(245,166,35,0.3)', gap: Spacing.sm,
  },
  nextHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, justifyContent: 'flex-end' },
  nextTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },
  nextBody: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  nextIcon: { fontSize: 28 },
  nextEventTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, textAlign: 'right' },
  nextEventSub: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right' },
  nextDate: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', marginTop: 2 },

  filterOuter: { marginHorizontal: -Spacing.md, marginBottom: Spacing.md },
  filterBar: { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: Spacing.sm },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  filterTextActive: { color: Colors.background, fontWeight: FontWeight.bold },

  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md, justifyContent: 'flex-end' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: FontSize.xs, color: Colors.textSecondary },

  sectionTitle: {
    fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text,
    textAlign: 'right', marginBottom: Spacing.sm,
  },

  eventCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden', gap: Spacing.sm, paddingRight: Spacing.md, paddingVertical: 14,
  },
  eventCardToday: { borderColor: Colors.primary, borderWidth: 1.5, backgroundColor: 'rgba(245,166,35,0.05)' },
  eventCardSoon: { borderColor: 'rgba(245,166,35,0.4)' },
  accentBar: { width: 4, alignSelf: 'stretch', borderTopLeftRadius: Radius.lg, borderBottomLeftRadius: Radius.lg },
  eventIcon: {
    width: 40, height: 40, borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center',
  },
  eventIconText: { fontSize: 22 },
  eventBody: { flex: 1, gap: 4 },
  eventTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  eventTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, textAlign: 'right', flex: 1 },
  eventSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right' },
  eventMeta: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: 2,
  },
  typePill: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  typePillText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  gregDate: { fontSize: FontSize.xs, color: Colors.textMuted },
});
