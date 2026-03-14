import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  requestPermission,
  isEnabled,
  shouldNotify,
  scheduleDailyReminder,
  scheduleWeeklyReminder,
  cancelAll,
} from './notificationService';
import type { DailyMeasurement, WeeklyMeasurement } from '../types';
import { formatDate, getWeekStart } from '../utils/date';

// Mock Notification API
const mockNotification = vi.fn();
const mockRequestPermission = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  // Setup Notification mock
  Object.defineProperty(globalThis, 'Notification', {
    value: Object.assign(mockNotification, {
      permission: 'granted',
      requestPermission: mockRequestPermission,
    }),
    writable: true,
    configurable: true,
  });
  mockNotification.mockClear();
  mockRequestPermission.mockClear();
});

afterEach(() => {
  cancelAll();
  vi.useRealTimers();
});

describe('requestPermission', () => {
  it('should call Notification.requestPermission', async () => {
    mockRequestPermission.mockResolvedValue('granted');
    const result = await requestPermission();
    expect(result).toBe('granted');
    expect(mockRequestPermission).toHaveBeenCalled();
  });

  it('should return denied when Notification API is not available', async () => {
    Object.defineProperty(globalThis, 'Notification', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    // Re-import won't help since the check is at runtime, so we need to
    // temporarily remove Notification from window
    const saved = (globalThis as any).Notification;
    delete (globalThis as any).Notification;
    const result = await requestPermission();
    expect(result).toBe('denied');
    (globalThis as any).Notification = saved;
  });
});

describe('isEnabled', () => {
  it('should return true when permission is granted', () => {
    (Notification as any).permission = 'granted';
    expect(isEnabled()).toBe(true);
  });

  it('should return false when permission is denied', () => {
    (Notification as any).permission = 'denied';
    expect(isEnabled()).toBe(false);
  });

  it('should return false when permission is default', () => {
    (Notification as any).permission = 'default';
    expect(isEnabled()).toBe(false);
  });
});

describe('shouldNotify', () => {
  it('should return true for daily when no measurement exists for today', () => {
    const measurements: DailyMeasurement[] = [
      { date: '2024-01-01', weight: 80, source: 'manual', updatedAt: '2024-01-01T10:00:00Z' },
    ];
    expect(shouldNotify('daily', measurements)).toBe(true);
  });

  it('should return false for daily when measurement exists for today', () => {
    const today = formatDate(new Date());
    const measurements: DailyMeasurement[] = [
      { date: today, weight: 80, source: 'manual', updatedAt: new Date().toISOString() },
    ];
    expect(shouldNotify('daily', measurements)).toBe(false);
  });

  it('should return true for weekly when no measurement exists for current week', () => {
    const measurements: WeeklyMeasurement[] = [
      { date: '2024-01-01', chest: 100, updatedAt: '2024-01-01T10:00:00Z' },
    ];
    expect(shouldNotify('weekly', measurements)).toBe(true);
  });

  it('should return false for weekly when measurement exists for current week', () => {
    const weekStart = getWeekStart(new Date());
    const measurements: WeeklyMeasurement[] = [
      { date: weekStart, chest: 100, updatedAt: new Date().toISOString() },
    ];
    expect(shouldNotify('weekly', measurements)).toBe(false);
  });

  it('should return true for daily with empty array', () => {
    expect(shouldNotify('daily', [])).toBe(true);
  });

  it('should return true for weekly with empty array', () => {
    expect(shouldNotify('weekly', [])).toBe(true);
  });
});

describe('scheduleDailyReminder', () => {
  it('should schedule a notification and fire at 20:00', () => {
    // Set current time to 19:00
    vi.setSystemTime(new Date(2024, 5, 15, 19, 0, 0));
    (Notification as any).permission = 'granted';

    scheduleDailyReminder();

    // Advance 1 hour to 20:00
    vi.advanceTimersByTime(60 * 60 * 1000);

    expect(mockNotification).toHaveBeenCalledWith('Tägliche Messung', {
      body: 'Hast du heute schon dein Gewicht eingetragen?',
      tag: 'daily-reminder',
    });
  });

  it('should not fire notification if permission is not granted', () => {
    vi.setSystemTime(new Date(2024, 5, 15, 19, 0, 0));
    (Notification as any).permission = 'denied';

    scheduleDailyReminder();
    vi.advanceTimersByTime(60 * 60 * 1000);

    expect(mockNotification).not.toHaveBeenCalled();
  });
});

describe('scheduleWeeklyReminder', () => {
  it('should schedule a notification for Sunday at 20:00', () => {
    // Set to Sunday 19:00 (June 16, 2024 is a Sunday)
    vi.setSystemTime(new Date(2024, 5, 16, 19, 0, 0));
    (Notification as any).permission = 'granted';

    scheduleWeeklyReminder();

    // Advance 1 hour to 20:00
    vi.advanceTimersByTime(60 * 60 * 1000);

    expect(mockNotification).toHaveBeenCalledWith('Wöchentliche Messung', {
      body: 'Hast du diese Woche deine Körperumfänge gemessen?',
      tag: 'weekly-reminder',
    });
  });
});

describe('cancelAll', () => {
  it('should cancel all scheduled timers', () => {
    vi.setSystemTime(new Date(2024, 5, 15, 19, 0, 0));

    scheduleDailyReminder();
    scheduleWeeklyReminder();
    cancelAll();

    // Advance past all scheduled times
    vi.advanceTimersByTime(7 * 24 * 60 * 60 * 1000);

    expect(mockNotification).not.toHaveBeenCalled();
  });
});
