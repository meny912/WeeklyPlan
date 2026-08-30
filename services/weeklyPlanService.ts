// Powered by OnSpace.AI
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Task {
  id: string;
  title: string;
  emoji: string;
}

// Rich history entry stored per archived week
export interface WeekHistoryEntry {
  weekKey: string;           // e.g. "2025-W23"
  startDate: string;         // ISO date of Sunday that starts the week
  endDate: string;           // ISO date of Saturday that ends the week
  completionPercent: number; // 0-100
  completedTasks: string[];  // ["sun-sport", "mon-read", ...]
  missedTasks: string[];     // tasks that existed but were NOT completed
  totalTasks: number;
  doneTasks: number;
  dailyBreakdown: DayBreakdown[];
  savedAt: number;           // Unix ms when archived
}

export interface DayBreakdown {
  dayKey: string;            // "sun", "mon", …
  label: string;             // "ראשון", "שני", …
  done: number;
  total: number;
  percent: number;
  completedTaskTitles: string[];
  missedTaskTitles: string[];
}

// Internal current-week record (lightweight, in-progress)
export interface WeekRecord {
  weekKey: string;
  completions: Record<string, boolean>;
  tasks: Task[]; // legacy – kept for history compatibility
  savedAt: number;
}

export const DEFAULT_TASKS: Task[] = [
  { id: 'sport',    title: 'פעילות גופנית', emoji: '🏋️' },
  { id: 'read',     title: 'קריאה',          emoji: '📖' },
  { id: 'meditate', title: 'מדיטציה',        emoji: '🧘' },
  { id: 'water',    title: 'שתיית מים',      emoji: '💧' },
  { id: 'sleep',    title: 'שינה מספקת',     emoji: '😴' },
  { id: 'diet',     title: 'תזונה בריאה',    emoji: '🥗' },
];

export const DAY_LABELS: Record<string, string> = {
  sun: 'ראשון',
  mon: 'שני',
  tue: 'שלישי',
  wed: 'רביעי',
  thu: 'חמישי',
  fri: 'שישי',
  sat: 'שבת',
};

export const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const STORAGE_KEY      = 'weekly_plan_data';
const DAY_TASKS_KEY    = 'weekly_plan_day_tasks';
const HISTORY_KEY      = 'weekly_plan_history';
const LAST_CHECK_KEY   = 'weekly_plan_last_reset_check';

// ── Week key helpers ──────────────────────────────────────

/**
 * Returns the ISO week key "YYYY-WXX" for a given date.
 * Weeks start on SUNDAY for this app (not ISO Monday).
 * We use a custom Sunday-based week number derived from year start.
 */
export function getWeekKey(date: Date = new Date()): string {
  // Get the Sunday that starts the week containing `date`
  const sunday = getSundayOfWeek(date);
  const year   = sunday.getFullYear();
  // Week number = ceil((daysSinceJan1 + 1) / 7)
  const jan1   = new Date(year, 0, 1);
  const dayNum = Math.floor((sunday.getTime() - jan1.getTime()) / 86400000);
  const weekNo = Math.floor(dayNum / 7) + 1;
  return `${year}-W${String(weekNo).padStart(2, '0')}`;
}

/** Returns the Sunday (00:00:00 local) of the week containing `date`. */
export function getSundayOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  return d;
}

/** Returns the Saturday (23:59:59 local) of the week containing `date`. */
export function getSaturdayOfWeek(date: Date = new Date()): Date {
  const sun = getSundayOfWeek(date);
  const sat = new Date(sun);
  sat.setDate(sun.getDate() + 6);
  sat.setHours(23, 59, 59, 999);
  return sat;
}

export function getTodayDayKey(): string {
  return DAY_KEYS[new Date().getDay()];
}

// ── Per-day tasks ─────────────────────────────────────────
export type DayTasksMap = Record<string, Task[]>;

