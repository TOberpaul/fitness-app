import { formatDate, getWeekStart } from '../utils/date';
import { getDailyReminderMessage, getWeeklyReminderMessage } from './notificationEngine';
import type { DailyMeasurement, WeeklyMeasurement } from '../types';

/** Request Web Push API notification permission */
export async function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.requestPermission();
}

/** Check if notifications are currently enabled (permission granted) */
export function isEnabled(): boolean {
  if (!('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
}

/**
 * Check if a notification should be sent for the given type.
 * Returns true if NO measurement exists for the current period.
 */
export function shouldNotify(
  type: 'daily' | 'weekly',
  measurements: DailyMeasurement[] | WeeklyMeasurement[]
): boolean {
  if (type === 'daily') {
    const today = formatDate(new Date());
    return !measurements.some((m) => m.date === today);
  }
  const currentWeekStart = getWeekStart(new Date());
  return !measurements.some((m) => m.date === currentWeekStart);
}

/** Get the configured reminder time from localStorage */
export function getReminderTime(): string {
  return localStorage.getItem('reminderTime') || '20:00';
}

/** Re-export message generators for use in other modules */
export { getDailyReminderMessage, getWeeklyReminderMessage };
