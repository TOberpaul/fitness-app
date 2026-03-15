import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { resetDB } from '../db';
import {
  updateDailyStreak,
  updateWeeklyStreak,
  getStreaks,
} from '../gamificationService';

beforeEach(() => {
  resetDB();
  indexedDB.deleteDatabase('fitness-tracker');
});

describe('gamificationService - getStreaks', () => {
  it('returns default zeroed streaks when no data exists', async () => {
    const streaks = await getStreaks();
    expect(streaks.dailyStreak).toBe(0);
    expect(streaks.dailyLastDate).toBeNull();
    expect(streaks.weeklyStreak).toBe(0);
    expect(streaks.weeklyLastDate).toBeNull();
  });
});

describe('gamificationService - updateDailyStreak', () => {
  it('starts streak at 1 on first measurement', async () => {
    const result = await updateDailyStreak('2024-01-15');
    expect(result.currentStreak).toBe(1);
    expect(result.isNewRecord).toBe(true);
    expect(result.thresholdReached).toBeNull();
  });

  it('increments streak on consecutive days', async () => {
    await updateDailyStreak('2024-01-15');
    const result = await updateDailyStreak('2024-01-16');
    expect(result.currentStreak).toBe(2);
    expect(result.isNewRecord).toBe(true);
  });

  it('resets streak to 1 on gap', async () => {
    await updateDailyStreak('2024-01-15');
    await updateDailyStreak('2024-01-16');
    const result = await updateDailyStreak('2024-01-19'); // 2-day gap
    expect(result.currentStreak).toBe(1);
    expect(result.isNewRecord).toBe(false);
  });

  it('is idempotent for same date', async () => {
    await updateDailyStreak('2024-01-15');
    const result = await updateDailyStreak('2024-01-15');
    expect(result.currentStreak).toBe(1);
    expect(result.isNewRecord).toBe(false);
  });

  it('detects 7-day threshold', async () => {
    for (let i = 1; i <= 6; i++) {
      await updateDailyStreak(`2024-01-${String(i).padStart(2, '0')}`);
    }
    const result = await updateDailyStreak('2024-01-07');
    expect(result.currentStreak).toBe(7);
    expect(result.thresholdReached).toBe(7);
  });

  it('returns null threshold for non-threshold counts', async () => {
    for (let i = 1; i <= 5; i++) {
      await updateDailyStreak(`2024-01-${String(i).padStart(2, '0')}`);
    }
    const result = await updateDailyStreak('2024-01-06');
    expect(result.currentStreak).toBe(6);
    expect(result.thresholdReached).toBeNull();
  });

  it('persists streak data to IndexedDB', async () => {
    await updateDailyStreak('2024-01-15');
    await updateDailyStreak('2024-01-16');
    const streaks = await getStreaks();
    expect(streaks.dailyStreak).toBe(2);
    expect(streaks.dailyLastDate).toBe('2024-01-16');
  });
});

describe('gamificationService - updateWeeklyStreak', () => {
  it('starts streak at 1 on first measurement', async () => {
    const result = await updateWeeklyStreak('2024-01-15');
    expect(result.currentStreak).toBe(1);
    expect(result.isNewRecord).toBe(true);
    expect(result.thresholdReached).toBeNull();
  });

  it('increments streak on consecutive weeks', async () => {
    await updateWeeklyStreak('2024-01-15');
    const result = await updateWeeklyStreak('2024-01-22'); // +7 days
    expect(result.currentStreak).toBe(2);
    expect(result.isNewRecord).toBe(true);
  });

  it('resets streak to 1 on gap', async () => {
    await updateWeeklyStreak('2024-01-15');
    await updateWeeklyStreak('2024-01-22');
    const result = await updateWeeklyStreak('2024-02-05'); // 1-week gap
    expect(result.currentStreak).toBe(1);
    expect(result.isNewRecord).toBe(false);
  });

  it('is idempotent for same week', async () => {
    await updateWeeklyStreak('2024-01-15');
    const result = await updateWeeklyStreak('2024-01-15');
    expect(result.currentStreak).toBe(1);
    expect(result.isNewRecord).toBe(false);
  });

  it('detects 4-week threshold', async () => {
    await updateWeeklyStreak('2024-01-01');
    await updateWeeklyStreak('2024-01-08');
    await updateWeeklyStreak('2024-01-15');
    const result = await updateWeeklyStreak('2024-01-22');
    expect(result.currentStreak).toBe(4);
    expect(result.thresholdReached).toBe(4);
  });

  it('returns null threshold for non-threshold counts', async () => {
    await updateWeeklyStreak('2024-01-01');
    await updateWeeklyStreak('2024-01-08');
    const result = await updateWeeklyStreak('2024-01-15');
    expect(result.currentStreak).toBe(3);
    expect(result.thresholdReached).toBeNull();
  });

  it('persists streak data to IndexedDB', async () => {
    await updateWeeklyStreak('2024-01-15');
    await updateWeeklyStreak('2024-01-22');
    const streaks = await getStreaks();
    expect(streaks.weeklyStreak).toBe(2);
    expect(streaks.weeklyLastDate).toBe('2024-01-22');
  });
});

