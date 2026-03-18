import { getDB, resetDB } from './db';
import { deleteDB } from 'idb';
import type { Food, FoodEntry, Meal, SavedMeal, SavedMealItem, Recipe, RecipeItem, DailySummary, MealWithEntries } from '../types';
import { calculateDailyTotals } from '../utils/calculationEngine';
import { supabase } from './supabase';

// ─── Food Entries ────────────────────────────────────────────────────

/** Save a food entry to IndexedDB */
export async function saveFoodEntry(entry: FoodEntry): Promise<void> {
  const db = await getDB();
  await db.put('foodEntries', entry);
}

/** Get all food entries for a specific date */
export async function getFoodEntriesByDate(date: string): Promise<FoodEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex('foodEntries', 'by-date', date);
}

/** Delete a food entry by id */
export async function deleteFoodEntry(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('foodEntries', id);
}

/**
 * Get the most recent foods (up to limit, default 20), sorted by created_at desc.
 * Returns unique foods (deduplicated by food_id, most recent wins).
 */
export async function getRecentFoods(limit = 20): Promise<Food[]> {
  const db = await getDB();
  const allEntries = await db.getAll('foodEntries');
  // Sort by created_at descending
  allEntries.sort((a, b) => b.created_at.localeCompare(a.created_at));
  // Deduplicate by food_id, keep most recent
  const seen = new Set<string>();
  const recentFoods: Food[] = [];
  for (const entry of allEntries) {
    if (seen.has(entry.food_id)) continue;
    seen.add(entry.food_id);
    // Try to get cached food
    const cached = await db.get('foods', entry.food_id);
    if (cached) {
      recentFoods.push(cached);
    }
    if (recentFoods.length >= limit) break;
  }
  return recentFoods;
}

// ─── Recipes ─────────────────────────────────────────────────────────

/** Save a recipe to IndexedDB */
export async function saveRecipe(recipe: Recipe): Promise<void> {
  const db = await getDB();
  await db.put('recipes', recipe);
}

/** Get all recipes */
export async function getAllRecipes(): Promise<Recipe[]> {
  const db = await getDB();
  return db.getAll('recipes');
}

/** Get a single recipe by id */
export async function getRecipe(id: string): Promise<Recipe | undefined> {
  const db = await getDB();
  return db.get('recipes', id);
}

/** Delete a recipe and all its items */
export async function deleteRecipe(id: string): Promise<void> {
  const db = await getDB();
  // Also delete all recipe items for this recipe
  const items = await db.getAllFromIndex('recipeItems', 'by-recipe-id', id);
  const tx = db.transaction('recipeItems', 'readwrite');
  for (const item of items) {
    await tx.store.delete(item.id);
  }
  await tx.done;
  await db.delete('recipes', id);
}

/** Save a recipe item to IndexedDB */
export async function saveRecipeItem(item: RecipeItem): Promise<void> {
  const db = await getDB();
  await db.put('recipeItems', item);
}

/** Get all recipe items for a recipe */
export async function getRecipeItems(recipeId: string): Promise<RecipeItem[]> {
  const db = await getDB();
  return db.getAllFromIndex('recipeItems', 'by-recipe-id', recipeId);
}

/** Delete a recipe item by id */
export async function deleteRecipeItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('recipeItems', id);
}

// ─── Favorites ───────────────────────────────────────────────────────

/** Add a food to favorites */
export async function addFavorite(food: Food): Promise<void> {
  const db = await getDB();
  await db.put('favorites', {
    food_id: food.id,
    food,
    added_at: new Date().toISOString(),
  });
  // Also cache the food
  await cacheFood(food);
}

/** Remove a food from favorites */
export async function removeFavorite(foodId: string): Promise<void> {
  const db = await getDB();
  await db.delete('favorites', foodId);
}

/** Get all favorite foods */
export async function getAllFavorites(): Promise<Food[]> {
  const db = await getDB();
  const favorites = await db.getAll('favorites');
  return favorites.map((f) => f.food);
}

/** Check if a food is a favorite */
export async function isFavorite(foodId: string): Promise<boolean> {
  const db = await getDB();
  const fav = await db.get('favorites', foodId);
  return fav !== undefined;
}

// ─── Food Cache ──────────────────────────────────────────────────────

/** Cache a food in IndexedDB for offline access */
export async function cacheFood(food: Food): Promise<void> {
  const db = await getDB();
  await db.put('foods', food);
}

/** Get a cached food by id */
export async function getCachedFood(id: string): Promise<Food | undefined> {
  const db = await getDB();
  return db.get('foods', id);
}

