// Powered by OnSpace.AI
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan';
import { useAlert } from '@/template';
import { useSettings, useTranslation, useDayLabels } from '@/contexts/SettingsContext';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { DAY_KEYS, DAY_LABELS } from '@/services/weeklyPlanService';
import { LANGUAGES, Language } from '@/services/i18n';
import type { Region, ReminderTime } from '@/contexts/SettingsContext';

const EMOJI_OPTIONS = [
  '🏋️','📖','🧘','💧','😴','🥗','🎯','🧹','💊','🎵',
  '🖊️','🚶','🍎','📝','🌿','🏃','🧠','💪','🛁','🌅',
];

type Scope  = 'all' | string;
type TopTab = 'tasks' | 'settings';

// ─── Small helpers ────────────────────────────────────────

function pad(n: number) { return String(n).padStart(2, '0'); }

// ─── Top Tab Bar ──────────────────────────────────────────
function TopTabBar({ active, onChange }: { active: TopTab; onChange: (t: TopTab) => void }) {
  const { t } = useTranslation();
  return (
    <View style={topTabStyles.bar}>
      {(['tasks', 'settings'] as TopTab[]).map(tab => {
        const isActive = active === tab;
        const label = tab === 'tasks' ? t('tasks_tab') : t('settings_tab');
        const icon  = tab === 'tasks' ? 'checklist' : 'settings';
        return (
          <Pressable
            key={tab}
            style={[topTabStyles.btn, isActive && topTabStyles.btnActive]}
            onPress={() => onChange(tab)}
          >
            <MaterialIcons
              name={icon as any}
              size={18}
              color={isActive ? Colors.background : Colors.textSecondary}
            />
            <Text style={[topTabStyles.label, isActive && topTabStyles.labelActive]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const topTabStyles = StyleSheet.create({
  bar: {
    flexDirection:    'row',
    backgroundColor:  Colors.surface,
    borderRadius:     Radius.lg,
    padding:          4,
    marginBottom:     Spacing.md,
    borderWidth:      1,
    borderColor:      Colors.border,
    gap:              4,
  },
  btn: {
    flex:            1,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: 10,
    borderRadius:    Radius.md,
    gap:             6,
  },
  btnActive: { backgroundColor: Colors.primary },
  label:     { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  labelActive: { color: Colors.background, fontWeight: FontWeight.bold },
});

// ─── Section Header ───────────────────────────────────────
function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <View style={secStyles.container}>
      <View style={secStyles.left}>
        <Text style={secStyles.title}>{title}</Text>
        {subtitle ? <Text style={secStyles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={secStyles.icon}>{icon}</Text>
    </View>
  );
}

const secStyles = StyleSheet.create({
  container: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    marginBottom:    Spacing.xs,
    marginTop:       Spacing.lg,
  },
  left:     { gap: 2 },
  icon:     { fontSize: 24 },
  title:    { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, textAlign: 'right' },
  subtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'right' },
});

// ─── Stepper ──────────────────────────────────────────────
function Stepper({
  label, value, onDecrement, onIncrement, format,
}: {
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  format?: (v: number) => string;
}) {
  return (
    <View style={stepperStyles.container}>
      <View style={stepperStyles.controls}>
        <Pressable style={stepperStyles.btn} onPress={onIncrement} hitSlop={8}>
          <MaterialIcons name="add" size={20} color={Colors.primary} />
        </Pressable>
        <Text style={stepperStyles.value}>{format ? format(value) : value}</Text>
        <Pressable style={stepperStyles.btn} onPress={onDecrement} hitSlop={8}>
          <MaterialIcons name="remove" size={20} color={Colors.primary} />
        </Pressable>
      </View>
      <Text style={stepperStyles.label}>{label}</Text>
    </View>
  );
}

const stepperStyles = StyleSheet.create({
  container: { alignItems: 'center', gap: 4 },
  controls: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius:   Radius.md,
    borderWidth:    1,
    borderColor:    Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical:  6,
  },
  btn:   { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text, minWidth: 44, textAlign: 'center', fontVariant: ['tabular-nums'] },
  label: { fontSize: FontSize.xs, color: Colors.textSecondary },
});

// ─── Settings Tab ─────────────────────────────────────────
function SettingsTab() {
  const {
    language, region, reminderEnabled, reminderTime,
    updateLanguage, updateRegion, updateReminderEnabled, updateReminderTime,
  } = useSettings();
  // useTranslation() makes this component re-render when language changes
  const { t } = useTranslation();
  const { showAlert } = useAlert();
  const [savingReminder, setSavingReminder] = useState(false);

  const handleLanguage = async (lang: Language) => {
    await updateLanguage(lang);
  };

  const handleRegion = async (r: Region) => {
    await updateRegion(r);
  };

  const handleToggleReminder = async (val: boolean) => {
    setSavingReminder(true);
    try {
      await updateReminderEnabled(val);
      if (val) {
        showAlert(
          '✅ ' + t('notif_scheduled'),
          `${t('reminder_time')}: ${pad(reminderTime.hour)}:${pad(reminderTime.minute)}`,
        );
      }
    } catch {
      showAlert(t('error'), t('notif_permission_denied'));
    } finally {
      setSavingReminder(false);
    }
  };

  const changeHour = async (delta: number) => {
    const h = ((reminderTime.hour + delta + 24) % 24);
    await updateReminderTime({ ...reminderTime, hour: h });
  };

  const changeMinute = async (delta: number) => {
    const m = ((reminderTime.minute + delta + 60) % 60);
    await updateReminderTime({ ...reminderTime, minute: m });
  };

  return (
    <>
      {/* ── Language ── */}
      <SectionHeader icon="🌐" title={t('language_section')} subtitle={t('language_subtitle')} />
      <View style={settingStyles.card}>
        {LANGUAGES.map(lang => {
          const active = language === lang.code;
          return (
            <Pressable
              key={lang.code}
              style={[settingStyles.langOption, active && settingStyles.langOptionActive]}
              onPress={() => handleLanguage(lang.code)}
            >
              <Text style={settingStyles.langFlag}>{lang.flag}</Text>
              <View style={settingStyles.langBody}>
                <Text style={[settingStyles.langNative, active && settingStyles.textActive]}>
                  {lang.nativeLabel}
                </Text>
                <Text style={settingStyles.langLabel}>{lang.label}</Text>
              </View>
              {active ? (
                <MaterialIcons name="check-circle" size={20} color={Colors.primary} />
              ) : (
                <View style={settingStyles.emptyCheck} />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* ── Region ── */}
      <SectionHeader icon="🗺️" title={t('region_section')} subtitle={t('region_subtitle')} />
      <View style={settingStyles.card}>
        {(['israel', 'abroad'] as Region[]).map(r => {
          const active = region === r;
          const label  = r === 'israel'
            ? `🇮🇱  ${t('israel')}`
            : `✈️  ${t('abroad')}`;
          return (
            <Pressable
              key={r}
              style={[settingStyles.regionOption, active && settingStyles.regionOptionActive]}
              onPress={() => handleRegion(r)}
            >
              <MaterialIcons
                name={active ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={22}
                color={active ? Colors.primary : Colors.textMuted}
              />
              <Text style={[settingStyles.regionLabel, active && settingStyles.textActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Daily Reminders ── */}
      <SectionHeader icon="⏰" title={t('reminders_section')} subtitle={t('reminders_subtitle')} />
      <View style={settingStyles.card}>
        {/* Toggle */}
        <View style={settingStyles.reminderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {savingReminder ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : null}
            <Switch
              value={reminderEnabled}
              onValueChange={handleToggleReminder}
              trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
              thumbColor={reminderEnabled ? Colors.primary : Colors.textMuted}
              disabled={savingReminder}
            />
          </View>
          <Text style={settingStyles.reminderLabel}>{t('reminder_enabled')}</Text>
        </View>

        {/* Time picker – shown when enabled */}
        {reminderEnabled ? (
          <View style={settingStyles.timePicker}>
            <View style={settingStyles.timeDisplay}>
              <Text style={settingStyles.timeText}>
                {pad(reminderTime.hour)}:{pad(reminderTime.minute)}
              </Text>
            </View>
            <View style={settingStyles.steppers}>
              <Stepper
                label={t('reminder_hour')}
                value={reminderTime.hour}
                onDecrement={() => changeHour(-1)}
                onIncrement={() => changeHour(+1)}
                format={v => pad(v)}
              />
              <Text style={settingStyles.timeSep}>:</Text>
              <Stepper
                label={t('reminder_minute')}
                value={reminderTime.minute}
                onDecrement={() => changeMinute(-5)}
                onIncrement={() => changeMinute(+5)}
                format={v => pad(v)}
              />
            </View>
          </View>
        ) : null}
      </View>

      {/* ── About ── */}
      <SectionHeader icon="ℹ️" title={t('about_section')} />
      <View style={settingStyles.card}>
        {[
          { label: t('app_version'),   value: '1.0.2'                          },
          { label: t('data_source'),   value: t('data_source_val')             },
          { label: t('tanya_cycle'),   value: t('tanya_cycle_val')             },
        ].map(row => (
          <View key={row.label} style={settingStyles.aboutRow}>
            <Text style={settingStyles.aboutValue}>{row.value}</Text>
            <Text style={settingStyles.aboutLabel}>{row.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Version Footer ── */}
      <View style={settingStyles.versionFooter}>
        <Text style={settingStyles.versionFooterText}>Version: 1.0.2</Text>
      </View>
    </>
  );
}

const settingStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     Colors.border,
    overflow:        'hidden',
    marginBottom:    Spacing.md,
  },
  langOption: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: Spacing.md,
    paddingVertical:   14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap:            Spacing.md,
  },
  langOptionActive: { backgroundColor: Colors.primary + '0D' },
  langFlag:  { fontSize: 26 },
  langBody:  { flex: 1, gap: 2 },
  langNative: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, textAlign: 'right' },
  langLabel:  { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'right' },
  textActive: { color: Colors.primary },
  emptyCheck: { width: 20, height: 20 },

  regionOption: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: Spacing.md,
    paddingVertical:   14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap:            Spacing.md,
  },
  regionOptionActive: { backgroundColor: Colors.primary + '0D' },
  regionLabel: { flex: 1, fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.text, textAlign: 'right' },

  reminderRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical:   14,
  },
  reminderLabel: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.text },

  timePicker: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    gap: Spacing.md,
  },
  timeDisplay: {
    backgroundColor: Colors.primary + '15',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  timeText: { fontSize: 40, fontWeight: FontWeight.bold, color: Colors.primary, fontVariant: ['tabular-nums'] },
  steppers: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  timeSep: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textSecondary, marginTop: -16 },

  versionFooter: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginTop: Spacing.sm,
  },
  versionFooterText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.5,
  },
  aboutRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical:   12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  aboutLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  aboutValue: { fontSize: FontSize.sm, color: Colors.text },
});

// ─── Tasks Tab ────────────────────────────────────────────
function TasksTab() {
  const { dayTasks, addTaskToDay, addTaskToAllDays, removeTaskFromDay } = useWeeklyPlan();
  const { showAlert } = useAlert();
  const { t } = useTranslation();
  const dayLabels = useDayLabels();   // ← reactive, updates on language change

  const [selectedDay, setSelectedDay]       = useState<Scope>('all');
  const [newTitle, setNewTitle]             = useState('');
  const [selectedEmoji, setSelectedEmoji]   = useState('🎯');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const currentTasks = selectedDay === 'all' ? [] : (dayTasks[selectedDay] ?? []);

  const handleAdd = () => {
    if (!newTitle.trim()) {
      showAlert(t('error'), t('task_name_placeholder'));
      return;
    }
    if (selectedDay === 'all') {
      addTaskToAllDays(newTitle.trim(), selectedEmoji);
    } else {
      addTaskToDay(selectedDay, newTitle.trim(), selectedEmoji);
    }
    setNewTitle('');
    setSelectedEmoji('🎯');
    setShowEmojiPicker(false);
  };

  const handleRemove = (taskId: string, title: string) => {
    const dayLabel = selectedDay === 'all'
      ? t('all_days')
      : dayLabels[selectedDay] ?? selectedDay;
    showAlert(
      t('delete_task_title'),
      `${t('delete_task_confirm')} "${title}" ${t('from')} ${dayLabel}?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'), style: 'destructive', onPress: () => {
            if (selectedDay !== 'all') removeTaskFromDay(selectedDay, taskId);
          },
        },
      ],
    );
  };

  return (
    <>
      {/* Day Selector */}
      <View style={taskStyles.daySelectorOuter}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={taskStyles.daySelector}
        >
          <Pressable
            onPress={() => setSelectedDay('all')}
            style={[taskStyles.dayChip, selectedDay === 'all' && taskStyles.dayChipActive]}
          >
            <Text style={[taskStyles.dayChipText, selectedDay === 'all' && taskStyles.dayChipTextActive]}>
              {t('all')}
            </Text>
          </Pressable>
          {DAY_KEYS.map(d => (
            <Pressable
              key={d}
              onPress={() => setSelectedDay(d)}
              style={[taskStyles.dayChip, selectedDay === d && taskStyles.dayChipActive]}
            >
              <Text style={[taskStyles.dayChipText, selectedDay === d && taskStyles.dayChipTextActive]}>
                {dayLabels[d]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Add Task Card */}
      <View style={taskStyles.addCard}>
        <Text style={taskStyles.cardTitle}>
          {selectedDay === 'all'
            ? t('add_task_all')
            : `${t('add_task_day')} ${dayLabels[selectedDay]}`}
        </Text>

        <Pressable
          style={taskStyles.emojiButton}
          onPress={() => setShowEmojiPicker(v => !v)}
        >
          <Text style={taskStyles.emojiSelected}>{selectedEmoji}</Text>
          <Text style={taskStyles.emojiButtonLabel}>{t('choose_icon')}</Text>
          <MaterialIcons name={showEmojiPicker ? 'expand-less' : 'expand-more'} size={20} color={Colors.textSecondary} />
        </Pressable>

        {showEmojiPicker ? (
          <View style={taskStyles.emojiGrid}>
            {EMOJI_OPTIONS.map(emoji => (
              <Pressable
                key={emoji}
                onPress={() => { setSelectedEmoji(emoji); setShowEmojiPicker(false); }}
                style={[taskStyles.emojiOption, selectedEmoji === emoji && taskStyles.emojiOptionSelected]}
              >
                <Text style={taskStyles.emojiOptionText}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <TextInput
          style={taskStyles.input}
          placeholder={t('task_name_placeholder')}
          placeholderTextColor={Colors.textMuted}
          value={newTitle}
          onChangeText={setNewTitle}
          textAlign="right"
          returnKeyType="done"
          onSubmitEditing={handleAdd}
        />

        <Pressable
          style={({ pressed }) => [taskStyles.addButton, pressed && taskStyles.addButtonPressed]}
          onPress={handleAdd}
        >
          <MaterialIcons name={selectedDay === 'all' ? 'playlist-add' : 'add'} size={20} color={Colors.background} />
          <Text style={taskStyles.addButtonText}>
            {selectedDay === 'all' ? t('add_task_all') : t('add_task_day')}
          </Text>
        </Pressable>
      </View>

      {/* Task List */}
      {selectedDay !== 'all' ? (
        <>
          <Text style={taskStyles.sectionTitle}>
            {t('tasks_for_day')} {dayLabels[selectedDay]} ({currentTasks.length})
          </Text>
          {currentTasks.map(task => (
            <View key={task.id} style={taskStyles.taskRow}>
              <Pressable
                onPress={() => handleRemove(task.id, task.title)}
                style={taskStyles.deleteButton}
                hitSlop={8}
              >
                <MaterialIcons name="delete-outline" size={22} color={Colors.danger} />
              </Pressable>
              <Text style={taskStyles.taskTitle}>{task.title}</Text>
              <Text style={taskStyles.taskEmoji}>{task.emoji}</Text>
            </View>
          ))}
          {currentTasks.length === 0 ? (
            <View style={taskStyles.emptyState}>
              <Text style={taskStyles.emptyEmoji}>📋</Text>
              <Text style={taskStyles.emptyText}>{t('no_tasks')}</Text>
            </View>
          ) : null}
        </>
      ) : (
        <>
          <Text style={taskStyles.sectionTitle}>{t('tasks_overview')}</Text>
          {DAY_KEYS.map(d => (
            <Pressable key={d} onPress={() => setSelectedDay(d)} style={taskStyles.overviewRow}>
              <MaterialIcons name="chevron-left" size={20} color={Colors.textMuted} />
              <Text style={taskStyles.overviewCount}>{(dayTasks[d] ?? []).length} {t('tasks_for_day')}</Text>
              <Text style={taskStyles.overviewDay}>{dayLabels[d]}</Text>
            </Pressable>
          ))}
        </>
      )}
    </>
  );
}

const taskStyles = StyleSheet.create({
  daySelectorOuter: { marginBottom: Spacing.md, marginHorizontal: -Spacing.md },
  daySelector: { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: Spacing.sm },
  dayChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  dayChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  dayChipTextActive: { color: Colors.background, fontWeight: FontWeight.bold },

  addCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text, textAlign: 'right' },

  emojiButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  emojiSelected: { fontSize: 24 },
  emojiButtonLabel: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right' },

  emojiGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.sm,
  },
  emojiOption: {
    width: 44, height: 44, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.border,
  },
  emojiOptionSelected: { backgroundColor: Colors.primaryDim, borderWidth: 1, borderColor: Colors.primary },
  emojiOptionText: { fontSize: 22 },

  input: {
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.md,
    fontSize: FontSize.md, color: Colors.text, borderWidth: 1, borderColor: Colors.border,
  },
  addButton: {
    backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
  addButtonPressed: { opacity: 0.85 },
  addButtonText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.background },

  sectionTitle: {
    fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text,
    marginBottom: Spacing.sm, textAlign: 'right',
  },
  taskRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 14,
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  taskEmoji:  { fontSize: 22, width: 32, textAlign: 'center' },
  taskTitle:  { flex: 1, fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.text, textAlign: 'right' },
  deleteButton: { padding: 4 },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyEmoji: { fontSize: 48 },
  emptyText:  { fontSize: FontSize.md, color: Colors.textMuted },

  overviewRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 14,
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  overviewDay:   { flex: 1, fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, textAlign: 'right' },
  overviewCount: { fontSize: FontSize.sm, color: Colors.textSecondary, marginRight: Spacing.sm },
});

// ─── Main Screen ──────────────────────────────────────────

export default function ManageScreen() {
  const [activeTab, setActiveTab] = useState<TopTab>('tasks');
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Text style={styles.title}>
            {activeTab === 'tasks' ? t('manage_title') : t('settings_title')}
          </Text>
          <Text style={styles.subtitle}>
            {activeTab === 'tasks'
              ? t('tasks_overview')
              : t('language_subtitle')}
          </Text>

          {/* Top Tab Bar */}
          <TopTabBar active={activeTab} onChange={setActiveTab} />

          {/* Content */}
          {activeTab === 'tasks' ? <TasksTab /> : <SettingsTab />}

          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  title: {
    fontSize: FontSize.xxl, fontWeight: FontWeight.bold,
    color: Colors.text, textAlign: 'right',
  },
  subtitle: {
    fontSize: FontSize.sm, color: Colors.textSecondary,
    marginTop: 2, marginBottom: Spacing.md, textAlign: 'right',
  },
});
