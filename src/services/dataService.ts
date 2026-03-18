import { getDB } from './db';
import type {
  DailyMeasurement,
  WeeklyMeasurement,
  ExportData,
  ImportResult,
} from '../types';
import {
  validateDailyMeasurement,
  validateWeeklyMeasurement,
} from '../utils/validation';

// --- Daily Measurements ---

export async function saveDailyMeasurement(
  measurement: DailyMeasurement
): Promise<void> {
  const result = validateDailyMeasurement(measurement);
  if (!result.valid) {
    throw new Error(`Invalid daily measurement: ${result.errors.join(', ')}`);
  }
  const db = await getDB();
  await db.put('dailyMeasurements', measurement);
}

export async function getDailyMeasurement(
  date: string
): Promise<DailyMeasurement | undefined> {
  const db = await getDB();
  return db.get('dailyMeasurements', date);
}

export async function getDailyMeasurements(
  from: string,
  to: string
): Promise<DailyMeasurement[]> {
  const db = await getDB();
  const range = IDBKeyRange.bound(from, to);
  return db.getAll('dailyMeasurements', range);
}

export async function deleteDailyMeasurement(date: string): Promise<void> {
  const db = await getDB();
  await db.delete('dailyMeasurements', date);
}

// --- Weekly Measurements ---

export async function saveWeeklyMeasurement(
  measurement: WeeklyMeasurement
): Promise<void> {
  const result = validateWeeklyMeasurement(measurement);
  if (!result.valid) {
    throw new Error(
      `Invalid weekly measurement: ${result.errors.join(', ')}`
    );
  }
  const db = await getDB();
  await db.put('weeklyMeasurements', measurement);
}

export async function getWeeklyMeasurement(
  weekStart: string
): Promise<WeeklyMeasurement | undefined> {
  const db = await getDB();
  return db.get('weeklyMeasurements', weekStart);
}

export async function getWeeklyMeasurements(
  from: string,
  to: string
): Promise<WeeklyMeasurement[]> {
  const db = await getDB();
  const range = IDBKeyRange.bound(from, to);
  return db.getAll('weeklyMeasurements', range);
}

export async function deleteWeeklyMeasurement(
  weekStart: string
): Promise<void> {
  const db = await getDB();
  await db.delete('weeklyMeasurements', weekStart);
}

// --- Export / Import / Clear ---

export async function getAllData(): Promise<ExportData> {
  const db = await getDB();
  const dailyMeasurements = await db.getAll('dailyMeasurements');
  const weeklyMeasurements = await db.getAll('weeklyMeasurements');
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    dailyMeasurements,
    weeklyMeasurements,
  };
}

export async function importData(data: ExportData): Promise<ImportResult> {
  // Clear all existing data (including milestones/streaks) before import
  await clearAllData();

  let dailyCount = 0;
  let weeklyCount = 0;

  for (const measurement of data.dailyMeasurements) {
    await saveDailyMeasurement(measurement);
    dailyCount++;
  }

  for (const measurement of data.weeklyMeasurements) {
    await saveWeeklyMeasurement(measurement);
    weeklyCount++;
  }

  return { dailyCount, weeklyCount };
}

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await db.clear('dailyMeasurements');
  await db.clear('weeklyMeasurements');
  await db.clear('milestones');
  await db.clear('streaks');
}
