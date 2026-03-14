import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  formatDate,
  getWeekStart,
  getDateRange,
  calculatePercentChange,
  determineTrend,
} from './date';

describe('formatDate', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(formatDate(new Date(2024, 0, 15))).toBe('2024-01-15');
  });

  it('pads single-digit month and day', () => {
    expect(formatDate(new Date(2024, 2, 5))).toBe('2024-03-05');
  });

  it('handles December 31st', () => {
    expect(formatDate(new Date(2023, 11, 31))).toBe('2023-12-31');
  });
});

describe('getWeekStart', () => {
  it('returns the same date if already Monday', () => {
    // 2024-01-15 is a Monday
    expect(getWeekStart(new Date(2024, 0, 15))).toBe('2024-01-15');
  });

  it('returns previous Monday for a Wednesday', () => {
    // 2024-01-17 is a Wednesday
    expect(getWeekStart(new Date(2024, 0, 17))).toBe('2024-01-15');
  });

  it('returns previous Monday for a Sunday', () => {
    // 2024-01-21 is a Sunday
    expect(getWeekStart(new Date(2024, 0, 21))).toBe('2024-01-15');
  });

  it('returns previous Monday for a Saturday', () => {
    // 2024-01-20 is a Saturday
    expect(getWeekStart(new Date(2024, 0, 20))).toBe('2024-01-15');
  });

  it('handles month boundary', () => {
    // 2024-02-01 is a Thursday → Monday is 2024-01-29
    expect(getWeekStart(new Date(2024, 1, 1))).toBe('2024-01-29');
  });
});

describe('getDateRange', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 7-day range for 1W', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 15)); // June 15, 2024
    const range = getDateRange('1W');
    expect(range.to).toBe('2024-06-15');
    expect(range.from).toBe('2024-06-08');
  });

  it('returns 1-month range for 1M', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 15));
    const range = getDateRange('1M');
    expect(range.to).toBe('2024-06-15');
    expect(range.from).toBe('2024-05-15');
  });

  it('returns range from year 2000 for Max', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 15));
    const range = getDateRange('Max');
    expect(range.to).toBe('2024-06-15');
    expect(range.from).toBe('2000-06-15');
  });
});

describe('calculatePercentChange', () => {
  it('calculates positive change', () => {
    expect(calculatePercentChange(80, 88)).toBe(10);
  });

  it('calculates negative change', () => {
    expect(calculatePercentChange(100, 90)).toBe(-10);
  });

  it('returns 0 for no change', () => {
    expect(calculatePercentChange(75, 75)).toBe(0);
  });

  it('returns 0 when start is 0', () => {
    expect(calculatePercentChange(0, 50)).toBe(0);
  });

  it('rounds to one decimal place', () => {
    // ((85 - 80) / 80) * 100 = 6.25 → 6.3
    expect(calculatePercentChange(80, 85)).toBe(6.3);
  });
});

describe('determineTrend', () => {
  it('returns flat for empty array', () => {
    expect(determineTrend([])).toBe('flat');
  });

  it('returns flat for single data point', () => {
    expect(determineTrend([{ date: '2024-01-01', value: 80 }])).toBe('flat');
  });

  it('returns down when last < first', () => {
    expect(determineTrend([
      { date: '2024-01-01', value: 80 },
      { date: '2024-01-15', value: 75 },
    ])).toBe('down');
  });

  it('returns up when last > first', () => {
    expect(determineTrend([
      { date: '2024-01-01', value: 75 },
      { date: '2024-01-15', value: 80 },
    ])).toBe('up');
  });

  it('returns flat when last equals first', () => {
    expect(determineTrend([
      { date: '2024-01-01', value: 80 },
      { date: '2024-01-15', value: 80 },
    ])).toBe('flat');
  });

  it('only compares first and last, ignoring middle values', () => {
    expect(determineTrend([
      { date: '2024-01-01', value: 80 },
      { date: '2024-01-08', value: 90 },
      { date: '2024-01-15', value: 75 },
    ])).toBe('down');
  });
});
