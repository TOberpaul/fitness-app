import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  requestPermission,
  isEnabled,
  shouldNotify,
  getReminderTime,
} from './notificationService';
import type { DailyMeasurement, WeeklyMeasurement } from '../types';
import { formatDate, getWeekStart } from '../utils/date';

const mockRequestPermission = vi.fn();

beforeEach(() => {
  const store: Record<string, string> = {};
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
  });
  Object.defineProperty(globalThis, 'Notification', {
    value: Object.assign(vi.fn(), {
      permission: 'granted',
      requestPermission: mockRequestPermission,
    }),
    writable: true,
    configurable: true,
  });
  mockRequestPermission.mockClear();
});

describe('requestPermission', () => {
  it('should call Notification.requestPermission', async () => {
    mockRequestPermission.mockResolvedValue('granted');
    const result = await requestPermission();
    expect(result).toBe('granted');
    expect(mockRequestPermission).toHaveBeenCalled();
  });

  it('should return denied when Notification API is not available', async () => {
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

describe('getReminderTime', () => {
  it('should return default 20:00 when not set', () => {
    expect(getReminderTime()).toBe('20:00');
  });

  it('should return stored value', () => {
    localStorage.setItem('reminderTime', '08:30');
    expect(getReminderTime()).toBe('08:30');
  });
});
