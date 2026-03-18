import { openDB, deleteDB } from 'idb';
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
  Food,
  FoodEntry,
  Meal,
  SavedMeal,
  SavedMealItem,
  Recipe,
  RecipeItem,
  Favorite,
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
  foods: {
    key: string;
    value: Food;
    indexes: {
      'by-source': string;
      'by-name': string;
    };
  };
  foodEntries: {
    key: string;
    value: FoodEntry;
    indexes: {
      'by-date': string;
      'by-food-id': string;
      'by-meal-id': string;
    };
  };
  meals: {
    key: string;
    value: Meal;
    indexes: {
      'by-date': string;
    };
  };
  savedMeals: {
    key: string;
    value: SavedMeal;
    indexes: {
      'by-name': string;
    };
  };
  savedMealItems: {
    key: string;
    value: SavedMealItem;
    indexes: {
      'by-saved-meal-id': string;
    };
  };
  recipes: {
    key: string;
    value: Recipe;
    indexes: {
      'by-name': string;
      'by-created': string;
    };
  };
  recipeItems: {
    key: string;
    value: RecipeItem;
    indexes: {
      'by-recipe-id': string;
    };
  };
  favorites: {
    key: string;
    value: Favorite;
    indexes: {
      'by-added': string;
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

/** Required v4 stores — used to verify migration ran */
const REQUIRED_V4_STORES = ['meals', 'savedMeals', 'savedMealItems'] as const;

/** Check whether the DB instance has all v4 stores */
export function hasMealsSupport(db: IDBPDatabase<FitnessTrackerDB>): boolean {
  return REQUIRED_V4_STORES.every(s => db.objectStoreNames.contains(s));
}

function createUpgradeCallback() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (db: IDBPDatabase<FitnessTrackerDB>, oldVersion: number, _newVersion: number | null, transaction: any) => {
    const existing = db.objectStoreNames;
    if (oldVersion < 1) {
      if (!existing.contains('dailyMeasurements')) {
        const s = db.createObjectStore('dailyMeasurements', { keyPath: 'date' });
        s.createIndex('by-date', 'date');
      }
      if (!existing.contains('weeklyMeasurements')) {
        const s = db.createObjectStore('weeklyMeasurements', { keyPath: 'date' });
        s.createIndex('by-date', 'date');
      }
      if (!existing.contains('fitbitAuth')) db.createObjectStore('fitbitAuth');
    }
    if (oldVersion < 2) {
      if (!existing.contains('goals')) {
        const s = db.createObjectStore('goals', { keyPath: 'id' });
        s.createIndex('by-status', 'status');
        s.createIndex('by-createdAt', 'createdAt');
      }
      if (!existing.contains('streaks')) db.createObjectStore('streaks');
      if (!existing.contains('milestones')) {
        const s = db.createObjectStore('milestones', { keyPath: 'id' });
        s.createIndex('by-type', 'type');
        s.createIndex('by-earnedAt', 'earnedAt');
      }
    }
    if (oldVersion < 3) {
      if (!existing.contains('foods')) {
        const s = db.createObjectStore('foods', { keyPath: 'id' });
        s.createIndex('by-source', 'source');
        s.createIndex('by-name', 'name');
      }
      if (!existing.contains('foodEntries')) {
        const s = db.createObjectStore('foodEntries', { keyPath: 'id' });
        s.createIndex('by-date', 'date');
        s.createIndex('by-food-id', 'food_id');
        s.createIndex('by-meal-id', 'meal_id');
      }
      if (!existing.contains('recipes')) {
        const s = db.createObjectStore('recipes', { keyPath: 'id' });
        s.createIndex('by-name', 'name');
        s.createIndex('by-created', 'created_at');
      }
      if (!existing.contains('recipeItems')) {
        const s = db.createObjectStore('recipeItems', { keyPath: 'id' });
        s.createIndex('by-recipe-id', 'recipe_id');
      }
      if (!existing.contains('favorites')) {
        const s = db.createObjectStore('favorites', { keyPath: 'food_id' });
        s.createIndex('by-added', 'added_at');
      }
    }
    if (oldVersion < 4) {
      if (!existing.contains('meals')) {
        const s = db.createObjectStore('meals', { keyPath: 'id' });
        s.createIndex('by-date', 'date');
      }
      if (!existing.contains('savedMeals')) {
        const s = db.createObjectStore('savedMeals', { keyPath: 'id' });
        s.createIndex('by-name', 'name');
      }
      if (!existing.contains('savedMealItems')) {
        const s = db.createObjectStore('savedMealItems', { keyPath: 'id' });
        s.createIndex('by-saved-meal-id', 'saved_meal_id');
      }
      if (existing.contains('foodEntries')) {
        const feStore = transaction.objectStore('foodEntries');
        if (!feStore.indexNames.contains('by-meal-id')) {
          feStore.createIndex('by-meal-id', 'meal_id');
        }
      }
    }
  };
}

export async function getDB(): Promise<IDBPDatabase<FitnessTrackerDB>> {
  if (dbInstance) {
    if (dbInstance.version < 4 || !hasMealsSupport(dbInstance)) {
      dbInstance.close();
      dbInstance = null;
    } else {
      return dbInstance;
    }
  }

  try {
    dbInstance = await openDB<FitnessTrackerDB>('fitness-tracker', 4, {
      upgrade: createUpgradeCallback(),
      blocked() {
        // Old connection in another tab/SW is blocking the upgrade
        if (dbInstance) {
          dbInstance.close();
          dbInstance = null;
        }
      },
      blocking() {
        // This connection is blocking a newer version — close it
        if (dbInstance) {
          dbInstance.close();
          dbInstance = null;
        }
      },
    });
  } catch {
    // openDB itself failed (e.g. blocked indefinitely) — delete and retry
    try { await deleteDB('fitness-tracker'); } catch { /* ignore */ }
    dbInstance = await openDB<FitnessTrackerDB>('fitness-tracker', 4, {
      upgrade: createUpgradeCallback(),
    });
  }

  // If the upgrade was blocked, the DB may still lack v4 stores.
  // Delete the entire DB and recreate from scratch as a last resort.
  if (!hasMealsSupport(dbInstance)) {
    dbInstance.close();
    dbInstance = null;
    try { await deleteDB('fitness-tracker'); } catch { /* ignore */ }
    dbInstance = await openDB<FitnessTrackerDB>('fitness-tracker', 4, {
      upgrade: createUpgradeCallback(),
    });
  }

  return dbInstance;
}
