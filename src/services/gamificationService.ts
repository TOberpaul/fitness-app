import { getDB } from './db';
import type { Streaks, StreakInfo, Milestone, MilestoneType, MilestoneContext, DailyMeasurement, WeeklyMeasurement, ConsistencyScore, NonScaleVictory, CircumferenceZone } from '../types';

/** Singleton key for the streaks store */
const STREAKS_KEY = 'current';

/** Daily streak notable thresholds */
const DAILY_THRESHOLDS = [7, 30];

/** Weekly streak notable thresholds */
const WEEKLY_THRESHOLDS = [4, 12];

/**
 * Default streaks object for when no streak data exists yet.
 */
function defaultStreaks(): Streaks {
  return {
    dailyStreak: 0,
    dailyLastDate: null,
    weeklyStreak: 0,
    weeklyLastDate: null,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Read current streak data from IndexedDB.
 * Returns default zeroed streaks if no data exists.
 */
export async function getStreaks(): Promise<Streaks> {
  const db = await getDB();
  const streaks = await db.get('streaks', STREAKS_KEY);
  return streaks ?? defaultStreaks();
}

/**
 * Compute the difference in calendar days between two YYYY-MM-DD date strings.
 * Returns (dateB - dateA) in days.
 */
function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + 'T00:00:00Z');
  const b = new Date(dateB + 'T00:00:00Z');
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Compute the difference in calendar weeks between two YYYY-MM-DD week-start date strings.
 * Returns (weekB - weekA) in weeks.
 */
function weeksBetween(weekA: string, weekB: string): number {
  const days = daysBetween(weekA, weekB);
  return Math.round(days / 7);
}

/**
 * Update the daily weight logging streak.
 *
 * Logic:
 * - If no previous streak data or no last date: start streak at 1
 * - If the given date is the same as the last date: no change (idempotent)
 * - If the given date is exactly 1 day after the last date: increment streak
 * - If there's a gap (more than 1 day): reset streak to 1
 *
 * Persists updated streaks to IndexedDB and returns StreakInfo.
 *
 * Requirements: 11.1, 11.3, 11.4, 11.5
 */
export async function updateDailyStreak(date: string): Promise<StreakInfo> {
  const db = await getDB();
  const streaks = (await db.get('streaks', STREAKS_KEY)) ?? defaultStreaks();
  const previousStreak = streaks.dailyStreak;

  if (streaks.dailyLastDate === null) {
    // First ever daily measurement
    streaks.dailyStreak = 1;
  } else if (streaks.dailyLastDate === date) {
    // Same day — idempotent, no change
    return {
      currentStreak: streaks.dailyStreak,
      isNewRecord: false,
      thresholdReached: null,
    };
  } else {
    const gap = daysBetween(streaks.dailyLastDate, date);
    if (gap === 1) {
      // Consecutive day — extend streak
      streaks.dailyStreak += 1;
    } else if (gap > 1) {
      // Gap detected — reset to 1 (today counts)
      streaks.dailyStreak = 1;
    } else {
      // date is before or equal to lastDate (shouldn't normally happen)
      // Treat as idempotent
      return {
        currentStreak: streaks.dailyStreak,
        isNewRecord: false,
        thresholdReached: null,
      };
    }
  }

  streaks.dailyLastDate = date;
  streaks.updatedAt = new Date().toISOString();

  await db.put('streaks', streaks, STREAKS_KEY);

  const isNewRecord = streaks.dailyStreak > previousStreak;
  const thresholdReached = DAILY_THRESHOLDS.includes(streaks.dailyStreak)
    ? streaks.dailyStreak
    : null;

  return {
    currentStreak: streaks.dailyStreak,
    isNewRecord,
    thresholdReached,
  };
}

/**
 * Update the weekly circumference measurement streak.
 *
 * Logic:
 * - If no previous streak data or no last week: start streak at 1
 * - If the given weekStart is the same as the last week: no change (idempotent)
 * - If the given weekStart is exactly 1 week after the last week: increment streak
 * - If there's a gap (more than 1 week): reset streak to 1
 *
 * Persists updated streaks to IndexedDB and returns StreakInfo.
 *
 * Requirements: 11.2, 11.3, 11.4, 11.5
 */
export async function updateWeeklyStreak(weekStart: string): Promise<StreakInfo> {
  const db = await getDB();
  const streaks = (await db.get('streaks', STREAKS_KEY)) ?? defaultStreaks();
  const previousStreak = streaks.weeklyStreak;

  if (streaks.weeklyLastDate === null) {
    // First ever weekly measurement
    streaks.weeklyStreak = 1;
  } else if (streaks.weeklyLastDate === weekStart) {
    // Same week — idempotent, no change
    return {
      currentStreak: streaks.weeklyStreak,
      isNewRecord: false,
      thresholdReached: null,
    };
  } else {
    const gap = weeksBetween(streaks.weeklyLastDate, weekStart);
    if (gap === 1) {
      // Consecutive week — extend streak
      streaks.weeklyStreak += 1;
    } else if (gap > 1) {
      // Gap detected — reset to 1 (this week counts)
      streaks.weeklyStreak = 1;
    } else {
      // weekStart is before or equal to lastWeek (shouldn't normally happen)
      // Treat as idempotent
      return {
        currentStreak: streaks.weeklyStreak,
        isNewRecord: false,
        thresholdReached: null,
      };
    }
  }

  streaks.weeklyLastDate = weekStart;
  streaks.updatedAt = new Date().toISOString();

  await db.put('streaks', streaks, STREAKS_KEY);

  const isNewRecord = streaks.weeklyStreak > previousStreak;
  const thresholdReached = WEEKLY_THRESHOLDS.includes(streaks.weeklyStreak)
    ? streaks.weeklyStreak
    : null;

  return {
    currentStreak: streaks.weeklyStreak,
    isNewRecord,
    thresholdReached,
  };
}

/** German labels for each milestone type */
const MILESTONE_LABELS: Record<MilestoneType, string> = {
  'first-goal-reached': 'Erstes Ziel erreicht!',
  'weight-loss-5kg': '5 kg abgenommen!',
  'daily-streak-10': '10 Tage am Stück gewogen!',
  'daily-streak-30': '30 Tage am Stück gewogen!',
  'weekly-streak-4': '4 Wochen Umfänge gemessen!',
  'weekly-streak-12': '12 Wochen Umfänge gemessen!',
};

/**
 * Calculate cumulative weight loss from daily measurements.
 * Finds the earliest and most recent weight values and returns the difference.
 */
function calculateWeightLoss(dailyMeasurements: DailyMeasurement[]): number {
  const withWeight = dailyMeasurements
    .filter((m) => m.weight != null)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (withWeight.length < 2) return 0;

  const earliest = withWeight[0].weight!;
  const mostRecent = withWeight[withWeight.length - 1].weight!;

  // Weight loss is positive when most recent < earliest
  return earliest - mostRecent;
}

/**
 * Create a new Milestone object.
 */
function createMilestone(type: MilestoneType): Milestone {
  return {
    id: crypto.randomUUID(),
    type,
    label: MILESTONE_LABELS[type],
    earnedAt: new Date().toISOString().split('T')[0],
    notified: false,
  };
}

/**
 * Check if a milestone type has already been earned.
 */
function hasEarned(earnedMilestones: Milestone[], type: MilestoneType): boolean {
  return earnedMilestones.some((m) => m.type === type);
}

/**
 * Evaluate all milestone conditions and return newly earned milestones.
 * Already earned milestones are not triggered again (deduplication).
 * New milestones are persisted to IndexedDB.
 *
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */
export async function evaluateMilestones(context: MilestoneContext): Promise<Milestone[]> {
  const { goals, streaks, dailyMeasurements, earnedMilestones } = context;
  const newMilestones: Milestone[] = [];

  // 1. first-goal-reached: at least one goal has status === 'reached'
  if (!hasEarned(earnedMilestones, 'first-goal-reached')) {
    const hasReachedGoal = goals.some((g) => g.status === 'reached');
    if (hasReachedGoal) {
      newMilestones.push(createMilestone('first-goal-reached'));
    }
  }

  // 2. weight-loss-5kg: cumulative weight loss >= 5.0 kg
  if (!hasEarned(earnedMilestones, 'weight-loss-5kg')) {
    const weightLoss = calculateWeightLoss(dailyMeasurements);
    if (weightLoss >= 5.0) {
      newMilestones.push(createMilestone('weight-loss-5kg'));
    }
  }

  // 3. daily-streak-10: dailyStreak >= 10
  if (!hasEarned(earnedMilestones, 'daily-streak-10')) {
    if (streaks.dailyStreak >= 10) {
      newMilestones.push(createMilestone('daily-streak-10'));
    }
  }

  // 4. daily-streak-30: dailyStreak >= 30
  if (!hasEarned(earnedMilestones, 'daily-streak-30')) {
    if (streaks.dailyStreak >= 30) {
      newMilestones.push(createMilestone('daily-streak-30'));
    }
  }

  // 5. weekly-streak-4: weeklyStreak >= 4
  if (!hasEarned(earnedMilestones, 'weekly-streak-4')) {
    if (streaks.weeklyStreak >= 4) {
      newMilestones.push(createMilestone('weekly-streak-4'));
    }
  }

  // 6. weekly-streak-12: weeklyStreak >= 12
  if (!hasEarned(earnedMilestones, 'weekly-streak-12')) {
    if (streaks.weeklyStreak >= 12) {
      newMilestones.push(createMilestone('weekly-streak-12'));
    }
  }

  // Persist new milestones to IndexedDB
  if (newMilestones.length > 0) {
    const db = await getDB();
    const tx = db.transaction('milestones', 'readwrite');
    for (const milestone of newMilestones) {
      await tx.store.put(milestone);
    }
    await tx.done;
  }

  return newMilestones;
}

/**
 * Retrieve all earned milestones from IndexedDB.
 *
 * Requirements: 12.4, 12.5
 */
export async function getEarnedMilestones(): Promise<Milestone[]> {
  const db = await getDB();
  return db.getAll('milestones');
}

/**
 * Get all 7 dates (Mon–Sun) for the calendar week starting at weekStart.
 */
function getWeekDates(weekStart: string): string[] {
  const dates: string[] = [];
  const start = new Date(weekStart + 'T00:00:00Z');
  for (let i = 0; i < 7; i++) {
    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

/**
 * Calculate the weekly consistency score.
 *
 * Pure function — no IndexedDB access needed.
 *
 * - `daysLogged`: count of days in the calendar week (Mon–Sun starting from weekStart)
 *   that have a DailyMeasurement record
 * - `weeklyCompleted`: boolean parameter (true if a WeeklyMeasurement exists for that week)
 * - `score = Math.round((daysLogged / 7) * 70 + (weeklyCompleted ? 30 : 0))`, clamped to [0, 100]
 *
 * Requirements: 13.1, 13.2
 */
export function calculateConsistencyScore(
  weekStart: string,
  dailyMeasurements: DailyMeasurement[],
  hasWeeklyMeasurement: boolean
): ConsistencyScore {
  const weekDates = new Set(getWeekDates(weekStart));
  const dailyDates = new Set(dailyMeasurements.map((m) => m.date));

  let daysLogged = 0;
  for (const date of weekDates) {
    if (dailyDates.has(date)) {
      daysLogged++;
    }
  }

  const rawScore = Math.round((daysLogged / 7) * 70 + (hasWeeklyMeasurement ? 30 : 0));
  const score = Math.max(0, Math.min(100, rawScore));

  return {
    weekStart,
    daysLogged,
    weeklyCompleted: hasWeeklyMeasurement,
    score,
  };
}


/** German labels for circumference zones used in NSV messages */
const ZONE_LABELS: Record<CircumferenceZone, string> = {
  chest: 'Brust',
  waist: 'Taille',
  hip: 'Hüfte',
  belly: 'Bauch',
  upperArm: 'Oberarm',
  thigh: 'Oberschenkel',
};

/** All circumference zone keys in the order we check them */
const CIRCUMFERENCE_ZONES: CircumferenceZone[] = ['chest', 'waist', 'hip', 'belly', 'upperArm', 'thigh'];

/**
 * Detect non-scale victories from measurement data.
 *
 * Pure function — no IndexedDB access needed.
 *
 * Check 1: Weight stable (< 0.3 kg change over 14 days) AND any circumference zone
 *          decreased > 0.5 cm → NSV for that zone.
 * Check 2: Body fat decreased > 0.5% over 14 days → NSV regardless of weight.
 *
 * Uses today's date for the 14-day window and for `detectedAt`.
 *
 * Requirements: 14.1, 14.2, 14.3
 */
export function detectNonScaleVictories(
  dailyMeasurements: DailyMeasurement[],
  weeklyMeasurements: WeeklyMeasurement[]
): NonScaleVictory[] {
  const victories: NonScaleVictory[] = [];
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - 14);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  // Filter daily measurements to the 14-day window
  const recentDaily = dailyMeasurements
    .filter((m) => m.date >= cutoffStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Filter weekly measurements to the 14-day window
  const recentWeekly = weeklyMeasurements
    .filter((m) => m.date >= cutoffStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  // --- Check 1: Circumference drop with stable weight ---
  const withWeight = recentDaily.filter((m) => m.weight != null);
  if (withWeight.length >= 2 && recentWeekly.length >= 2) {
    const earliestWeight = withWeight[0].weight!;
    const latestWeight = withWeight[withWeight.length - 1].weight!;
    const weightChange = Math.abs(latestWeight - earliestWeight);

    if (weightChange < 0.3) {
      const earliestWeekly = recentWeekly[0];
      const latestWeekly = recentWeekly[recentWeekly.length - 1];

      for (const zone of CIRCUMFERENCE_ZONES) {
        const earliestVal = earliestWeekly[zone];
        const latestVal = latestWeekly[zone];

        if (earliestVal != null && latestVal != null) {
          const diff = earliestVal - latestVal;
          if (diff > 0.5) {
            const diffRounded = Math.round(diff * 10) / 10;
            victories.push({
              message: `Deine ${ZONE_LABELS[zone]} ist um ${diffRounded} cm geschrumpft — auch wenn die Waage das nicht zeigt!`,
              metric: zone,
              detectedAt: todayStr,
            });
          }
        }
      }
    }
  }

  // --- Check 2: Body fat drop ---
  const withBodyFat = recentDaily.filter((m) => m.bodyFat != null);
  if (withBodyFat.length >= 2) {
    const earliestBf = withBodyFat[0].bodyFat!;
    const latestBf = withBodyFat[withBodyFat.length - 1].bodyFat!;
    const bfDrop = earliestBf - latestBf;

    if (bfDrop > 0.5) {
      const diffRounded = Math.round(bfDrop * 10) / 10;
      victories.push({
        message: `Dein Körperfettanteil ist um ${diffRounded}% gesunken — toller Fortschritt!`,
        metric: 'bodyFat',
        detectedAt: todayStr,
      });
    }
  }

  return victories;
}