// ─── Custom Foods ────────────────────────────────────────────────────

/** Create a user-defined custom food and cache it */
export async function createCustomFood(data: {
  name: string;
  kcal_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  brand?: string;
  default_unit?: 'g' | 'ml';
  image_url?: string;
}): Promise<Food> {
  const food: Food = {
    id: `custom_${crypto.randomUUID()}`,
    source: 'custom',
    name: data.name,
    brand: data.brand || undefined,
    image_url: data.image_url || undefined,
    kcal_per_100g: data.kcal_per_100g,
    protein_per_100g: data.protein_per_100g,
    carbs_per_100g: data.carbs_per_100g,
    fat_per_100g: data.fat_per_100g,
    default_unit: data.default_unit || 'g',
  };
  await cacheFood(food);
  return food;
}

/** Get all custom foods from the foods store */
export async function getCustomFoods(): Promise<Food[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('foods', 'by-source', 'custom');
  return all;
}

/** Update an existing custom food */
export async function updateCustomFood(id: string, data: {
  name: string;
  kcal_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  brand?: string;
}): Promise<Food> {
  const db = await getDB();
  const existing = await db.get('foods', id);
  if (!existing || existing.source !== 'custom') throw new Error('Food not found or not custom');
  const updated: Food = {
    ...existing,
    name: data.name,
    kcal_per_100g: data.kcal_per_100g,
    protein_per_100g: data.protein_per_100g,
    carbs_per_100g: data.carbs_per_100g,
    fat_per_100g: data.fat_per_100g,
    brand: data.brand || undefined,
  };
  await db.put('foods', updated);
  return updated;
}

// ─── Meals (Gerichte) ────────────────────────────────────────────────

/** Create a new meal for a date */
export async function createMeal(date: string, name: string, image_url?: string): Promise<Meal> {
  const meal: Meal = {
    id: crypto.randomUUID(),
    date,
    name,
    image_url,
    created_at: new Date().toISOString(),
  };
  try {
    const db = await getDB();
    await db.put('meals', meal);
  } catch {
    // meals store missing — nuke DB and recreate
    resetDB();
    await deleteDB('fitness-tracker');
    const db2 = await getDB();
    await db2.put('meals', meal);
  }
  return meal;
}

/** Get all meals for a date */
export async function getMealsByDate(date: string): Promise<Meal[]> {
  try {
    const db = await getDB();
    const result = await db.getAllFromIndex('meals', 'by-date', date);
    return result;
  } catch {
    // meals store may not exist yet if migration hasn't completed
    return [];
  }
}

/** Get a single meal by id */
export async function getMeal(id: string): Promise<Meal | undefined> {
  const db = await getDB();
  return db.get('meals', id);
}

/** Update a meal (name, image) */
export async function updateMeal(id: string, data: { name?: string; image_url?: string | null }): Promise<void> {
  const db = await getDB();
  const meal = await db.get('meals', id);
  if (meal) {
    if (data.name !== undefined) meal.name = data.name;
    if (data.image_url !== undefined) meal.image_url = data.image_url || undefined;
    await db.put('meals', meal);
  }
}

/** Delete a meal and all its food entries */
export async function deleteMeal(id: string): Promise<void> {
  const db = await getDB();
  const entries = await db.getAllFromIndex('foodEntries', 'by-meal-id', id);
  const tx = db.transaction('foodEntries', 'readwrite');
  for (const entry of entries) {
    await tx.store.delete(entry.id);
  }
  await tx.done;
  await db.delete('meals', id);
}

/** Get food entries for a specific meal */
export async function getFoodEntriesByMeal(mealId: string): Promise<FoodEntry[]> {
  try {
    const db = await getDB();
    const result = await db.getAllFromIndex('foodEntries', 'by-meal-id', mealId);
    return result;
  } catch {
    return [];
  }
}

// ─── Saved Meals (Vorlagen) ──────────────────────────────────────────

/** Save a meal as a reusable template */
export async function saveMealAsTemplate(mealId: string, name: string): Promise<SavedMeal> {
  const db = await getDB();
  const entries = await db.getAllFromIndex('foodEntries', 'by-meal-id', mealId);

  const savedMeal: SavedMeal = {
    id: crypto.randomUUID(),
    name,
    total_kcal: entries.reduce((s, e) => s + e.kcal, 0),
    total_protein: entries.reduce((s, e) => s + e.protein, 0),
    total_carbs: entries.reduce((s, e) => s + e.carbs, 0),
    total_fat: entries.reduce((s, e) => s + e.fat, 0),
    created_at: new Date().toISOString(),
  };
  await db.put('savedMeals', savedMeal);

  const tx = db.transaction('savedMealItems', 'readwrite');
  for (const entry of entries) {
    const item: SavedMealItem = {
      id: crypto.randomUUID(),
      saved_meal_id: savedMeal.id,
      food_id: entry.food_id,
      name: entry.name,
      amount_grams: entry.amount_grams,
      kcal: entry.kcal,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
    };
    await tx.store.put(item);
  }
  await tx.done;

  return savedMeal;
}

