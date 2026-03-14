import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { DailyMeasurement, WeeklyMeasurement, FitbitTokens } from '../types';

export interface FitnessTrackerDB extends DBSchema {
  dailyMeasurements: {
    key: string;
    value: DailyMeasurement;
    indexes: {
      'by-date': string;
    };
  };
  weeklyMeasurements: {
    key: string;
    value: WeeklyMeasurement;
    indexes: {
      'by-date': string;
    };
  };
  fitbitAuth: {
    key: string;
    value: FitbitTokens;
  };
}

let dbInstance: IDBPDatabase<FitnessTrackerDB> | null = null;

/** Reset the cached DB instance (for testing only) */
export function resetDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export async function getDB(): Promise<IDBPDatabase<FitnessTrackerDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<FitnessTrackerDB>('fitness-tracker', 1, {
    upgrade(db) {
      const dailyStore = db.createObjectStore('dailyMeasurements', {
        keyPath: 'date',
      });
      dailyStore.createIndex('by-date', 'date');

      const weeklyStore = db.createObjectStore('weeklyMeasurements', {
        keyPath: 'date',
      });
      weeklyStore.createIndex('by-date', 'date');

      db.createObjectStore('fitbitAuth');
    },
  });

  return dbInstance;
}