export async function loadDayTasks(): Promise<DayTasksMap> {
  try {
    const raw = await AsyncStorage.getItem(DAY_TASKS_KEY);
    if (!raw) {
      const seed: DayTasksMap = {};
      for (const d of DAY_KEYS) seed[d] = DEFAULT_TASKS;
      return seed;
    }
    return JSON.parse(raw) as DayTasksMap;
  } catch {
    const seed: DayTasksMap = {};
    for (const d of DAY_KEYS) seed[d] = DEFAULT_TASKS;
    return seed;
  }
}

export async function saveDayTasks(dayTasks: DayTasksMap): Promise<void> {
  try {
    await AsyncStorage.setItem(DAY_TASKS_KEY, JSON.stringify(dayTasks));
  } catch {}
}

// ── Current week record ───────────────────────────────────
export async function loadCurrentWeek(): Promise<WeekRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WeekRecord;
  } catch {
    return null;
  }
}

export async function saveCurrentWeek(record: WeekRecord): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {}
}

// ── Archive (rich history) ────────────────────────────────

/**
 * Builds a rich WeekHistoryEntry from the current completion state
 * and the per-day task map, then prepends it to history storage.
 */
export async function archiveWeekRich(
  record: WeekRecord,
  dayTasksMap: DayTasksMap,
): Promise<void> {
  try {
    const sunday  = getSundayOfWeek(new Date());
    // The week being archived is the PREVIOUS one if weekKey differs
    // Reconstruct dates from weekKey
    const startDate = getSundayOfWeekFromKey(record.weekKey);
    const endDate   = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const breakdown: DayBreakdown[] = DAY_KEYS.map(dayKey => {
      const tasks = dayTasksMap[dayKey] ?? [];
      const completedTaskTitles: string[] = [];
      const missedTaskTitles: string[]    = [];

      for (const task of tasks) {
        const key = `${dayKey}-${task.id}`;
        if (record.completions[key]) {
          completedTaskTitles.push(`${task.emoji} ${task.title}`);
        } else {
          missedTaskTitles.push(`${task.emoji} ${task.title}`);
        }
      }

      const done    = completedTaskTitles.length;
      const total   = tasks.length;
      const percent = total > 0 ? Math.round((done / total) * 100) : 0;

      return {
        dayKey,
        label: DAY_LABELS[dayKey] ?? dayKey,
        done,
        total,
        percent,
        completedTaskTitles,
        missedTaskTitles,
      };
    });

    const allTaskKeys  = DAY_KEYS.flatMap(d => (dayTasksMap[d] ?? []).map(t => `${d}-${t.id}`));
    const completedAll = allTaskKeys.filter(k => record.completions[k]);
    const missedAll    = allTaskKeys.filter(k => !record.completions[k]);
    const total        = allTaskKeys.length;
    const done         = completedAll.length;
    const percent      = total > 0 ? Math.round((done / total) * 100) : 0;

    const entry: WeekHistoryEntry = {
      weekKey: record.weekKey,
      startDate: startDate.toISOString().split('T')[0],
      endDate:   endDate.toISOString().split('T')[0],
      completionPercent: percent,
      completedTasks: completedAll,
      missedTasks:    missedAll,
      totalTasks: total,
      doneTasks:  done,
      dailyBreakdown: breakdown,
      savedAt: Date.now(),
    };

    const raw     = await AsyncStorage.getItem(HISTORY_KEY);
    const history: WeekHistoryEntry[] = raw ? JSON.parse(raw) : [];
    const filtered = history.filter(h => h.weekKey !== entry.weekKey);
    filtered.unshift(entry);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, 12)));
  } catch (e) {
    console.warn('[archiveWeekRich] error', e);
  }
}

/** Legacy archive — kept for backwards-compat, calls rich archive internally. */
export async function archiveWeek(record: WeekRecord): Promise<void> {
  // Load current dayTasks for the rich breakdown
  const dayTasksMap = await loadDayTasks();
  await archiveWeekRich(record, dayTasksMap);
}