/** Get all saved meal templates */
export async function getAllSavedMeals(): Promise<SavedMeal[]> {
  try {
    const db = await getDB();
    const result = await db.getAll('savedMeals');
    return result;
  } catch {
    return [];
  }
}

/** Delete a saved meal template and its items */
export async function deleteSavedMeal(id: string): Promise<void> {
  const db = await getDB();
  const items = await db.getAllFromIndex('savedMealItems', 'by-saved-meal-id', id);
  const tx = db.transaction('savedMealItems', 'readwrite');
  for (const item of items) {
    await tx.store.delete(item.id);
  }
  await tx.done;
  await db.delete('savedMeals', id);
}

/** Apply a saved meal template to a date — creates a new meal with copies of all items */
export async function applySavedMeal(savedMealId: string, date: string): Promise<Meal> {
  const db = await getDB();
  const savedMeal = await db.get('savedMeals', savedMealId);
  if (!savedMeal) throw new Error('Saved meal not found');

  const meal = await createMeal(date, savedMeal.name);
  const items = await db.getAllFromIndex('savedMealItems', 'by-saved-meal-id', savedMealId);

  for (const item of items) {
    const entry: FoodEntry = {
      id: crypto.randomUUID(),
      user_id: 'local',
      date,
      meal_id: meal.id,
      food_id: item.food_id,
      name: item.name,
      amount_grams: item.amount_grams,
      kcal: item.kcal,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      created_at: new Date().toISOString(),
    };
    await db.put('foodEntries', entry);
  }

  return meal;
}

// ─── Daily Summary ───────────────────────────────────────────────────

/** Get the daily summary for a given date, grouped by meals */
export async function getDailySummary(date: string): Promise<DailySummary> {
  const entries = await getFoodEntriesByDate(date);
  const totals = calculateDailyTotals(entries);
  const dbMeals = await getMealsByDate(date);

  // Group entries by meal_id
  const mealMap = new Map<string, FoodEntry[]>();
  for (const entry of entries) {
    const key = entry.meal_id || '__ungrouped__';
    if (!mealMap.has(key)) mealMap.set(key, []);
    mealMap.get(key)!.push(entry);
  }

  const meals: MealWithEntries[] = [];
  for (const meal of dbMeals) {
    const mealEntries = mealMap.get(meal.id) || [];
    meals.push({
      meal,
      entries: mealEntries,
      total_kcal: mealEntries.reduce((s, e) => s + e.kcal, 0),
      total_protein: mealEntries.reduce((s, e) => s + e.protein, 0),
      total_carbs: mealEntries.reduce((s, e) => s + e.carbs, 0),
      total_fat: mealEntries.reduce((s, e) => s + e.fat, 0),
    });
  }

  // Entries without a meal (legacy or orphaned)
  const ungrouped = mealMap.get('__ungrouped__') || [];
  if (ungrouped.length > 0) {
    meals.unshift({
      meal: { id: '__ungrouped__', date, name: 'Einzelne Lebensmittel', created_at: '' },
      entries: ungrouped,
      total_kcal: ungrouped.reduce((s, e) => s + e.kcal, 0),
      total_protein: ungrouped.reduce((s, e) => s + e.protein, 0),
      total_carbs: ungrouped.reduce((s, e) => s + e.carbs, 0),
      total_fat: ungrouped.reduce((s, e) => s + e.fat, 0),
    });
  }

  return {
    date,
    total_kcal: totals.kcal,
    total_protein: totals.protein,
    total_carbs: totals.carbs,
    total_fat: totals.fat,
    entries,
    meals,
  };
}

// ─── Image Upload ────────────────────────────────────────────────────

/** Upload a recipe image to Supabase Storage and return the public URL */
export async function uploadRecipeImage(recipeId: string, file: File): Promise<string> {
  const path = `recipe-images/${recipeId}/${file.name}`;
  const { data, error } = await supabase.storage
    .from('nutrition')
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: urlData } = supabase.storage
    .from('nutrition')
    .getPublicUrl(data.path);
  return urlData.publicUrl;
}
