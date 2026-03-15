/**
 * Weekly circumference comparison utility.
 * Classifies measurement differences and generates German feedback texts.
 *
 * Requirements: 6.1, 6.3, 6.4, 6.5
 */

/** Classification of a circumference difference */
export type DiffClassification = 'decrease' | 'stable' | 'increase';

/** Threshold in cm for classifying a difference as decrease or increase */
const THRESHOLD = 0.3;

/** Positive German phrases for decrease (Abnahme) */
const DECREASE_PHRASES = [
  'Starker Fortschritt!',
  'Weiter so!',
  'Tolle Entwicklung!',
];

/** Neutral German text for stable measurements */
const STABLE_TEXT = 'Stabil — gut gehalten.';

/** Neutral German text for increase (no negative language) */
const INCREASE_TEXT = 'Leicht gestiegen — kein Grund zur Sorge.';

/** Text when no previous measurement exists */
const FIRST_ENTRY_TEXT = 'Erster Eintrag';

/** Global encouraging message when all zones are stable or increased */
const GLOBAL_ENCOURAGEMENT = 'Dranbleiben — Veränderung braucht Zeit.';

/**
 * Classify the difference between current and previous circumference values.
 *
 * - diff < −0.3 cm → 'decrease'
 * - −0.3 ≤ diff ≤ +0.3 cm → 'stable'
 * - diff > +0.3 cm → 'increase'
 */
export function classifyDiff(current: number, previous: number): DiffClassification {
  const diff = current - previous;
  if (diff < -THRESHOLD) return 'decrease';
  if (diff > THRESHOLD) return 'increase';
  return 'stable';
}

/**
 * Get a German feedback text for a given classification.
 *
 * - decrease → positive phrase (rotated by optional index)
 * - stable → neutral text
 * - increase → neutral text (no negative language)
 */
export function getDiffFeedback(classification: DiffClassification, index = 0): string {
  switch (classification) {
    case 'decrease':
      return DECREASE_PHRASES[index % DECREASE_PHRASES.length];
    case 'stable':
      return STABLE_TEXT;
    case 'increase':
      return INCREASE_TEXT;
  }
}

/**
 * Get the text for when no previous measurement data exists.
 */
export function getFirstEntryText(): string {
  return FIRST_ENTRY_TEXT;
}

/**
 * Determine if a global encouraging message should be shown.
 *
 * Returns the encouraging message when ALL classifications are 'stable' or 'increase'.
 * Returns null if any zone decreased or if the array is empty.
 */
export function getGlobalFeedback(classifications: DiffClassification[]): string | null {
  if (classifications.length === 0) return null;
  const allStableOrIncreased = classifications.every(
    (c) => c === 'stable' || c === 'increase'
  );
  return allStableOrIncreased ? GLOBAL_ENCOURAGEMENT : null;
}
