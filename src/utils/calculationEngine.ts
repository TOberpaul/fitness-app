import type { Food, FoodEntry, RecipeItem } from '../types';

export interface NutritionValues {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Round to one decimal place */
export function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Calculate nutrition values for a given food and amount in grams */
export function calculateNutrition(food: Food, amountGrams: number): NutritionValues {
  const factor = amountGrams / 100;
  return {
    kcal: roundToOneDecimal(food.kcal_per_100g * factor),
    protein: roundToOneDecimal(food.protein_per_100g * factor),
    carbs: roundToOneDecimal(food.carbs_per_100g * factor),
    fat: roundToOneDecimal(food.fat_per_100g * factor),
  };
}

/** Convert portion size and count to grams */
export function portionToGrams(portionSize: number, portionCount: number): number {
  return roundToOneDecimal(portionSize * portionCount);
}

/** Calculate total nutrition for all recipe items */
export function calculateRecipeTotals(items: RecipeItem[]): NutritionValues {
  const totals = items.reduce(
    (acc, item) => ({
      kcal: acc.kcal + item.kcal,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
  return {
    kcal: roundToOneDecimal(totals.kcal),
    protein: roundToOneDecimal(totals.protein),
    carbs: roundToOneDecimal(totals.carbs),
    fat: roundToOneDecimal(totals.fat),
  };
}

/** Calculate daily totals from food entries */
export function calculateDailyTotals(entries: FoodEntry[]): NutritionValues {
  const totals = entries.reduce(
    (acc, entry) => ({
      kcal: acc.kcal + entry.kcal,
      protein: acc.protein + entry.protein,
      carbs: acc.carbs + entry.carbs,
      fat: acc.fat + entry.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
  return {
    kcal: roundToOneDecimal(totals.kcal),
    protein: roundToOneDecimal(totals.protein),
    carbs: roundToOneDecimal(totals.carbs),
    fat: roundToOneDecimal(totals.fat),
  };
}