import { calculateConsistencyScore } from '../gamificationService';
import type { DailyMeasurement } from '../../types';

function makeDailyMeasurement(date: string): DailyMeasurement {
  return { date, weight: 80, source: 'manual', updatedAt: new Date().toISOString() };
}

describe('gamificationService - calculateConsistencyScore', () => {
  // Week starting Monday 2024-01-15 (Mon) through 2024-01-21 (Sun)
  const weekStart = '2024-01-15';

  it('returns score 0 when no measurements and no weekly', () => {
    const result = calculateConsistencyScore(weekStart, [], false);
    expect(result.score).toBe(0);
    expect(result.daysLogged).toBe(0);
    expect(result.weeklyCompleted).toBe(false);
    expect(result.weekStart).toBe(weekStart);
  });

  it('returns score 100 when all 7 days logged and weekly completed', () => {
    const measurements = [
      makeDailyMeasurement('2024-01-15'),
      makeDailyMeasurement('2024-01-16'),
      makeDailyMeasurement('2024-01-17'),
      makeDailyMeasurement('2024-01-18'),
      makeDailyMeasurement('2024-01-19'),
      makeDailyMeasurement('2024-01-20'),
      makeDailyMeasurement('2024-01-21'),
    ];
    const result = calculateConsistencyScore(weekStart, measurements, true);
    expect(result.score).toBe(100);
    expect(result.daysLogged).toBe(7);
    expect(result.weeklyCompleted).toBe(true);
  });

  it('returns score 30 when no daily but weekly completed', () => {
    const result = calculateConsistencyScore(weekStart, [], true);
    expect(result.score).toBe(30);
    expect(result.daysLogged).toBe(0);
  });

  it('returns score 70 when all 7 days logged but no weekly', () => {
    const measurements = Array.from({ length: 7 }, (_, i) =>
      makeDailyMeasurement(`2024-01-${String(15 + i).padStart(2, '0')}`)
    );
    const result = calculateConsistencyScore(weekStart, measurements, false);
    expect(result.score).toBe(70);
    expect(result.daysLogged).toBe(7);
  });

  it('counts only days within the given week', () => {
    const measurements = [
      makeDailyMeasurement('2024-01-14'), // Sunday before — outside week
      makeDailyMeasurement('2024-01-15'), // Monday — in week
      makeDailyMeasurement('2024-01-22'), // Monday next week — outside
    ];
    const result = calculateConsistencyScore(weekStart, measurements, false);
    expect(result.daysLogged).toBe(1);
    expect(result.score).toBe(Math.round((1 / 7) * 70));
  });

  it('calculates partial score correctly for 3 days + weekly', () => {
    const measurements = [
      makeDailyMeasurement('2024-01-15'),
      makeDailyMeasurement('2024-01-17'),
      makeDailyMeasurement('2024-01-19'),
    ];
    const result = calculateConsistencyScore(weekStart, measurements, true);
    expect(result.daysLogged).toBe(3);
    expect(result.score).toBe(Math.round((3 / 7) * 70 + 30));
  });

  it('score is always in range [0, 100]', () => {
    // With max inputs
    const maxMeasurements = Array.from({ length: 7 }, (_, i) =>
      makeDailyMeasurement(`2024-01-${String(15 + i).padStart(2, '0')}`)
    );
    const maxResult = calculateConsistencyScore(weekStart, maxMeasurements, true);
    expect(maxResult.score).toBeGreaterThanOrEqual(0);
    expect(maxResult.score).toBeLessThanOrEqual(100);

    // With min inputs
    const minResult = calculateConsistencyScore(weekStart, [], false);
    expect(minResult.score).toBeGreaterThanOrEqual(0);
    expect(minResult.score).toBeLessThanOrEqual(100);
  });
});

import { detectNonScaleVictories } from '../gamificationService';
import type { WeeklyMeasurement } from '../../types';

function makeDailyWithWeight(date: string, weight: number, bodyFat?: number): DailyMeasurement {
  return { date, weight, bodyFat, source: 'manual', updatedAt: new Date().toISOString() };
}

function makeWeekly(date: string, overrides: Partial<WeeklyMeasurement> = {}): WeeklyMeasurement {
  return { date, updatedAt: new Date().toISOString(), ...overrides };
}

/** Helper: get a YYYY-MM-DD string for N days ago from today */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