export async function loadHistory(): Promise<WeekHistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WeekHistoryEntry[];
  } catch {
    return [];
  }
}

// ── Auto-reset detection ──────────────────────────────────

/**
 * Derives the Sunday date from a weekKey string like "2025-W23".
 * This is an approximation using the ISO week convention adjusted for
 * our Sunday-based numbering.
 */
function getSundayOfWeekFromKey(weekKey: string): Date {
  const match = weekKey.match(/^(\d{4})-W(\d+)$/);
  if (!match) return new Date();
  const year   = parseInt(match[1], 10);
  const weekNo = parseInt(match[2], 10);
  // Jan 1 + (weekNo-1)*7 days, then back to Sunday
  const jan1   = new Date(year, 0, 1);
  const d      = new Date(jan1.getTime() + (weekNo - 1) * 7 * 86400000);
  // Snap to Sunday
  d.setDate(d.getDate() - d.getDay());
  return d;
}

/**
 * Call this at app startup (and optionally on AppState change).
 * It checks whether the current week has changed since the last save,
 * archives the old data if so, and resets completions.
 *
 * Returns true if a reset actually happened.
 */
export async function checkAndResetIfNewWeek(
  dayTasksMap: DayTasksMap,
): Promise<{ reset: boolean; archivedWeekKey?: string }> {
  const currentWeekKey = getWeekKey();

  try {
    const record = await loadCurrentWeek();

    if (!record) {
      // First run — just create a blank record
      await saveCurrentWeek({
        weekKey: currentWeekKey,
        completions: {},
        tasks: [],
        savedAt: Date.now(),
      });
      return { reset: false };
    }

    if (record.weekKey !== currentWeekKey) {
      // ← New week detected → archive & reset
      await archiveWeekRich(record, dayTasksMap);

      const fresh: WeekRecord = {
        weekKey: currentWeekKey,
        completions: {},
        tasks: [],
        savedAt: Date.now(),
      };
      await saveCurrentWeek(fresh);
      await AsyncStorage.setItem(LAST_CHECK_KEY, Date.now().toString());

      return { reset: true, archivedWeekKey: record.weekKey };
    }

    return { reset: false };
  } catch {
    return { reset: false };
  }
}

// ── Stats ─────────────────────────────────────────────────
export function calcStats(
  completions: Record<string, boolean>,
  dayTasks: DayTasksMap,
  days: string[] = DAY_KEYS,
) {
  let totalTasks = 0;
  let done       = 0;
  const byDay: Record<string, { done: number; total: number; percent: number }> = {};

  for (const day of days) {
    const tasks = dayTasks[day] ?? [];
    let dayDone = 0;
    for (const task of tasks) {
      if (completions[`${day}-${task.id}`]) {
        done++;
        dayDone++;
      }
    }
    totalTasks += tasks.length;
    byDay[day] = {
      done: dayDone,
      total: tasks.length,
      percent: tasks.length > 0 ? Math.round((dayDone / tasks.length) * 100) : 0,
    };
  }

  return {
    percent: totalTasks > 0 ? Math.round((done / totalTasks) * 100) : 0,
    done,
    total: totalTasks,
    byDay,
  };
}

/** Format a weekKey like "2025-W23" → "23.6 – 29.6.2025" */
export function formatWeekRange(weekKey: string): string {
  const match = weekKey.match(/^(\d{4})-W(\d+)$/);
  if (!match) return weekKey;

  const sunday = getSundayOfWeekFromKey(weekKey);
  const sat    = new Date(sunday);
  sat.setDate(sunday.getDate() + 6);

  const fmt = (d: Date) =>
    `${d.getDate()}.${d.getMonth() + 1}`;

  return `${fmt(sunday)} – ${fmt(sat)}.${sat.getFullYear()}`;
}
