// Powered by OnSpace.AI
// Local notification service for daily study reminders

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const NOTIF_STORAGE_KEY = 'daily_reminder_id';
const NOTIF_IDENTIFIER  = 'daily-tanya-reminder';

// ─── Configure notification appearance ───────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  false,
    shouldShowBanner: true,
    shouldShowList:   true,
  }),
});

// ─── Permission ───────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') return false;

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function getNotificationPermission(): Promise<'granted' | 'denied' | 'undetermined'> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status as 'granted' | 'denied' | 'undetermined';
  } catch {
    return 'undetermined';
  }
}

// ─── Schedule daily reminder ──────────────────────────────

export interface ReminderConfig {
  hour:   number; // 0-23
  minute: number; // 0-59
  titleHe?: string;
  bodyHe?:  string;
}

/**
 * Schedule (or reschedule) the daily study reminder.
 * Cancels any previously scheduled reminder first.
 */
export async function scheduleDailyReminder(config: ReminderConfig): Promise<boolean> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return false;

    // Cancel existing reminder
    await cancelDailyReminder();

    const id = await Notifications.scheduleNotificationAsync({
      identifier: NOTIF_IDENTIFIER,
      content: {
        title: config.titleHe ?? '📗 שיעור תניא יומי',
        body:  config.bodyHe  ?? 'הגיע הזמן ללמוד את השיעור היומי!',
        data:  { type: 'daily_reminder' },
        sound: true,
      },
      trigger: {
        hour:    config.hour,
        minute:  config.minute,
        second:  0,
        repeats: true,
      } as any,
    });

    await AsyncStorage.setItem(NOTIF_STORAGE_KEY, id);
    return true;
  } catch (e) {
    console.warn('[NotificationService] schedule failed:', e);
    return false;
  }
}

/**
 * Cancel the scheduled daily reminder.
 */
export async function cancelDailyReminder(): Promise<void> {
  try {
    // Cancel by known identifier
    await Notifications.cancelScheduledNotificationAsync(NOTIF_IDENTIFIER);
  } catch {}

  try {
    // Also cancel any previously stored id (for robustness)
    const storedId = await AsyncStorage.getItem(NOTIF_STORAGE_KEY);
    if (storedId && storedId !== NOTIF_IDENTIFIER) {
      await Notifications.cancelScheduledNotificationAsync(storedId);
    }
    await AsyncStorage.removeItem(NOTIF_STORAGE_KEY);
  } catch {}
}

/**
 * Cancel ALL scheduled notifications from this app.
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(NOTIF_STORAGE_KEY);
  } catch {}
}

/**
 * Returns true if there is an active daily reminder scheduled.
 */
export async function isDailyReminderActive(): Promise<boolean> {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    return all.some(n => n.identifier === NOTIF_IDENTIFIER);
  } catch {
    return false;
  }
}

/**
 * Get the current reminder configuration (hour/minute) from scheduled notifications.
 * Returns null if no reminder is active.
 */
export async function getCurrentReminderTime(): Promise<{ hour: number; minute: number } | null> {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    const found = all.find(n => n.identifier === NOTIF_IDENTIFIER);
    if (!found) return null;

    // Try to extract hour/minute from trigger
    const trigger = found.trigger as any;
    if (typeof trigger?.hour === 'number' && typeof trigger?.minute === 'number') {
      return { hour: trigger.hour, minute: trigger.minute };
    }
    return null;
  } catch {
    return null;
  }
}
