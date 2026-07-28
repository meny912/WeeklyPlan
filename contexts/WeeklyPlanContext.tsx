// Powered by OnSpace.AI
import React, {
  createContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  Task,
  DayTasksMap,
  WeekRecord,
  WeekHistoryEntry,
  loadCurrentWeek,
  saveCurrentWeek,
  archiveWeekRich,
  loadDayTasks,
  saveDayTasks,
  loadHistory,
  getWeekKey,
  getSundayOfWeek,
  checkAndResetIfNewWeek,
  DAY_KEYS,
} from '@/services/weeklyPlanService';

interface WeeklyPlanContextType {
  weekKey: string;
  dayTasks: DayTasksMap;
  completions: Record<string, boolean>;
  history: WeekHistoryEntry[];
  loading: boolean;
  lastResetAt: number | null;    // unix ms of the last auto-reset, null if none yet
  getTasksForDay: (dayKey: string) => Task[];
  toggleTask: (dayKey: string, taskId: string) => void;
  markTaskComplete: (dayKey: string, taskId: string) => void;
  addTaskToDay: (dayKey: string, title: string, emoji: string) => void;
  addTaskToAllDays: (title: string, emoji: string) => void;
  removeTaskFromDay: (dayKey: string, taskId: string) => void;
  resetWeek: () => void;
  reloadHistory: () => Promise<void>;
}

export const WeeklyPlanContext = createContext<WeeklyPlanContextType | undefined>(undefined);

