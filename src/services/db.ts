import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type {
  DailyMeasurement,
  WeeklyMeasurement,
  FitbitTokens,
  Goal,
  GoalStatus,
  Streaks,
  Milestone,
  MilestoneType,
} from '../types';

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
  goals: {
    key: string;
    value: Goal;
    indexes: {
      'by-status': GoalStatus;
      'by-createdAt': string;
    };
  };
  streaks: {
    key: string;
    value: Streaks;
  };
  milestones: {
    key: string;
    value: Milestone;
    indexes: {
      'by-type': MilestoneType;
      'by-earnedAt': string;
    };
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

  dbInstance = await openDB<FitnessTrackerDB>('fitness-tracker', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const dailyStore = db.createObjectStore('dailyMeasurements', {
          keyPath: 'date',
        });
        dailyStore.createIndex('by-date', 'date');

        const weeklyStore = db.createObjectStore('weeklyMeasurements', {
          keyPath: 'date',
        });
        weeklyStore.createIndex('by-date', 'date');

        db.createObjectStore('fitbitAuth');
      }

      if (oldVersion < 2) {
        const goalStore = db.createObjectStore('goals', { keyPath: 'id' });
        goalStore.createIndex('by-status', 'status');
        goalStore.createIndex('by-createdAt', 'createdAt');

        db.createObjectStore('streaks');

        const milestoneStore = db.createObjectStore('milestones', { keyPath: 'id' });
        milestoneStore.createIndex('by-type', 'type');
        milestoneStore.createIndex('by-earnedAt', 'earnedAt');
      }
    },
  });

  return dbInstance;
}
