import { getDB } from './db';
import type { Goal, GoalInput, GoalStatus, GoalProjection, GoalEvaluation, DailyMeasurement, WeeklyMeasurement, CircumferenceZone } from '../types';
import { syncIfNeeded } from './cloudSync';

/**
 * Create a new goal with validation and persist to IndexedDB.
 * Validates that targetValue !== startValue.
 * Generates UUID, sets createdAt/updatedAt to current ISO timestamp, status to 'active'.
 */
export async function createGoal(input: GoalInput): Promise<Goal> {
  if (input.targetValue === input.startValue) {
    throw new Error('Zielwert darf nicht dem Startwert entsprechen.');
  }

  const now = new Date().toISOString();
  const goal: Goal = {
    id: crypto.randomUUID(),
    metricType: input.metricType,
    ...(input.zone !== undefined ? { zone: input.zone } : {}),
    startValue: input.startValue,
    targetValue: input.targetValue,
    ...(input.deadline !== undefined ? { deadline: input.deadline } : {}),
    createdAt: now,
    status: 'active',
    updatedAt: now,
  };

  const db = await getDB();
  await db.put('goals', goal);

  // Trigger cloud sync (fire-and-forget)
  syncIfNeeded().catch(() => {});

  return goal;
}

/**
 * Retrieve a single goal by ID.
 */
export async function getGoal(id: string): Promise<Goal | undefined> {
  const db = await getDB();
  return db.get('goals', id);
}

/**
 * Retrieve all goals.
 */
export async function getAllGoals(): Promise<Goal[]> {
  const db = await getDB();
  return db.getAll('goals');
}

/**
 * Retrieve all goals with status 'active'.
 */
export async function getActiveGoals(): Promise<Goal[]> {
  const db = await getDB();
  return db.getAllFromIndex('goals', 'by-status', 'active');
}

/**
 * Update a goal's status. Sets reachedAt when status is 'reached'.
 * Updates updatedAt timestamp.
 */
export async function updateGoalStatus(id: string, status: GoalStatus): Promise<void> {
  const db = await getDB();
  const goal = await db.get('goals', id);
  if (!goal) {
    throw new Error(`Goal mit ID "${id}" nicht gefunden.`);
  }

  const now = new Date().toISOString();
  goal.status = status;
  goal.updatedAt = now;

  if (status === 'reached') {
    goal.reachedAt = now;
  }

  await db.put('goals', goal);

  // Trigger cloud sync (fire-and-forget)
  syncIfNeeded().catch(() => {});
}

/**
 * Delete a goal from IndexedDB.
 */
export async function deleteGoal(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('goals', id);

  // Trigger cloud sync (fire-and-forget)
  syncIfNeeded().catch(() => {});
}

/**
 * Extract the relevant numeric value from a DailyMeasurement based on metric type.
 */
function extractDailyValue(m: DailyMeasurement, metricType: 'weight' | 'bodyFat'): number | undefined {
  return metricType === 'weight' ? m.weight : m.bodyFat;
}

/**
 * Extract the relevant numeric value from a WeeklyMeasurement based on zone.
 */
function extractWeeklyValue(m: WeeklyMeasurement, zone: CircumferenceZone): number | undefined {
  return m[zone];
}

/**
 * Get the Monday (ISO week start) for a given date string (YYYY-MM-DD).
 */
function getISOWeekMonday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

/**
 * Pure function: calculates goal projection from a goal and its measurements.
 *
 * Algorithm:
 * 1. Filter measurements to the goal's metric type (and zone for circumference). Sort by date ascending.
 * 2. Current value: most recent measurement value.
 * 3. Remaining distance: |targetValue - currentValue|
 * 4. Percent complete: (|startValue - currentValue| / |startValue - targetValue|) * 100, clamped 0–100.
 * 5. Current weekly rate (requires ≥3 data points spanning ≥7 days): weighted moving average of last 4 weeks.
 * 6. Projected date (requires currentWeeklyRate ≠ 0): today + (remainingDistance / |rate|) * 7 days.
 * 7. Required weekly tempo (requires deadline): remainingDistance / weeksUntilDeadline.
 * 8. Trend feedback based on projected date vs deadline.
 */