export function WeeklyPlanProvider({ children }: { children: ReactNode }) {
  const [weekKey, setWeekKey]       = useState<string>(getWeekKey());
  const [dayTasks, setDayTasks]     = useState<DayTasksMap>({});
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [history, setHistory]       = useState<WeekHistoryEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [lastResetAt, setLastResetAt] = useState<number | null>(null);

  // ── Initialization ──────────────────────────────────────
  const initialize = useCallback(async () => {
    setLoading(true);

    // 1. Load per-day tasks first (needed for archiving)
    const storedDayTasks = await loadDayTasks();
    setDayTasks(storedDayTasks);

    // 2. Check for new week → auto-archive + reset if needed
    const { reset, archivedWeekKey } = await checkAndResetIfNewWeek(storedDayTasks);

    if (reset) {
      setCompletions({});
      setLastResetAt(Date.now());
    } else {
      // Load whatever completions exist for the current week
      const record = await loadCurrentWeek();
      setCompletions(record?.completions ?? {});
    }

    // 3. Always reflect the current weekKey
    setWeekKey(getWeekKey());

    // 4. Load history
    const hist = await loadHistory();
    setHistory(hist);

    setLoading(false);
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // ── AppState listener — check reset when app foregrounded ──
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        // App came to foreground — check if we crossed into a new week
        const dt = await loadDayTasks();
        const { reset } = await checkAndResetIfNewWeek(dt);
        if (reset) {
          setDayTasks(dt);
          setCompletions({});
          setWeekKey(getWeekKey());
          setLastResetAt(Date.now());
          const hist = await loadHistory();
          setHistory(hist);
        }
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, []);

  // ── Scheduled Sunday-midnight check ────────────────────
  // Compute ms until next Sunday 00:00:05 and run a check then
  useEffect(() => {
    const msUntilNextSunday = (): number => {
      const now    = new Date();
      const nextSun = getSundayOfWeek(new Date(now));
      // If today is already Sunday but before midnight, next reset is 7 days away
      if (now.getDay() === 0) {
        nextSun.setDate(nextSun.getDate() + 7);
      } else {
        nextSun.setDate(nextSun.getDate() + (7 - now.getDay()));
      }
      nextSun.setHours(0, 0, 5, 0); // 00:00:05 with small buffer
      return Math.max(0, nextSun.getTime() - now.getTime());
    };

    const schedule = () => {
      const delay = msUntilNextSunday();
      const timer = setTimeout(async () => {
        const dt = await loadDayTasks();
        const { reset } = await checkAndResetIfNewWeek(dt);
        if (reset) {
          setDayTasks(dt);
          setCompletions({});
          setWeekKey(getWeekKey());
          setLastResetAt(Date.now());
          const hist = await loadHistory();
          setHistory(hist);
        }
        // Schedule for the next week
        schedule();
      }, delay);
      return timer;
    };

    const timer = schedule();
    return () => clearTimeout(timer);
  }, []);

  // ── Persist helpers ─────────────────────────────────────
  const persistCompletions = useCallback(
    async (newCompletions: Record<string, boolean>) => {
      const record: WeekRecord = {
        weekKey,
        completions: newCompletions,
        tasks: [],
        savedAt: Date.now(),
      };
      await saveCurrentWeek(record);
    },
    [weekKey],
  );

  // ── History reload ──────────────────────────────────────
  const reloadHistory = useCallback(async () => {
    const hist = await loadHistory();
    setHistory(hist);
  }, []);

  // ── Task selectors / mutators ───────────────────────────
  const getTasksForDay = useCallback(
    (day: string): Task[] => dayTasks[day] ?? [],
    [dayTasks],
  );

  const toggleTask = useCallback(
    (dayKey: string, taskId: string) => {
      const key = `${dayKey}-${taskId}`;
      setCompletions(prev => {
        const updated = { ...prev, [key]: !prev[key] };
        persistCompletions(updated);
        return updated;
      });
    },
    [persistCompletions],
  );

  // Idempotent: set a task's completion to true (used when a linked prayer is finished).
  const markTaskComplete = useCallback(
    (dayKey: string, taskId: string) => {
      const key = `${dayKey}-${taskId}`;
      setCompletions(prev => {
        if (prev[key]) return prev;
        const updated = { ...prev, [key]: true };
        persistCompletions(updated);
        return updated;
      });
    },
    [persistCompletions],
  );

  const addTaskToDay = useCallback(
    async (dayKey: string, title: string, emoji: string) => {
      const newTask: Task = { id: `task_${Date.now()}`, title, emoji };
      const updated: DayTasksMap = {
        ...dayTasks,
        [dayKey]: [...(dayTasks[dayKey] ?? []), newTask],
      };
      setDayTasks(updated);
      await saveDayTasks(updated);
    },
    [dayTasks],
  );

  const addTaskToAllDays = useCallback(
    async (title: string, emoji: string) => {
      const newTask: Task = { id: `task_${Date.now()}`, title, emoji };
      const updated: DayTasksMap = {};
      for (const d of DAY_KEYS) {
        updated[d] = [...(dayTasks[d] ?? []), newTask];
      }
      setDayTasks(updated);
      await saveDayTasks(updated);
    },
    [dayTasks],
  );

  const removeTaskFromDay = useCallback(
    async (dayKey: string, taskId: string) => {
      const updated: DayTasksMap = {
        ...dayTasks,
        [dayKey]: (dayTasks[dayKey] ?? []).filter(t => t.id !== taskId),
      };
      setDayTasks(updated);
      const newCompletions = { ...completions };
      delete newCompletions[`${dayKey}-${taskId}`];
      setCompletions(newCompletions);
      await saveDayTasks(updated);
      await persistCompletions(newCompletions);
    },
    [dayTasks, completions, persistCompletions],
  );

  // Manual reset (e.g. triggered by user from UI)
  const resetWeek = useCallback(async () => {
    const current = await loadCurrentWeek();
    if (current) {
      const dt = await loadDayTasks();
      await archiveWeekRich(current, dt);
    }
    const newKey = getWeekKey();
    const fresh: WeekRecord = {
      weekKey: newKey,
      completions: {},
      tasks: [],
      savedAt: Date.now(),
    };
    await saveCurrentWeek(fresh);
    setWeekKey(newKey);
    setCompletions({});
    setLastResetAt(Date.now());
    const hist = await loadHistory();
    setHistory(hist);
  }, []);

  return (
    <WeeklyPlanContext.Provider
      value={{
        weekKey,
        dayTasks,
        completions,
        history,
        loading,
        lastResetAt,
        getTasksForDay,
        toggleTask,
        markTaskComplete,
        addTaskToDay,
        addTaskToAllDays,
        removeTaskFromDay,
        resetWeek,
        reloadHistory,
      }}
    >
      {children}
    </WeeklyPlanContext.Provider>
  );
}
