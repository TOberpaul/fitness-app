import { getDB } from './db';
import type { Food, FoodEntry, Recipe, RecipeItem, DailySummary } from '../types';
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

// ─── Daily Summary ───────────────────────────────────────────────────

/** Get the daily summary for a given date */
export async function getDailySummary(date: string): Promise<DailySummary> {
  const entries = await getFoodEntriesByDate(date);
  const totals = calculateDailyTotals(entries);
  return {
    date,
    total_kcal: totals.kcal,
    total_protein: totals.protein,
    total_carbs: totals.carbs,
    total_fat: totals.fat,
    entries,
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