export function calculateProjection(
  goal: Goal,
  measurements: DailyMeasurement[] | WeeklyMeasurement[]
): GoalProjection {
  // Step 1: Extract relevant values, filter and sort by date ascending
  const dataPoints: { date: string; value: number }[] = [];

  if (goal.metricType === 'circumference') {
    const zone = goal.zone!;
    for (const m of measurements as WeeklyMeasurement[]) {
      const val = extractWeeklyValue(m, zone);
      if (val !== undefined) {
        dataPoints.push({ date: m.date, value: val });
      }
    }
  } else {
    for (const m of measurements as DailyMeasurement[]) {
      const val = extractDailyValue(m, goal.metricType);
      if (val !== undefined) {
        dataPoints.push({ date: m.date, value: val });
      }
    }
  }

  dataPoints.sort((a, b) => a.date.localeCompare(b.date));

  // Handle no data: return defaults
  if (dataPoints.length === 0) {
    return {
      currentValue: goal.startValue,
      remainingDistance: Math.abs(goal.targetValue - goal.startValue),
      percentComplete: 0,
      requiredWeeklyTempo: null,
      projectedDate: null,
      currentWeeklyRate: null,
      trendFeedback: 'insufficient-data',
    };
  }

  // Step 2: Current value
  const currentValue = dataPoints[dataPoints.length - 1].value;

  // Step 3: Remaining distance
  const remainingDistance = Math.abs(goal.targetValue - currentValue);

  // Step 4: Percent complete (clamped 0–100)
  const totalDistance = Math.abs(goal.startValue - goal.targetValue);
  const coveredDistance = Math.abs(goal.startValue - currentValue);
  const percentComplete = totalDistance === 0
    ? 100
    : Math.min(100, Math.max(0, (coveredDistance / totalDistance) * 100));

  // Step 5: Current weekly rate (requires ≥3 data points spanning ≥7 days)
  let currentWeeklyRate: number | null = null;

  const firstDate = new Date(dataPoints[0].date + 'T00:00:00Z');
  const lastDate = new Date(dataPoints[dataPoints.length - 1].date + 'T00:00:00Z');
  const spanDays = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);

  if (dataPoints.length >= 3 && spanDays >= 7) {
    // Group measurements into calendar weeks (by ISO week Monday)
    const weeklyGroups = new Map<string, number[]>();
    for (const dp of dataPoints) {
      const weekKey = getISOWeekMonday(dp.date);
      if (!weeklyGroups.has(weekKey)) {
        weeklyGroups.set(weekKey, []);
      }
      weeklyGroups.get(weekKey)!.push(dp.value);
    }

    // Compute weekly averages, sorted by week
    const weeklyAverages = Array.from(weeklyGroups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, values]) => values.reduce((sum, v) => sum + v, 0) / values.length);

    // Compute weekly deltas (need at least 2 weekly averages)
    if (weeklyAverages.length >= 2) {
      const deltas: number[] = [];
      for (let i = 1; i < weeklyAverages.length; i++) {
        deltas.push(weeklyAverages[i] - weeklyAverages[i - 1]);
      }

      // Take the most recent 4 deltas (or fewer)
      const recentDeltas = deltas.slice(-4);

      // Apply weighted moving average: weights [0.4, 0.3, 0.2, 0.1] for most-recent to oldest
      const weights = [0.4, 0.3, 0.2, 0.1];
      let weightedSum = 0;
      let weightSum = 0;
      for (let i = 0; i < recentDeltas.length; i++) {
        // Most recent delta gets highest weight
        const w = weights[recentDeltas.length - 1 - i];
        weightedSum += recentDeltas[i] * w;
        weightSum += w;
      }
      currentWeeklyRate = weightedSum / weightSum;
    }
  }

  // Step 6: Projected date (requires currentWeeklyRate ≠ 0 and moving toward target)
  let projectedDate: string | null = null;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (currentWeeklyRate !== null && currentWeeklyRate !== 0) {
    // Check if rate is moving toward target
    const isDecreasingGoal = goal.targetValue < goal.startValue;
    const isMovingTowardTarget = isDecreasingGoal
      ? currentWeeklyRate < 0
      : currentWeeklyRate > 0;

    if (isMovingTowardTarget && remainingDistance > 0) {
      const weeksRemaining = remainingDistance / Math.abs(currentWeeklyRate);
      const projDate = new Date(today);
      projDate.setUTCDate(projDate.getUTCDate() + Math.round(weeksRemaining * 7));
      projectedDate = projDate.toISOString().slice(0, 10);
    }
  }

  // Step 7: Required weekly tempo (requires deadline)
  let requiredWeeklyTempo: number | null = null;
  if (goal.deadline) {
    const deadlineDate = new Date(goal.deadline + 'T00:00:00Z');
    const weeksUntilDeadline = (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 7);
    if (weeksUntilDeadline > 0) {
      requiredWeeklyTempo = remainingDistance / weeksUntilDeadline;
    }
  }

  // Step 8: Trend feedback
  let trendFeedback: GoalProjection['trendFeedback'] = 'insufficient-data';

  if (currentWeeklyRate === null) {
    trendFeedback = 'insufficient-data';
  } else if (!goal.deadline) {
    // No deadline: based on whether rate is moving toward target
    const isDecreasingGoal = goal.targetValue < goal.startValue;
    const isMovingTowardTarget = isDecreasingGoal
      ? currentWeeklyRate < 0
      : currentWeeklyRate > 0;
    trendFeedback = isMovingTowardTarget ? 'ahead' : 'behind';
  } else if (projectedDate) {
    const deadlineDate = new Date(goal.deadline + 'T00:00:00Z');
    const projDate = new Date(projectedDate + 'T00:00:00Z');
    const diffDays = (projDate.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays <= 0) {
      // projectedDate <= deadline
      trendFeedback = 'ahead';
    } else if (diffDays <= 7) {
      // within 1 week of deadline
      trendFeedback = 'on-track';
    } else {
      trendFeedback = 'behind';
    }
  } else {
    // Has deadline but no projected date (rate not moving toward target or rate is 0)
    trendFeedback = 'behind';
  }

  return {
    currentValue,
    remainingDistance,
    percentComplete,
    requiredWeeklyTempo,
    projectedDate,
    currentWeeklyRate,
    trendFeedback,
  };
}

