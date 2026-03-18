import type { NutritionExportData } from '../types';

/**
 * Serialisiert NutritionExportData als JSON-String.
 */
export function serializeNutrition(data: NutritionExportData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Deserialisiert einen JSON-String zu NutritionExportData.
 * Wirft beschreibende Fehlermeldungen bei ungültigen Daten.
 */
export function deserializeNutrition(json: string): NutritionExportData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    throw new Error(`Ungültige JSON-Daten: ${message}`);
  }

  if (!validateNutritionData(parsed)) {
    throw new Error(getNutritionValidationError(parsed));
  }

  return parsed;
}

/**
 * Type Guard: Prüft ob die Daten dem NutritionExportData-Format entsprechen.
 */
export function validateNutritionData(data: unknown): data is NutritionExportData {
  if (typeof data !== 'object' || data === null) return false;

  const obj = data as Record<string, unknown>;

  if (obj.version !== 1) return false;
  if (typeof obj.exportedAt !== 'string') return false;
  if (!Array.isArray(obj.foodEntries)) return false;
  if (!Array.isArray(obj.recipes)) return false;
  if (!Array.isArray(obj.recipeItems)) return false;

  for (const entry of obj.foodEntries) {
    if (!isValidFoodEntry(entry)) return false;
  }

  for (const recipe of obj.recipes) {
    if (!isValidRecipe(recipe)) return false;
  }

  for (const item of obj.recipeItems) {
    if (!isValidRecipeItem(item)) return false;
  }

  return true;
}

/**
 * Erzeugt eine beschreibende Fehlermeldung für ungültige Nutrition-Daten.
 */
function getNutritionValidationError(data: unknown): string {
  if (typeof data !== 'object' || data === null) {
    return 'Ungültige Nutrition-Daten: Daten müssen ein Objekt sein';
  }

  const obj = data as Record<string, unknown>;

  if (obj.version !== 1) {
    return 'Ungültige Nutrition-Daten: version muss 1 sein';
  }
  if (typeof obj.exportedAt !== 'string') {
    return 'Ungültige Nutrition-Daten: exportedAt muss ein String sein';
  }
  if (!Array.isArray(obj.foodEntries)) {
    return 'Ungültige Nutrition-Daten: foodEntries muss ein Array sein';
  }
  if (!Array.isArray(obj.recipes)) {
    return 'Ungültige Nutrition-Daten: recipes muss ein Array sein';
  }
  if (!Array.isArray(obj.recipeItems)) {
    return 'Ungültige Nutrition-Daten: recipeItems muss ein Array sein';
  }

  for (let i = 0; i < (obj.foodEntries as unknown[]).length; i++) {
    if (!isValidFoodEntry((obj.foodEntries as unknown[])[i])) {
      return `Ungültige Nutrition-Daten: foodEntries[${i}] ist ungültig`;
    }
  }

  for (let i = 0; i < (obj.recipes as unknown[]).length; i++) {
    if (!isValidRecipe((obj.recipes as unknown[])[i])) {
      return `Ungültige Nutrition-Daten: recipes[${i}] ist ungültig`;
    }
  }

  for (let i = 0; i < (obj.recipeItems as unknown[]).length; i++) {
    if (!isValidRecipeItem((obj.recipeItems as unknown[])[i])) {
      return `Ungültige Nutrition-Daten: recipeItems[${i}] ist ungültig`;
    }
  }

  return 'Ungültige Nutrition-Daten';
}

function isValidFoodEntry(entry: unknown): boolean {
  if (typeof entry !== 'object' || entry === null) return false;
  const e = entry as Record<string, unknown>;
  return (
    typeof e.id === 'string' &&
    typeof e.user_id === 'string' &&
    typeof e.date === 'string' &&
    typeof e.food_id === 'string' &&
    typeof e.name === 'string' &&
    typeof e.amount_grams === 'number' &&
    typeof e.kcal === 'number' &&
    typeof e.protein === 'number' &&
    typeof e.carbs === 'number' &&
    typeof e.fat === 'number' &&
    typeof e.created_at === 'string'
  );
}

function isValidRecipe(recipe: unknown): boolean {
  if (typeof recipe !== 'object' || recipe === null) return false;
  const r = recipe as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.user_id === 'string' &&
    typeof r.name === 'string' &&
    typeof r.total_kcal === 'number' &&
    typeof r.total_protein === 'number' &&
    typeof r.total_carbs === 'number' &&
    typeof r.total_fat === 'number' &&
    typeof r.created_at === 'string'
  );
}

function isValidRecipeItem(item: unknown): boolean {
  if (typeof item !== 'object' || item === null) return false;
  const i = item as Record<string, unknown>;
  return (
    typeof i.id === 'string' &&
    typeof i.recipe_id === 'string' &&
    typeof i.food_id === 'string' &&
    typeof i.name === 'string' &&
    typeof i.amount_grams === 'number' &&
    typeof i.kcal === 'number' &&
    typeof i.protein === 'number' &&
    typeof i.carbs === 'number' &&
    typeof i.fat === 'number'
  );
}
