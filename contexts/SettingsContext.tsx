// Powered by OnSpace.AI
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, setLanguage, t as tRaw, isRTL as isRTLFn, TranslationKey } from '@/services/i18n';
import { DAY_KEYS } from '@/services/weeklyPlanService';
import {
  scheduleDailyReminder,
  cancelDailyReminder,
  isDailyReminderActive,
} from '@/services/notificationService';

// ─── Types ────────────────────────────────────────────────

export type Region = 'israel' | 'abroad';

export interface ReminderTime {
  hour:   number; // 0-23
  minute: number; // 0-59
}

export interface SettingsState {
  language:        Language;
  region:          Region;
  reminderEnabled: boolean;
  reminderTime:    ReminderTime;
  loaded:          boolean;
}

interface SettingsContextValue extends SettingsState {
  updateLanguage:       (lang: Language)       => Promise<void>;
  updateRegion:         (region: Region)       => Promise<void>;
  updateReminderEnabled:(enabled: boolean)     => Promise<void>;
  updateReminderTime:   (time: ReminderTime)   => Promise<void>;
}

// ─── Defaults ─────────────────────────────────────────────

const DEFAULT_STATE: SettingsState = {
  language:        'he',
  region:          'israel',
  reminderEnabled: false,
  reminderTime:    { hour: 8, minute: 0 },
  loaded:          false,
};

const STORAGE_KEY = 'app_settings_v1';

// ─── Context ──────────────────────────────────────────────

const SettingsContext = createContext<SettingsContextValue>({
  ...DEFAULT_STATE,
  updateLanguage:        async () => {},
  updateRegion:          async () => {},
  updateReminderEnabled: async () => {},
  updateReminderTime:    async () => {},
});

// ─── Provider ─────────────────────────────────────────────

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SettingsState>(DEFAULT_STATE);

  // ── Load persisted settings on mount ──────────────────
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as Partial<SettingsState>;
          const merged: SettingsState = {
            ...DEFAULT_STATE,
            ...saved,
            reminderTime: {
              ...DEFAULT_STATE.reminderTime,
              ...(saved.reminderTime ?? {}),
            },
            loaded: true,
          };
          setState(merged);
          // Sync the i18n module language
          setLanguage(merged.language);
        } else {
          setState(prev => ({ ...prev, loaded: true }));
        }
      } catch {
        setState(prev => ({ ...prev, loaded: true }));
      }
    })();
  }, []);

  // ── Persist helper ─────────────────────────────────────
  const persist = useCallback(async (next: SettingsState) => {
    try {
      const { loaded: _loaded, ...toSave } = next;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {}
  }, []);

  // ── Actions ────────────────────────────────────────────

  const updateLanguage = useCallback(async (lang: Language) => {
    setLanguage(lang);
    setState(prev => {
      const next = { ...prev, language: lang };
      persist(next);
      return next;
    });
  }, [persist]);

  const updateRegion = useCallback(async (region: Region) => {
    setState(prev => {
      const next = { ...prev, region };
      persist(next);
      return next;
    });
  }, [persist]);

  const updateReminderEnabled = useCallback(async (enabled: boolean) => {
    setState(prev => {
      const next = { ...prev, reminderEnabled: enabled };
      persist(next);
      return next;
    });

    if (enabled) {
      // Schedule with current stored time
      const current = state.reminderTime;
      await scheduleDailyReminder({
        hour:   current.hour,
        minute: current.minute,
      });
    } else {
      await cancelDailyReminder();
    }
  }, [state.reminderTime, persist]);

  const updateReminderTime = useCallback(async (time: ReminderTime) => {
    setState(prev => {
      const next = { ...prev, reminderTime: time };
      persist(next);
      return next;
    });

    // If reminders are active, reschedule with new time
    if (state.reminderEnabled) {
      await scheduleDailyReminder({ hour: time.hour, minute: time.minute });
    }
  }, [state.reminderEnabled, persist]);

  return (
    <SettingsContext.Provider
      value={{
        ...state,
        updateLanguage,
        updateRegion,
        updateReminderEnabled,
        updateReminderTime,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

/**
 * useTranslation – returns a reactive `t()` function.
 * Any component that calls this hook will re-render automatically
 * whenever the user switches language in Settings.
 */
export function useTranslation() {
  const { language } = useSettings();
  return {
    t: (key: TranslationKey) => tRaw(key, language),
    language,
    isRTL: isRTLFn(language),
  };
}

/**
 * useDayLabels – returns a reactive map of day keys → translated display names.
 * Automatically re-renders consuming components when the language changes.
 *
 * Keys: 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'
 * Values: full translated name in the current language
 *
 * The underlying task data is stored using the English day keys ('sun', 'mon' …)
 * – only the *display* string changes per language.
 */
export function useDayLabels(): Record<string, string> {
  const { language } = useSettings();
  const dayKeyMap: Record<string, TranslationKey> = {
    sun: 'day_full_sun',
    mon: 'day_full_mon',
    tue: 'day_full_tue',
    wed: 'day_full_wed',
    thu: 'day_full_thu',
    fri: 'day_full_fri',
    sat: 'day_full_sat',
  };
  const labels: Record<string, string> = {};
  for (const key of DAY_KEYS) {
    labels[key] = tRaw(dayKeyMap[key]!, language);
  }
  return labels;
}