describe('gamificationService - detectNonScaleVictories', () => {
  it('returns empty array when no measurements', () => {
    const result = detectNonScaleVictories([], []);
    expect(result).toEqual([]);
  });

  it('returns empty array when insufficient daily data (only 1 weight entry)', () => {
    const daily = [makeDailyWithWeight(daysAgo(5), 80)];
    const weekly = [
      makeWeekly(daysAgo(10), { waist: 90 }),
      makeWeekly(daysAgo(3), { waist: 88 }),
    ];
    const result = detectNonScaleVictories(daily, weekly);
    expect(result).toEqual([]);
  });

  it('detects circumference NSV when weight is stable and waist decreased > 0.5 cm', () => {
    const daily = [
      makeDailyWithWeight(daysAgo(13), 80.0),
      makeDailyWithWeight(daysAgo(1), 80.1),
    ];
    const weekly = [
      makeWeekly(daysAgo(12), { waist: 90 }),
      makeWeekly(daysAgo(2), { waist: 89 }),
    ];
    const result = detectNonScaleVictories(daily, weekly);
    expect(result.length).toBe(1);
    expect(result[0].metric).toBe('waist');
    expect(result[0].message).toContain('Taille');
    expect(result[0].message).toContain('1 cm');
    expect(result[0].message).toContain('geschrumpft');
  });

  it('does NOT detect circumference NSV when weight changed >= 0.3 kg', () => {
    const daily = [
      makeDailyWithWeight(daysAgo(13), 80.0),
      makeDailyWithWeight(daysAgo(1), 80.5),
    ];
    const weekly = [
      makeWeekly(daysAgo(12), { waist: 90 }),
      makeWeekly(daysAgo(2), { waist: 89 }),
    ];
    const result = detectNonScaleVictories(daily, weekly);
    expect(result).toEqual([]);
  });

  it('does NOT detect circumference NSV when zone decreased <= 0.5 cm', () => {
    const daily = [
      makeDailyWithWeight(daysAgo(13), 80.0),
      makeDailyWithWeight(daysAgo(1), 80.1),
    ];
    const weekly = [
      makeWeekly(daysAgo(12), { waist: 90 }),
      makeWeekly(daysAgo(2), { waist: 89.5 }),
    ];
    const result = detectNonScaleVictories(daily, weekly);
    expect(result).toEqual([]);
  });

  it('detects multiple circumference zone NSVs', () => {
    const daily = [
      makeDailyWithWeight(daysAgo(13), 80.0),
      makeDailyWithWeight(daysAgo(1), 80.0),
    ];
    const weekly = [
      makeWeekly(daysAgo(12), { waist: 90, chest: 100, hip: 95 }),
      makeWeekly(daysAgo(2), { waist: 89, chest: 99, hip: 94 }),
    ];
    const result = detectNonScaleVictories(daily, weekly);
    expect(result.length).toBe(3);
    const metrics = result.map((v) => v.metric);
    expect(metrics).toContain('chest');
    expect(metrics).toContain('waist');
    expect(metrics).toContain('hip');
  });

  it('detects body fat NSV when body fat dropped > 0.5%', () => {
    const daily = [
      makeDailyWithWeight(daysAgo(13), 80.0, 25.0),
      makeDailyWithWeight(daysAgo(1), 80.0, 24.0),
    ];
    const result = detectNonScaleVictories(daily, []);
    expect(result.length).toBe(1);
    expect(result[0].metric).toBe('bodyFat');
    expect(result[0].message).toContain('Körperfettanteil');
    expect(result[0].message).toContain('1%');
    expect(result[0].message).toContain('gesunken');
  });

  it('does NOT detect body fat NSV when drop <= 0.5%', () => {
    const daily = [
      makeDailyWithWeight(daysAgo(13), 80.0, 25.0),
      makeDailyWithWeight(daysAgo(1), 80.0, 24.5),
    ];
    const result = detectNonScaleVictories(daily, []);
    expect(result).toEqual([]);
  });

  it('detects body fat NSV regardless of weight change', () => {
    const daily = [
      makeDailyWithWeight(daysAgo(13), 80.0, 25.0),
      makeDailyWithWeight(daysAgo(1), 85.0, 24.0),
    ];
    const result = detectNonScaleVictories(daily, []);
    expect(result.length).toBe(1);
    expect(result[0].metric).toBe('bodyFat');
  });

  it('ignores measurements older than 14 days', () => {
    const daily = [
      makeDailyWithWeight(daysAgo(20), 80.0, 25.0),
      makeDailyWithWeight(daysAgo(1), 80.0, 24.0),
    ];
    // Only 1 measurement within 14-day window → insufficient for body fat check
    const result = detectNonScaleVictories(daily, []);
    expect(result).toEqual([]);
  });

  it('can detect both circumference and body fat NSVs simultaneously', () => {
    const daily = [
      makeDailyWithWeight(daysAgo(13), 80.0, 25.0),
      makeDailyWithWeight(daysAgo(1), 80.1, 24.0),
    ];
    const weekly = [
      makeWeekly(daysAgo(12), { waist: 90 }),
      makeWeekly(daysAgo(2), { waist: 88 }),
    ];
    const result = detectNonScaleVictories(daily, weekly);
    expect(result.length).toBe(2);
    const metrics = result.map((v) => v.metric);
    expect(metrics).toContain('waist');
    expect(metrics).toContain('bodyFat');
  });

  it('sets detectedAt to today', () => {
    const today = new Date().toISOString().split('T')[0];
    const daily = [
      makeDailyWithWeight(daysAgo(13), 80.0, 25.0),
      makeDailyWithWeight(daysAgo(1), 80.0, 24.0),
    ];
    const result = detectNonScaleVictories(daily, []);
    expect(result[0].detectedAt).toBe(today);
  });
});