/**
 * Evaluate all active goals against current measurements.
 * Called after each measurement save.
 *
 * For each active goal:
 * - Determines the current value from the most recent measurement
 * - Checks if the goal target has been reached (direction-aware)
 * - If reached: updates status to 'reached', saves reachedAt, triggers Supabase sync
 * - Returns a GoalEvaluation for each active goal
 */
export async function evaluateGoals(
  measurements: DailyMeasurement[],
  weeklyMeasurements: WeeklyMeasurement[]
): Promise<GoalEvaluation[]> {
  const activeGoals = await getActiveGoals();
  const evaluations: GoalEvaluation[] = [];

  for (const goal of activeGoals) {
    let currentValue: number | undefined;

    if (goal.metricType === 'circumference') {
      // Find the most recent weekly measurement with a value for this zone
      const zone = goal.zone!;
      const sorted = [...weeklyMeasurements].sort((a, b) => b.date.localeCompare(a.date));
      for (const m of sorted) {
        const val = extractWeeklyValue(m, zone);
        if (val !== undefined) {
          currentValue = val;
          break;
        }
      }
    } else {
      // weight or bodyFat — find the most recent daily measurement with a value
      const sorted = [...measurements].sort((a, b) => b.date.localeCompare(a.date));
      for (const m of sorted) {
        const val = extractDailyValue(m, goal.metricType);
        if (val !== undefined) {
          currentValue = val;
          break;
        }
      }
    }

    // If no measurement value found, goal cannot be evaluated
    if (currentValue === undefined) {
      evaluations.push({
        goalId: goal.id,
        previousStatus: goal.status,
        newStatus: goal.status,
        justReached: false,
      });
      continue;
    }

    // Determine if goal is reached based on direction
    const isLosingGoal = goal.targetValue < goal.startValue;
    const reached = isLosingGoal
      ? currentValue <= goal.targetValue
      : currentValue >= goal.targetValue;

    if (reached) {
      await updateGoalStatus(goal.id, 'reached');
      evaluations.push({
        goalId: goal.id,
        previousStatus: 'active',
        newStatus: 'reached',
        justReached: true,
      });
    } else {
      evaluations.push({
        goalId: goal.id,
        previousStatus: goal.status,
        newStatus: goal.status,
        justReached: false,
      });
    }
  }

  return evaluations;
}


