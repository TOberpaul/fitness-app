import type { DailyMeasurement, Goal, UserContext, UserContextState } from '../types';

// ─── Daily Reminder Phrase Pool (≥10 German phrases) ─────────────────

const DAILY_PHRASES: readonly string[] = [
  'Kurz auf die Waage — du weißt, es lohnt sich.',
  'Ein kleiner Schritt heute: Gewicht eintragen.',
  'Dein Körper erzählt eine Geschichte — hör kurz rein.',
  'Nur eine Zahl, aber sie zählt. Trag sie ein.',
  'Guten Abend! Hast du heute schon gewogen?',
  'Dranbleiben ist der Schlüssel. Schnell eintragen?',
  'Dein zukünftiges Ich wird dir danken. Waage?',
  'Routine macht den Unterschied. Kurz wiegen?',
  'Kleine Gewohnheit, große Wirkung. Gewicht?',
  'Hey! Dein täglicher Check-in wartet.',
];

// ─── Weekly Reminder Phrase Pool (≥10 German phrases) ────────────────

const WEEKLY_PHRASES: readonly string[] = [
  'Zeit für deine Umfänge — das geht schnell!',
  'Einmal messen, eine Woche lang gut fühlen.',
  'Deine Maße erzählen mehr als die Waage.',
  'Sonntag ist Messtag! Maßband bereit?',
  'Kurzer Umfang-Check — du schaffst das in 2 Minuten.',
  'Die Woche abrunden: Umfänge eintragen.',
  'Dein Körper verändert sich — halt es fest!',
  'Maßband-Moment: Wie sieht\'s diese Woche aus?',
  'Umfänge messen = Fortschritt sichtbar machen.',
  'Letzte Aufgabe der Woche: Messen!',
];

// ─── Context Overlays per UserContextState ───────────────────────────

const CONTEXT_OVERLAYS: Record<UserContextState, string> = {
  progressing: 'Du machst echte Fortschritte! Weiter so.',
  consistent: '7 Tage am Stück — starke Routine!',
  stagnating: 'Plateau? Kein Stress — dein Körper passt sich an.',
  inactive: 'Schon eine Weile her — ein kurzer Check-in reicht.',
};

// ─── localStorage Keys ──────────────────────────────────────────────

const DAILY_INDEX_KEY = 'notificationEngine_dailyIndex';
const WEEKLY_INDEX_KEY = 'notificationEngine_weeklyIndex';

// ─── Internal Helpers ───────────────────────────────────────────────

/**
 * Get the next phrase index from a pool, rotating via localStorage.
 * Never repeats the immediately previous phrase.
 */
function getNextIndex(storageKey: string, poolLength: number): number {
  const stored = localStorage.getItem(storageKey);
  const lastIndex = stored !== null ? parseInt(stored, 10) : -1;

  let nextIndex = (lastIndex + 1) % poolLength;

  // Safety: if pool has only 1 item, we can't avoid repetition
  if (nextIndex === lastIndex && poolLength > 1) {
    nextIndex = (nextIndex + 1) % poolLength;
  }

  localStorage.setItem(storageKey, String(nextIndex));
  return nextIndex;
}

/**
 * Select a phrase from a pool with rotation and context overlay.
 */
function selectPhrase(
  pool: readonly string[],
  storageKey: string,
  context: UserContext
): string {
  const index = getNextIndex(storageKey, pool.length);
  const basePhrase = pool[index];
  const overlay = CONTEXT_OVERLAYS[context.state];

  return `${overlay} ${basePhrase}`;
}

// ─── Exported Functions ─────────────────────────────────────────────

/**
 * Get a daily reminder message from the phrase pool.
 * Rotates through phrases via localStorage, prepends context overlay.
 *
 * @param context - Current user context (state, streak, etc.)
 * @returns A German motivational reminder string
 */
export function getDailyReminderMessage(context: UserContext): string {
  return selectPhrase(DAILY_PHRASES, DAILY_INDEX_KEY, context);
}

