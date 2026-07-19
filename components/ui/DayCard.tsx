// Powered by OnSpace.AI
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { Task } from '@/services/weeklyPlanService';
import { TaskItem } from './TaskItem';
import { useTranslation } from '@/contexts/SettingsContext';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface DayCardProps {
  dayKey: string;
  label: string;
  isToday: boolean;
  tasks: Task[];
  completions: Record<string, boolean>;
  onToggle: (dayKey: string, taskId: string) => void;
  doneCount: number;
}

export function DayCard({ dayKey, label, isToday, tasks, completions, onToggle, doneCount }: DayCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(isToday);
  const rotateAnim = useRef(new Animated.Value(isToday ? 1 : 0)).current;

  const percent = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const next = !expanded;
    setExpanded(next);
    Animated.timing(rotateAnim, {
      toValue: next ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const rotateStyle = {
    transform: [{
      rotate: rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
    }],
  };

  return (
    <View style={[styles.card, isToday && styles.cardToday]}>
      <Pressable onPress={toggle} style={styles.header}>
        <View style={styles.headerLeft}>
          {isToday ? (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>{t('today_badge')}</Text>
            </View>
          ) : null}
          <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{label}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.progressPill}>
            <View style={[styles.progressFill, { width: `${percent}%` as any }]} />
            <Text style={styles.progressText}>{doneCount}/{tasks.length}</Text>
          </View>
          <Animated.View style={rotateStyle}>
            <MaterialIcons name="keyboard-arrow-down" size={22} color={Colors.textSecondary} />
          </Animated.View>
        </View>
      </Pressable>
      {expanded ? (
        <View style={styles.taskList}>
          {tasks.map(task => (
            <TaskItem
              key={task.id}
              emoji={task.emoji}
              title={task.title}
              checked={!!completions[`${dayKey}-${task.id}`]}
              onToggle={() => onToggle(dayKey, task.id)}
            />
          ))}
          {tasks.length === 0 ? (
            <Text style={styles.emptyText}>{t('no_tasks_yet')}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardToday: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dayLabel: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  dayLabelToday: {
    color: Colors.text,
  },
  todayBadge: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  todayBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.background,
  },
  progressPill: {
    width: 80,
    height: 22,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.primaryDim,
    borderRadius: Radius.full,
  },
  progressText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    zIndex: 1,
  },
  taskList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
});
