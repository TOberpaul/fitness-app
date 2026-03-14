import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { resetDB } from './db';
import {
  saveDailyMeasurement,
  getDailyMeasurement,
  getDailyMeasurements,
  deleteDailyMeasurement,
  saveWeeklyMeasurement,
  getWeeklyMeasurement,
  getWeeklyMeasurements,
  deleteWeeklyMeasurement,
  getAllData,
  importData,
  clearAllData,
} from './dataService';
import type { DailyMeasurement, WeeklyMeasurement } from '../types';

function makeDaily(overrides: Partial<DailyMeasurement> = {}): DailyMeasurement {
  return {
    date: '2024-06-15',
    weight: 80.5,
    bodyFat: 18.2,
    source: 'manual',
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeWeekly(overrides: Partial<WeeklyMeasurement> = {}): WeeklyMeasurement {
  return {
    date: '2024-06-10',
    chest: 100.0,
    waist: 85.0,
    hip: 95.0,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  resetDB();
  // Delete the database between tests so each test starts fresh
  indexedDB.deleteDatabase('fitness-tracker');
});

describe('DataService - Daily Measurements', () => {
  it('saves and retrieves a daily measurement', async () => {
    const m = makeDaily();
    await saveDailyMeasurement(m);
    const result = await getDailyMeasurement('2024-06-15');
    expect(result).toEqual(m);
  });

  it('returns undefined for non-existent date', async () => {
    const result = await getDailyMeasurement('2099-01-01');
    expect(result).toBeUndefined();
  });

  it('overwrites existing measurement on same date', async () => {
    await saveDailyMeasurement(makeDaily({ weight: 80.0 }));
    await saveDailyMeasurement(makeDaily({ weight: 81.0 }));
    const result = await getDailyMeasurement('2024-06-15');
    expect(result?.weight).toBe(81.0);
  });

  it('rejects invalid daily measurement', async () => {
    await expect(
      saveDailyMeasurement(makeDaily({ weight: 5 }))
    ).rejects.toThrow('Invalid daily measurement');
  });

  it('queries daily measurements by date range', async () => {
    await saveDailyMeasurement(makeDaily({ date: '2024-06-10' }));
    await saveDailyMeasurement(makeDaily({ date: '2024-06-15' }));
    await saveDailyMeasurement(makeDaily({ date: '2024-06-20' }));

    const results = await getDailyMeasurements('2024-06-11', '2024-06-19');
    expect(results).toHaveLength(1);
    expect(results[0].date).toBe('2024-06-15');
  });

  it('deletes a daily measurement', async () => {
    await saveDailyMeasurement(makeDaily());
    await deleteDailyMeasurement('2024-06-15');
    const result = await getDailyMeasurement('2024-06-15');
    expect(result).toBeUndefined();
  });
});

describe('DataService - Weekly Measurements', () => {
  it('saves and retrieves a weekly measurement', async () => {
    const m = makeWeekly();
    await saveWeeklyMeasurement(m);
    const result = await getWeeklyMeasurement('2024-06-10');
    expect(result).toEqual(m);
  });

  it('returns undefined for non-existent week', async () => {
    const result = await getWeeklyMeasurement('2099-01-06');
    expect(result).toBeUndefined();
  });

  it('rejects invalid weekly measurement', async () => {
    await expect(
      saveWeeklyMeasurement(makeWeekly({ chest: 5 }))
    ).rejects.toThrow('Invalid weekly measurement');
  });

  it('queries weekly measurements by date range', async () => {
    await saveWeeklyMeasurement(makeWeekly({ date: '2024-06-03' }));
    await saveWeeklyMeasurement(makeWeekly({ date: '2024-06-10' }));
    await saveWeeklyMeasurement(makeWeekly({ date: '2024-06-17' }));

    const results = await getWeeklyMeasurements('2024-06-05', '2024-06-15');
    expect(results).toHaveLength(1);
    expect(results[0].date).toBe('2024-06-10');
  });

  it('deletes a weekly measurement', async () => {
    await saveWeeklyMeasurement(makeWeekly());
    await deleteWeeklyMeasurement('2024-06-10');
    const result = await getWeeklyMeasurement('2024-06-10');
    expect(result).toBeUndefined();
  });
});

describe('DataService - Export / Import / Clear', () => {
  it('getAllData returns all stored measurements', async () => {
    await saveDailyMeasurement(makeDaily({ date: '2024-06-15' }));
    await saveDailyMeasurement(makeDaily({ date: '2024-06-16' }));
    await saveWeeklyMeasurement(makeWeekly({ date: '2024-06-10' }));

    const data = await getAllData();
    expect(data.version).toBe(1);
    expect(data.exportedAt).toBeTruthy();
    expect(data.dailyMeasurements).toHaveLength(2);
    expect(data.weeklyMeasurements).toHaveLength(1);
  });

  it('importData saves all measurements and returns counts', async () => {
    const result = await importData({
      version: 1,
      exportedAt: new Date().toISOString(),
      dailyMeasurements: [
        makeDaily({ date: '2024-06-15' }),
        makeDaily({ date: '2024-06-16' }),
      ],
      weeklyMeasurements: [makeWeekly({ date: '2024-06-10' })],
    });

    expect(result).toEqual({ dailyCount: 2, weeklyCount: 1 });
    expect(await getDailyMeasurement('2024-06-15')).toBeDefined();
    expect(await getWeeklyMeasurement('2024-06-10')).toBeDefined();
  });

  it('clearAllData removes all measurements', async () => {
    await saveDailyMeasurement(makeDaily());
    await saveWeeklyMeasurement(makeWeekly());
    await clearAllData();

    const data = await getAllData();
    expect(data.dailyMeasurements).toHaveLength(0);
    expect(data.weeklyMeasurements).toHaveLength(0);
  });
});