/**
 * Get a weekly reminder message from the phrase pool.
 * Rotates through phrases via localStorage, prepends context overlay.
 *
 * @param context - Current user context (state, streak, etc.)
 * @returns A German motivational reminder string
 */
export function getWeeklyReminderMessage(context: UserContext): string {
  return selectPhrase(WEEKLY_PHRASES, WEEKLY_INDEX_KEY, context);
}

/**
 * Categorize the user's current context based on measurement history and goals.
 *
 * Priority order (checked first wins):
 * 1. inactive — no measurement for 3+ days
 * 2. consistent — logged every day for past 7 days
 * 3. progressing — most recent measurement shows progress toward a goal
 * 4. stagnating — weight change over 14 days < 0.2 kg
 *
 * @param dailyMeasurements - Array of daily measurements, any order
 * @param goals - Array of user goals
 * @returns The determined UserContextState
 */
export function categorizeUserContext(
  dailyMeasurements: DailyMeasurement[],
  goals: Goal[]
): UserContextState {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Sort measurements by date descending for easier analysis
  const sorted = [...dailyMeasurements].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // 1. Check inactive: no measurement for 3+ days
  if (sorted.length === 0) {
    return 'inactive';
  }

  const mostRecentDate = new Date(sorted[0].date);
  mostRecentDate.setHours(0, 0, 0, 0);
  const daysSinceLastMeasurement = Math.floor(
    (today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastMeasurement >= 3) {
    return 'inactive';
  }

  // 2. Check consistent: logged every day for past 7 days
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // inclusive of today = 7 days

  const dateSet = new Set(sorted.map((m) => m.date));
  let allSevenDays = true;
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(sevenDaysAgo);
    checkDate.setDate(checkDate.getDate() + i);
    const dateStr = formatDateStr(checkDate);
    if (!dateSet.has(dateStr)) {
      allSevenDays = false;
      break;
    }
  }

  if (allSevenDays) {
    return 'consistent';
  }

  // 3. Check progressing: most recent measurement shows progress toward a goal
  const activeGoals = goals.filter((g) => g.status === 'active');
  if (activeGoals.length > 0 && sorted.length >= 2) {
    const latest = sorted[0];
    const previous = sorted[1];

    for (const goal of activeGoals) {
      if (goal.metricType === 'weight' && latest.weight != null && previous.weight != null) {
        const direction = goal.targetValue < goal.startValue ? -1 : 1;
        const change = (latest.weight - previous.weight) * direction;
        if (change > 0) {
          return 'progressing';
        }
      }
      if (goal.metricType === 'bodyFat' && latest.bodyFat != null && previous.bodyFat != null) {
        const direction = goal.targetValue < goal.startValue ? -1 : 1;
        const change = (latest.bodyFat - previous.bodyFat) * direction;
        if (change > 0) {
          return 'progressing';
        }
      }
    }
  }

  // 4. Check stagnating: weight change over 14 days < 0.2 kg
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const recentWithWeight = sorted.filter((m) => m.weight != null);
  if (recentWithWeight.length >= 2) {
    const latestWeight = recentWithWeight[0].weight!;
    const oldMeasurements = recentWithWeight.filter(
      (m) => new Date(m.date).getTime() <= fourteenDaysAgo.getTime()
    );

    if (oldMeasurements.length > 0) {
      const oldWeight = oldMeasurements[0].weight!;
      if (Math.abs(latestWeight - oldWeight) < 0.2) {
        return 'stagnating';
      }
    }
  }

  // Default fallback: stagnating (least specific state)
  return 'stagnating';
}

// ─── Utility ────────────────────────────────────────────────────────

/** Format a Date to YYYY-MM-DD string */
function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ─── Exported Constants (for testing) ───────────────────────────────

export { DAILY_PHRASES, WEEKLY_PHRASES, CONTEXT_OVERLAYS };
