import type { Food } from '../types';

/**
 * Queries Open Food Facts API with DACH focus (cc=de, lc=de).
 * Maps response products to normalized Food objects.
 * Returns empty array on error — never throws.
 */
export async function searchOpenFoodFacts(query: string): Promise<Food[]> {
  try {
    const params = new URLSearchParams({
      search_terms: query,
      page_size: '20',
      countries_tags_en: 'germany',
      fields: 'code,product_name,brands,nutriments',
    });

    const response = await fetch(
      `https://world.openfoodfacts.net/api/v2/search?${params}`
    );
    const data = await response.json();

    if (!data.products || !Array.isArray(data.products)) {
      return [];
    }

    return data.products
      .filter((p: Record<string, unknown>) => p.product_name)
      .map((product: Record<string, unknown>): Food => {
        const nutriments = (product.nutriments ?? {}) as Record<string, number>;
        return {
          id: `off_${product.code}`,
          source: 'openfoodfacts',
          name: product.product_name as string,
          brand: (product.brands as string) || undefined,
          kcal_per_100g: nutriments['energy-kcal_100g'] ?? 0,
          protein_per_100g: nutriments['proteins_100g'] ?? 0,
          carbs_per_100g: nutriments['carbohydrates_100g'] ?? 0,
          fat_per_100g: nutriments['fat_100g'] ?? 0,
          default_unit: 'g',
        };
      });
  } catch {
    return [];
  }
}

/**
 * BLS (Bundeslebensmittelschlüssel) API placeholder.
 * BLS has no public free API — this is a placeholder for future integration
 * when a licensed BLS data source becomes available.
 * Returns empty array for now.
 */
export async function searchBLS(_query: string): Promise<Food[]> {
  // TODO: Integrate BLS when a licensed API or local dataset is available.
  // BLS (Bundeslebensmittelschlüssel) is a German food composition database
  // that requires a commercial license for API access.
  return [];
}

/**
 * Queries USDA FoodData Central as a fallback source.
 * Uses DEMO_KEY for development — replace with a real key in production.
 * Returns empty array on error — never throws.
 */
export async function searchUSDA(query: string): Promise<Food[]> {
  try {
    const params = new URLSearchParams({
      query,
      pageSize: '10',
      dataType: 'Foundation,SR Legacy',
      api_key: 'DEMO_KEY',
    });

    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?${params}`
    );
    const data = await response.json();

    if (!data.foods || !Array.isArray(data.foods)) {
      return [];
    }

    return data.foods.map((food: Record<string, unknown>): Food => {
      const nutrients = (food.foodNutrients ?? []) as Array<{
        nutrientId: number;
        value?: number;
      }>;

      const getNutrient = (nutrientId: number): number => {
        const found = nutrients.find((n) => n.nutrientId === nutrientId);
        return found?.value ?? 0;
      };

      return {
        id: `usda_${food.fdcId}`,
        source: 'usda',
        name: (food.description as string) || 'Unknown',
        kcal_per_100g: getNutrient(1008),
        protein_per_100g: getNutrient(1003),
        carbs_per_100g: getNutrient(1005),
        fat_per_100g: getNutrient(1004),
        default_unit: 'g',
      };
    });
  } catch {
    return [];
  }
}

/**
 * Merges and ranks results from all sources.
 * Priority: BLS first, then Open Food Facts, then USDA.
 * Deduplicates by name (case-insensitive, first occurrence wins).
 */
export function mergeAndRank(
  offResults: Food[],
  blsResults: Food[],
  usdaResults: Food[]
): Food[] {
  const combined = [...blsResults, ...offResults, ...usdaResults];
  const seen = new Set<string>();
  const deduped: Food[] = [];

  for (const food of combined) {
    const key = food.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(food);
    }
  }

  return deduped;
}

/**
 * Main search function.
 * Queries Open Food Facts and BLS in parallel.
 * If both return empty, queries USDA as fallback.
 * Returns merged and ranked results.
 */
export async function searchFoods(query: string): Promise<Food[]> {
  const [offResults, blsResults] = await Promise.all([
    searchOpenFoodFacts(query),
    searchBLS(query),
  ]);

  let usdaResults: Food[] = [];
  if (offResults.length === 0 && blsResults.length === 0) {
    usdaResults = await searchUSDA(query);
  }

  return mergeAndRank(offResults, blsResults, usdaResults);
}
