import type { DailyMeasurement, UserContext, WeeklyMeasurement } from '../types';
import { formatDate, getWeekStart } from '../utils/date';
import { getDailyReminderMessage, getWeeklyReminderMessage } from './notificationEngine';

// Module-level timer IDs for cancellation
let dailyTimerId: ReturnType<typeof setTimeout> | null = null;
let weeklyTimerId: ReturnType<typeof setTimeout> | null = null;
let dailyIntervalId: ReturnType<typeof setInterval> | null = null;
let weeklyIntervalId: ReturnType<typeof setInterval> | null = null;

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
 * Returns true if NO measurement exists for the current period (user should be reminded).
 */
export function shouldNotify(
  type: 'daily' | 'weekly',
  measurements: DailyMeasurement[] | WeeklyMeasurement[]
): boolean {
  if (type === 'daily') {
    const today = formatDate(new Date());
    return !measurements.some((m) => m.date === today);
  }

  // weekly: check if any measurement has the current week's Monday date
  const currentWeekStart = getWeekStart(new Date());
  return !measurements.some((m) => m.date === currentWeekStart);
}

/** Get the configured reminder time (HH:MM) from localStorage, default 20:00 */
function getReminderTime(): { hours: number; minutes: number } {
  const stored = localStorage.getItem('reminderTime')
  if (stored) {
    const [h, m] = stored.split(':').map(Number)
    if (!isNaN(h) && !isNaN(m)) return { hours: h, minutes: m }
  }
  return { hours: 20, minutes: 0 }
}

/** Calculate milliseconds until the next occurrence of the configured reminder time */
function msUntilNextReminder(): number {
  const { hours, minutes } = getReminderTime()
  const now = new Date();
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);

  if (now >= target) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

/** Calculate milliseconds until the next Sunday at the configured reminder time */
function msUntilNextSundayReminder(): number {
  const { hours, minutes } = getReminderTime()
  const now = new Date();
  const target = new Date(now);
  const currentDay = target.getDay();

  const daysUntilSunday = currentDay === 0 ? 0 : 7 - currentDay;
  target.setDate(target.getDate() + daysUntilSunday);
  target.setHours(hours, minutes, 0, 0);

  if (now >= target) {
    target.setDate(target.getDate() + 7);
  }

  return target.getTime() - now.getTime();
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;

/** Build a default UserContext when full context is not available at the call site */
function getDefaultUserContext(): UserContext {
  return {
    state: 'stagnating',
    currentDailyStreak: 0,
    hasActiveGoal: false,
  };
}

/** Schedule a daily reminder notification at 20:00 */
export function scheduleDailyReminder(): void {
  cancelDaily();

  const delay = msUntilNextReminder();

  dailyTimerId = setTimeout(() => {
    if (isEnabled()) {
      const context = getDefaultUserContext();
      const n = new Notification('Tägliche Messung', {
        body: getDailyReminderMessage(context),
        tag: 'daily-reminder',
      });
      n.onclick = () => { window.focus(); window.location.href = '/daily'; };
    }

    // Repeat every 24 hours
    dailyIntervalId = setInterval(() => {
      if (isEnabled()) {
        const context = getDefaultUserContext();
        const n = new Notification('Tägliche Messung', {
          body: getDailyReminderMessage(context),
          tag: 'daily-reminder',
        });
        n.onclick = () => { window.focus(); window.location.href = '/daily'; };
      }
    }, ONE_DAY_MS);
  }, delay);
}

/** Schedule a weekly reminder notification on Sundays at 20:00 */
export function scheduleWeeklyReminder(): void {
  cancelWeekly();

  const delay = msUntilNextSundayReminder();

  weeklyTimerId = setTimeout(() => {
    if (isEnabled()) {
      const context = getDefaultUserContext();
      const n = new Notification('Wöchentliche Messung', {
        body: getWeeklyReminderMessage(context),
        tag: 'weekly-reminder',
      });
      n.onclick = () => { window.focus(); window.location.href = '/weekly'; };
    }

    // Repeat every 7 days
    weeklyIntervalId = setInterval(() => {
      if (isEnabled()) {
        const context = getDefaultUserContext();
        const n = new Notification('Wöchentliche Messung', {
          body: getWeeklyReminderMessage(context),
          tag: 'weekly-reminder',
        });
        n.onclick = () => { window.focus(); window.location.href = '/weekly'; };
      }
    }, ONE_WEEK_MS);
  }, delay);
}

/** Cancel daily reminder timers */
function cancelDaily(): void {
  if (dailyTimerId !== null) {
    clearTimeout(dailyTimerId);
    dailyTimerId = null;
  }
  if (dailyIntervalId !== null) {
    clearInterval(dailyIntervalId);
    dailyIntervalId = null;
  }
}

/** Cancel weekly reminder timers */
function cancelWeekly(): void {
  if (weeklyTimerId !== null) {
    clearTimeout(weeklyTimerId);
    weeklyTimerId = null;
  }
  if (weeklyIntervalId !== null) {
    clearInterval(weeklyIntervalId);
    weeklyIntervalId = null;
  }
}

/** Cancel all scheduled notifications */
export function cancelAll(): void {
  cancelDaily();
  cancelWeekly();
}
