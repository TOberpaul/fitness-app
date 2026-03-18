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
    return dbInstance;
  }

  dbInstance = await openDB<FitnessTrackerDB>('fitness-tracker', 4, {
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

      if (oldVersion < 3) {
        const foodStore = db.createObjectStore('foods', { keyPath: 'id' });
        foodStore.createIndex('by-source', 'source');
        foodStore.createIndex('by-name', 'name');

        const foodEntryStore = db.createObjectStore('foodEntries', { keyPath: 'id' });
        foodEntryStore.createIndex('by-date', 'date');
        foodEntryStore.createIndex('by-food-id', 'food_id');
        foodEntryStore.createIndex('by-meal-id', 'meal_id');

        const recipeStore = db.createObjectStore('recipes', { keyPath: 'id' });
        recipeStore.createIndex('by-name', 'name');
        recipeStore.createIndex('by-created', 'created_at');

        const recipeItemStore = db.createObjectStore('recipeItems', { keyPath: 'id' });
        recipeItemStore.createIndex('by-recipe-id', 'recipe_id');

        const favoriteStore = db.createObjectStore('favorites', { keyPath: 'food_id' });
        favoriteStore.createIndex('by-added', 'added_at');
      }

      if (oldVersion < 4) {
        const mealStore = db.createObjectStore('meals', { keyPath: 'id' });
        mealStore.createIndex('by-date', 'date');

        const savedMealStore = db.createObjectStore('savedMeals', { keyPath: 'id' });
        savedMealStore.createIndex('by-name', 'name');

        const savedMealItemStore = db.createObjectStore('savedMealItems', { keyPath: 'id' });
        savedMealItemStore.createIndex('by-saved-meal-id', 'saved_meal_id');

        // Add by-meal-id index to existing foodEntries store
        if (oldVersion >= 3) {
          const tx = (db as unknown as { transaction: { objectStore: (name: string) => IDBObjectStore } }).transaction;
          const feStore = tx.objectStore('foodEntries');
          if (!feStore.indexNames.contains('by-meal-id')) {
            feStore.createIndex('by-meal-id', 'meal_id');
          }
        }
      }
    },
  });

  return dbInstance;
}
