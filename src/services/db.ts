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

export async function getDB(): Promise<IDBPDatabase<FitnessTrackerDB>> {
  if (dbInstance) {
    // Ensure cached instance has the correct version
    if (dbInstance.version < 4) {
      dbInstance.close();
      dbInstance = null;
    } else {
      return dbInstance;
    }
  }

  dbInstance = await openDB<FitnessTrackerDB>('fitness-tracker', 4, {
    upgrade(db, oldVersion, _newVersion, transaction) {
      // Safety: check which stores already exist to avoid re-creating
      const existing = db.objectStoreNames;
      if (oldVersion < 1) {
        if (!existing.contains('dailyMeasurements')) {
          const dailyStore = db.createObjectStore('dailyMeasurements', { keyPath: 'date' });
          dailyStore.createIndex('by-date', 'date');
        }
        if (!existing.contains('weeklyMeasurements')) {
          const weeklyStore = db.createObjectStore('weeklyMeasurements', { keyPath: 'date' });
          weeklyStore.createIndex('by-date', 'date');
        }
        if (!existing.contains('fitbitAuth')) {
          db.createObjectStore('fitbitAuth');
        }
      }

      if (oldVersion < 2) {
        if (!existing.contains('goals')) {
          const goalStore = db.createObjectStore('goals', { keyPath: 'id' });
          goalStore.createIndex('by-status', 'status');
          goalStore.createIndex('by-createdAt', 'createdAt');
        }
        if (!existing.contains('streaks')) {
          db.createObjectStore('streaks');
        }
        if (!existing.contains('milestones')) {
          const milestoneStore = db.createObjectStore('milestones', { keyPath: 'id' });
          milestoneStore.createIndex('by-type', 'type');
          milestoneStore.createIndex('by-earnedAt', 'earnedAt');
        }
      }

      if (oldVersion < 3) {
        if (!existing.contains('foods')) {
          const foodStore = db.createObjectStore('foods', { keyPath: 'id' });
          foodStore.createIndex('by-source', 'source');
          foodStore.createIndex('by-name', 'name');
        }
        if (!existing.contains('foodEntries')) {
          const foodEntryStore = db.createObjectStore('foodEntries', { keyPath: 'id' });
          foodEntryStore.createIndex('by-date', 'date');
          foodEntryStore.createIndex('by-food-id', 'food_id');
          foodEntryStore.createIndex('by-meal-id', 'meal_id');
        }
        if (!existing.contains('recipes')) {
          const recipeStore = db.createObjectStore('recipes', { keyPath: 'id' });
          recipeStore.createIndex('by-name', 'name');
          recipeStore.createIndex('by-created', 'created_at');
        }
        if (!existing.contains('recipeItems')) {
          const recipeItemStore = db.createObjectStore('recipeItems', { keyPath: 'id' });
          recipeItemStore.createIndex('by-recipe-id', 'recipe_id');
        }
        if (!existing.contains('favorites')) {
          const favoriteStore = db.createObjectStore('favorites', { keyPath: 'food_id' });
          favoriteStore.createIndex('by-added', 'added_at');
        }
      }

      if (oldVersion < 4) {
        if (!existing.contains('meals')) {
          const mealStore = db.createObjectStore('meals', { keyPath: 'id' });
          mealStore.createIndex('by-date', 'date');
        }
        if (!existing.contains('savedMeals')) {
          const savedMealStore = db.createObjectStore('savedMeals', { keyPath: 'id' });
          savedMealStore.createIndex('by-name', 'name');
        }
        if (!existing.contains('savedMealItems')) {
          const savedMealItemStore = db.createObjectStore('savedMealItems', { keyPath: 'id' });
          savedMealItemStore.createIndex('by-saved-meal-id', 'saved_meal_id');
        }
        // Add by-meal-id index to existing foodEntries store
        if (existing.contains('foodEntries')) {
          const feStore = transaction.objectStore('foodEntries');
          if (!feStore.indexNames.contains('by-meal-id')) {
            feStore.createIndex('by-meal-id', 'meal_id');
          }
        }
      }
    },
    blocked(_currentVersion, _blockedVersion, _event) {
      // Another tab/SW holds an old connection — close our cached one and let the user know
      if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
      }
    },
  });

  // Verify the migration actually ran — if meals store is missing, the upgrade was blocked
  if (!dbInstance.objectStoreNames.contains('meals')) {
    dbInstance.close();
    dbInstance = null;
    // Retry once — the blocking connection should have been closed by now
    dbInstance = await openDB<FitnessTrackerDB>('fitness-tracker', 4, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        const existing = db.objectStoreNames;
        if (!existing.contains('meals')) {
          const mealStore = db.createObjectStore('meals', { keyPath: 'id' });
          mealStore.createIndex('by-date', 'date');
        }
        if (!existing.contains('savedMeals')) {
          const savedMealStore = db.createObjectStore('savedMeals', { keyPath: 'id' });
          savedMealStore.createIndex('by-name', 'name');
        }
        if (!existing.contains('savedMealItems')) {
          const savedMealItemStore = db.createObjectStore('savedMealItems', { keyPath: 'id' });
          savedMealItemStore.createIndex('by-saved-meal-id', 'saved_meal_id');
        }
        if (existing.contains('foodEntries')) {
          const feStore = transaction.objectStore('foodEntries');
          if (!feStore.indexNames.contains('by-meal-id')) {
            feStore.createIndex('by-meal-id', 'meal_id');
          }
        }
      },
    });
  }

  return dbInstance;
}
