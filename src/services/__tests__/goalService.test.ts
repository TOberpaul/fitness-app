import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { resetDB } from '../db';
import {
  createGoal,
  getGoal,
  getAllGoals,
  getActiveGoals,
  updateGoalStatus,
  deleteGoal,
  calculateProjection,
  evaluateGoals,
} from '../goalService';
import type { GoalInput, Goal, DailyMeasurement, WeeklyMeasurement } from '../../types';

function makeGoalInput(overrides: Partial<GoalInput> = {}): GoalInput {
  return {
    metricType: 'weight',
    startValue: 85.0,
    targetValue: 75.0,
    ...overrides,
  };
}

beforeEach(() => {
  resetDB();
  indexedDB.deleteDatabase('fitness-tracker');
});

describe('goalService - createGoal', () => {
  it('creates a goal with generated UUID and timestamps', async () => {
    const input = makeGoalInput();
    const goal = await createGoal(input);

    expect(goal.id).toBeTruthy();
    expect(goal.metricType).toBe('weight');
    expect(goal.startValue).toBe(85.0);
    expect(goal.targetValue).toBe(75.0);
    expect(goal.status).toBe('active');
    expect(goal.createdAt).toBeTruthy();
    expect(goal.updatedAt).toBeTruthy();
    expect(goal.reachedAt).toBeUndefined();
  });

  it('creates a circumference goal with zone', async () => {
    const input = makeGoalInput({
      metricType: 'circumference',
      zone: 'waist',
      startValue: 90.0,
      targetValue: 80.0,
    });
    const goal = await createGoal(input);

    expect(goal.metricType).toBe('circumference');
    expect(goal.zone).toBe('waist');
  });

  it('creates a goal with optional deadline', async () => {
    const input = makeGoalInput({ deadline: '2025-06-01' });
    const goal = await createGoal(input);

    expect(goal.deadline).toBe('2025-06-01');
  });

  it('creates a bodyFat goal', async () => {
    const input = makeGoalInput({
      metricType: 'bodyFat',
      startValue: 22.0,
      targetValue: 18.0,
    });
    const goal = await createGoal(input);

    expect(goal.metricType).toBe('bodyFat');
    expect(goal.startValue).toBe(22.0);
    expect(goal.targetValue).toBe(18.0);
  });

  it('throws error when targetValue equals startValue (German message)', async () => {
    const input = makeGoalInput({ startValue: 80.0, targetValue: 80.0 });

    await expect(createGoal(input)).rejects.toThrow(
      'Zielwert darf nicht dem Startwert entsprechen.'
    );
  });

  it('does not persist goal when validation fails', async () => {
    const input = makeGoalInput({ startValue: 80.0, targetValue: 80.0 });

    try {
      await createGoal(input);
    } catch {
      // expected
    }

    const all = await getAllGoals();
    expect(all).toHaveLength(0);
  });

  it('persists goal to IndexedDB', async () => {
    const goal = await createGoal(makeGoalInput());
    const retrieved = await getGoal(goal.id);

    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe(goal.id);
    expect(retrieved!.metricType).toBe(goal.metricType);
  });
});

describe('goalService - getGoal', () => {
  it('returns undefined for non-existent ID', async () => {
    const result = await getGoal('non-existent-id');
    expect(result).toBeUndefined();
  });

  it('retrieves a previously created goal', async () => {
    const goal = await createGoal(makeGoalInput());
    const retrieved = await getGoal(goal.id);

    expect(retrieved).toEqual(goal);
  });
});

describe('goalService - getAllGoals', () => {
  it('returns empty array when no goals exist', async () => {
    const goals = await getAllGoals();
    expect(goals).toEqual([]);
  });

  it('returns all created goals', async () => {
    await createGoal(makeGoalInput({ startValue: 85, targetValue: 75 }));
    await createGoal(makeGoalInput({ startValue: 90, targetValue: 80 }));

    const goals = await getAllGoals();
    expect(goals).toHaveLength(2);
  });
});

describe('goalService - getActiveGoals', () => {
  it('returns only active goals', async () => {
    const goal1 = await createGoal(makeGoalInput({ startValue: 85, targetValue: 75 }));
    await createGoal(makeGoalInput({ startValue: 90, targetValue: 80 }));

    await updateGoalStatus(goal1.id, 'reached');

    const active = await getActiveGoals();
    expect(active).toHaveLength(1);
    expect(active[0].status).toBe('active');
  });

  it('returns empty array when no active goals', async () => {
    const goal = await createGoal(makeGoalInput());
    await updateGoalStatus(goal.id, 'archived');

    const active = await getActiveGoals();
    expect(active).toEqual([]);
  });
});

describe('goalService - updateGoalStatus', () => {
  it('updates status to reached and sets reachedAt', async () => {
    const goal = await createGoal(makeGoalInput());
    await updateGoalStatus(goal.id, 'reached');

    const updated = await getGoal(goal.id);
    expect(updated!.status).toBe('reached');
    expect(updated!.reachedAt).toBeTruthy();
    expect(updated!.updatedAt).not.toBe(goal.updatedAt);
  });

  it('updates status to archived without setting reachedAt', async () => {
    const goal = await createGoal(makeGoalInput());
    await updateGoalStatus(goal.id, 'archived');

    const updated = await getGoal(goal.id);
    expect(updated!.status).toBe('archived');
    expect(updated!.reachedAt).toBeUndefined();
  });

  it('throws error for non-existent goal', async () => {
    await expect(updateGoalStatus('non-existent', 'reached')).rejects.toThrow(
      'Goal mit ID "non-existent" nicht gefunden.'
    );
  });

  it('updates updatedAt timestamp', async () => {
    const goal = await createGoal(makeGoalInput());
    const originalUpdatedAt = goal.updatedAt;

    // Small delay to ensure different timestamp
    await new Promise((r) => setTimeout(r, 10));
    await updateGoalStatus(goal.id, 'reached');

    const updated = await getGoal(goal.id);
    expect(updated!.updatedAt >= originalUpdatedAt).toBe(true);
  });
});

describe('goalService - deleteGoal', () => {
  it('removes goal from IndexedDB', async () => {
    const goal = await createGoal(makeGoalInput());
    await deleteGoal(goal.id);

    const result = await getGoal(goal.id);
    expect(result).toBeUndefined();
  });

  it('does not throw when deleting non-existent goal', async () => {
    await expect(deleteGoal('non-existent')).resolves.toBeUndefined();
  });
});

// ─── Helper to create a Goal object for projection tests ─────────────

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'test-goal-1',
    metricType: 'weight',
    startValue: 90.0,
    targetValue: 80.0,
    createdAt: '2024-01-01T00:00:00.000Z',
    status: 'active',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeDailyMeasurement(date: string, weight?: number, bodyFat?: number): DailyMeasurement {
  return {
    date,
    weight,
    bodyFat,
    source: 'manual',
    updatedAt: new Date().toISOString(),
  };
}

function makeWeeklyMeasurement(date: string, values: Partial<WeeklyMeasurement> = {}): WeeklyMeasurement {
  return {
    date,
    updatedAt: new Date().toISOString(),
    ...values,
  };
}

describe('goalService - calculateProjection', () => {
  describe('basic calculations', () => {
    it('returns insufficient-data with defaults when no measurements', () => {
      const goal = makeGoal();
      const result = calculateProjection(goal, []);

      expect(result.currentValue).toBe(90.0);
      expect(result.remainingDistance).toBe(10.0);
      expect(result.percentComplete).toBe(0);
      expect(result.currentWeeklyRate).toBeNull();
      expect(result.projectedDate).toBeNull();
      expect(result.requiredWeeklyTempo).toBeNull();
      expect(result.trendFeedback).toBe('insufficient-data');
    });

    it('calculates currentValue from most recent measurement', () => {
      const goal = makeGoal();
      const measurements: DailyMeasurement[] = [
        makeDailyMeasurement('2024-01-10', 88.0),
        makeDailyMeasurement('2024-01-15', 86.0),
      ];
      const result = calculateProjection(goal, measurements);

      expect(result.currentValue).toBe(86.0);
    });

    it('calculates remainingDistance correctly', () => {
      const goal = makeGoal({ startValue: 90, targetValue: 80 });
      const measurements: DailyMeasurement[] = [
        makeDailyMeasurement('2024-01-10', 85.0),
      ];
      const result = calculateProjection(goal, measurements);

      expect(result.remainingDistance).toBe(5.0);
    });

    it('calculates percentComplete correctly', () => {
      const goal = makeGoal({ startValue: 90, targetValue: 80 });
      const measurements: DailyMeasurement[] = [
        makeDailyMeasurement('2024-01-10', 85.0),
      ];
      const result = calculateProjection(goal, measurements);

      // Covered 5 out of 10 = 50%
      expect(result.percentComplete).toBe(50);
    });

    it('clamps percentComplete to 0-100', () => {
      const goal = makeGoal({ startValue: 90, targetValue: 80 });
      // Overshot the target
      const measurements: DailyMeasurement[] = [
        makeDailyMeasurement('2024-01-10', 75.0),
      ];
      const result = calculateProjection(goal, measurements);

      expect(result.percentComplete).toBe(100);
    });

    it('handles percentComplete when moving away from target', () => {
      const goal = makeGoal({ startValue: 90, targetValue: 80 });
      // Gained weight instead
      const measurements: DailyMeasurement[] = [
        makeDailyMeasurement('2024-01-10', 95.0),
      ];
      const result = calculateProjection(goal, measurements);

      // coveredDistance = |90 - 95| = 5, totalDistance = 10
      // But moving away, so percent = 50 (it's based on absolute distance from start)
      expect(result.percentComplete).toBe(50);
    });
  });

  describe('insufficient data for weekly rate', () => {
    it('returns null currentWeeklyRate with fewer than 3 data points', () => {
      const goal = makeGoal();
      const measurements: DailyMeasurement[] = [
        makeDailyMeasurement('2024-01-01', 90.0),
        makeDailyMeasurement('2024-01-15', 88.0),
      ];
      const result = calculateProjection(goal, measurements);

      expect(result.currentWeeklyRate).toBeNull();
      expect(result.trendFeedback).toBe('insufficient-data');
    });

    it('returns null currentWeeklyRate when span < 7 days', () => {
      const goal = makeGoal();
      const measurements: DailyMeasurement[] = [
        makeDailyMeasurement('2024-01-01', 90.0),
        makeDailyMeasurement('2024-01-03', 89.5),
        makeDailyMeasurement('2024-01-05', 89.0),
      ];
      const result = calculateProjection(goal, measurements);

      expect(result.currentWeeklyRate).toBeNull();
    });
  });

  describe('weekly rate calculation', () => {
    it('calculates currentWeeklyRate with sufficient data', () => {
      const goal = makeGoal({ startValue: 90, targetValue: 80 });
      // 3 weeks of data, losing ~1kg per week
      const measurements: DailyMeasurement[] = [
        makeDailyMeasurement('2024-01-01', 90.0),
        makeDailyMeasurement('2024-01-08', 89.0),
        makeDailyMeasurement('2024-01-15', 88.0),
      ];
      const result = calculateProjection(goal, measurements);

      expect(result.currentWeeklyRate).not.toBeNull();
      expect(result.currentWeeklyRate!).toBeLessThan(0); // losing weight
    });

    it('returns non-null projectedDate when rate moves toward target', () => {
      const goal = makeGoal({ startValue: 90, targetValue: 80 });
      const measurements: DailyMeasurement[] = [
        makeDailyMeasurement('2024-01-01', 90.0),
        makeDailyMeasurement('2024-01-08', 89.0),
        makeDailyMeasurement('2024-01-15', 88.0),
      ];
      const result = calculateProjection(goal, measurements);

      expect(result.projectedDate).not.toBeNull();
    });
  });

  describe('required weekly tempo', () => {
    it('calculates requiredWeeklyTempo when deadline is set', () => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const futureDate = new Date(today);
      futureDate.setUTCDate(futureDate.getUTCDate() + 70); // 10 weeks from now
      const deadline = futureDate.toISOString().slice(0, 10);

      const goal = makeGoal({ startValue: 90, targetValue: 80, deadline });
      const measurements: DailyMeasurement[] = [
        makeDailyMeasurement('2024-01-10', 85.0),
      ];
      const result = calculateProjection(goal, measurements);

      // remainingDistance = 5, weeksUntilDeadline = 10
      expect(result.requiredWeeklyTempo).not.toBeNull();
      expect(result.requiredWeeklyTempo!).toBeCloseTo(0.5, 1);
    });

    it('returns null requiredWeeklyTempo when no deadline', () => {
      const goal = makeGoal({ deadline: undefined });
      const measurements: DailyMeasurement[] = [
        makeDailyMeasurement('2024-01-10', 85.0),
      ];
      const result = calculateProjection(goal, measurements);

      expect(result.requiredWeeklyTempo).toBeNull();
    });
  });

  describe('trend feedback', () => {
    it('returns ahead when projected date is before deadline', () => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      // Set deadline far in the future
      const futureDate = new Date(today);
      futureDate.setUTCDate(futureDate.getUTCDate() + 365);
      const deadline = futureDate.toISOString().slice(0, 10);

      const goal = makeGoal({ startValue: 90, targetValue: 80, deadline });
      // Fast progress: losing ~2kg/week
      const d1 = new Date(today);
      d1.setUTCDate(d1.getUTCDate() - 21);
      const d2 = new Date(today);
      d2.setUTCDate(d2.getUTCDate() - 14);
      const d3 = new Date(today);
      d3.setUTCDate(d3.getUTCDate() - 7);
      const d4 = new Date(today);

      const measurements: DailyMeasurement[] = [
        makeDailyMeasurement(d1.toISOString().slice(0, 10), 90.0),
        makeDailyMeasurement(d2.toISOString().slice(0, 10), 88.0),
        makeDailyMeasurement(d3.toISOString().slice(0, 10), 86.0),
        makeDailyMeasurement(d4.toISOString().slice(0, 10), 84.0),
      ];
      const result = calculateProjection(goal, measurements);

      expect(result.trendFeedback).toBe('ahead');
    });

    it('returns behind when projected date is well after deadline', () => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      // Set deadline very soon
      const soonDate = new Date(today);
      soonDate.setUTCDate(soonDate.getUTCDate() + 7);
      const deadline = soonDate.toISOString().slice(0, 10);

      const goal = makeGoal({ startValue: 90, targetValue: 80, deadline });
      // Slow progress: losing ~0.1kg/week
      const d1 = new Date(today);
      d1.setUTCDate(d1.getUTCDate() - 21);
      const d2 = new Date(today);
      d2.setUTCDate(d2.getUTCDate() - 14);
      const d3 = new Date(today);
      d3.setUTCDate(d3.getUTCDate() - 7);
      const d4 = new Date(today);

      const measurements: DailyMeasurement[] = [
        makeDailyMeasurement(d1.toISOString().slice(0, 10), 89.7),
        makeDailyMeasurement(d2.toISOString().slice(0, 10), 89.6),
        makeDailyMeasurement(d3.toISOString().slice(0, 10), 89.5),
        makeDailyMeasurement(d4.toISOString().slice(0, 10), 89.4),
      ];
      const result = calculateProjection(goal, measurements);

      expect(result.trendFeedback).toBe('behind');
    });

    it('returns insufficient-data when not enough measurements for rate', () => {
      const goal = makeGoal({ deadline: '2025-12-31' });
      const measurements: DailyMeasurement[] = [
        makeDailyMeasurement('2024-01-10', 88.0),
      ];
      const result = calculateProjection(goal, measurements);

      expect(result.trendFeedback).toBe('insufficient-data');
    });
  });

  describe('circumference goals', () => {
    it('extracts values from WeeklyMeasurement for circumference goals', () => {
      const goal = makeGoal({
        metricType: 'circumference',
        zone: 'waist',
        startValue: 95.0,
        targetValue: 85.0,
      });
      const measurements: WeeklyMeasurement[] = [
        makeWeeklyMeasurement('2024-01-01', { waist: 93.0 }),
        makeWeeklyMeasurement('2024-01-08', { waist: 91.0 }),
      ];
      const result = calculateProjection(goal, measurements);

      expect(result.currentValue).toBe(91.0);
      expect(result.remainingDistance).toBe(6.0);
    });

    it('ignores measurements without the target zone value', () => {
      const goal = makeGoal({
        metricType: 'circumference',
        zone: 'waist',
        startValue: 95.0,
        targetValue: 85.0,
      });
      const measurements: WeeklyMeasurement[] = [
        makeWeeklyMeasurement('2024-01-01', { chest: 100.0 }), // no waist
        makeWeeklyMeasurement('2024-01-08', { waist: 92.0 }),
      ];
      const result = calculateProjection(goal, measurements);

      expect(result.currentValue).toBe(92.0);
    });
  });

  describe('bodyFat goals', () => {
    it('extracts bodyFat values from DailyMeasurement', () => {
      const goal = makeGoal({
        metricType: 'bodyFat',
        startValue: 25.0,
        targetValue: 20.0,
      });
      const measurements: DailyMeasurement[] = [
        makeDailyMeasurement('2024-01-10', undefined, 23.0),
        makeDailyMeasurement('2024-01-15', undefined, 22.0),
      ];
      const result = calculateProjection(goal, measurements);

      expect(result.currentValue).toBe(22.0);
      expect(result.remainingDistance).toBe(2.0);
      expect(result.percentComplete).toBe(60);
    });
  });

  describe('edge cases', () => {
    it('filters out measurements without relevant values', () => {
      const goal = makeGoal({ metricType: 'weight' });
      const measurements: DailyMeasurement[] = [
        makeDailyMeasurement('2024-01-10', undefined, 22.0), // no weight
        makeDailyMeasurement('2024-01-15', 87.0),
      ];
      const result = calculateProjection(goal, measurements);

      expect(result.currentValue).toBe(87.0);
    });

    it('handles goal where target > start (gaining weight)', () => {
      const goal = makeGoal({ startValue: 60, targetValue: 70 });
      const measurements: DailyMeasurement[] = [
        makeDailyMeasurement('2024-01-10', 63.0),
      ];
      const result = calculateProjection(goal, measurements);

      expect(result.remainingDistance).toBe(7.0);
      expect(result.percentComplete).toBe(30);
    });
  });
});


describe('goalService - evaluateGoals', () => {
  it('returns empty array when no active goals exist', async () => {
    const result = await evaluateGoals([], []);
    expect(result).toEqual([]);
  });

  it('marks a weight-loss goal as reached when currentValue <= targetValue', async () => {
    const goal = await createGoal(makeGoalInput({ startValue: 85, targetValue: 75 }));
    const measurements: DailyMeasurement[] = [
      makeDailyMeasurement('2024-01-10', 74.5),
    ];

    const evaluations = await evaluateGoals(measurements, []);

    expect(evaluations).toHaveLength(1);
    expect(evaluations[0].goalId).toBe(goal.id);
    expect(evaluations[0].previousStatus).toBe('active');
    expect(evaluations[0].newStatus).toBe('reached');
    expect(evaluations[0].justReached).toBe(true);

    // Verify the goal was actually updated in IndexedDB
    const updated = await getGoal(goal.id);
    expect(updated!.status).toBe('reached');
    expect(updated!.reachedAt).toBeTruthy();
  });

  it('marks a weight-loss goal as reached when currentValue equals targetValue exactly', async () => {
    const goal = await createGoal(makeGoalInput({ startValue: 85, targetValue: 75 }));
    const measurements: DailyMeasurement[] = [
      makeDailyMeasurement('2024-01-10', 75.0),
    ];

    const evaluations = await evaluateGoals(measurements, []);

    expect(evaluations[0].newStatus).toBe('reached');
    expect(evaluations[0].justReached).toBe(true);
  });

  it('does not mark goal as reached when target not yet met', async () => {
    const goal = await createGoal(makeGoalInput({ startValue: 85, targetValue: 75 }));
    const measurements: DailyMeasurement[] = [
      makeDailyMeasurement('2024-01-10', 80.0),
    ];

    const evaluations = await evaluateGoals(measurements, []);

    expect(evaluations).toHaveLength(1);
    expect(evaluations[0].goalId).toBe(goal.id);
    expect(evaluations[0].newStatus).toBe('active');
    expect(evaluations[0].justReached).toBe(false);

    // Goal should still be active in IndexedDB
    const unchanged = await getGoal(goal.id);
    expect(unchanged!.status).toBe('active');
  });

  it('handles gaining goals (targetValue > startValue)', async () => {
    const goal = await createGoal(makeGoalInput({ startValue: 60, targetValue: 70 }));
    const measurements: DailyMeasurement[] = [
      makeDailyMeasurement('2024-01-10', 71.0),
    ];

    const evaluations = await evaluateGoals(measurements, []);

    expect(evaluations[0].newStatus).toBe('reached');
    expect(evaluations[0].justReached).toBe(true);
  });

  it('handles bodyFat goals', async () => {
    const goal = await createGoal(makeGoalInput({
      metricType: 'bodyFat',
      startValue: 25,
      targetValue: 20,
    }));
    const measurements: DailyMeasurement[] = [
      makeDailyMeasurement('2024-01-10', undefined, 19.5),
    ];

    const evaluations = await evaluateGoals(measurements, []);

    expect(evaluations[0].newStatus).toBe('reached');
    expect(evaluations[0].justReached).toBe(true);
  });

  it('handles circumference goals using weekly measurements', async () => {
    const goal = await createGoal(makeGoalInput({
      metricType: 'circumference',
      zone: 'waist',
      startValue: 95,
      targetValue: 85,
    }));
    const weeklyMeasurements: WeeklyMeasurement[] = [
      makeWeeklyMeasurement('2024-01-01', { waist: 84.0 }),
    ];

    const evaluations = await evaluateGoals([], weeklyMeasurements);

    expect(evaluations[0].newStatus).toBe('reached');
    expect(evaluations[0].justReached).toBe(true);
  });

  it('uses the most recent measurement value', async () => {
    const goal = await createGoal(makeGoalInput({ startValue: 85, targetValue: 75 }));
    const measurements: DailyMeasurement[] = [
      makeDailyMeasurement('2024-01-05', 74.0), // older, below target
      makeDailyMeasurement('2024-01-10', 80.0), // newer, above target
    ];

    const evaluations = await evaluateGoals(measurements, []);

    // Should use the most recent (80.0), which is NOT below target
    expect(evaluations[0].newStatus).toBe('active');
    expect(evaluations[0].justReached).toBe(false);
  });

  it('returns justReached=false when no measurement data exists for the metric', async () => {
    await createGoal(makeGoalInput({ metricType: 'bodyFat', startValue: 25, targetValue: 20 }));
    // Only weight measurements, no bodyFat
    const measurements: DailyMeasurement[] = [
      makeDailyMeasurement('2024-01-10', 80.0),
    ];

    const evaluations = await evaluateGoals(measurements, []);

    expect(evaluations[0].justReached).toBe(false);
    expect(evaluations[0].newStatus).toBe('active');
  });

  it('evaluates multiple active goals independently', async () => {
    const goal1 = await createGoal(makeGoalInput({ startValue: 85, targetValue: 75 }));
    const goal2 = await createGoal(makeGoalInput({
      metricType: 'bodyFat',
      startValue: 25,
      targetValue: 20,
    }));

    const measurements: DailyMeasurement[] = [
      makeDailyMeasurement('2024-01-10', 74.0, 22.0), // weight reached, bodyFat not
    ];

    const evaluations = await evaluateGoals(measurements, []);

    expect(evaluations).toHaveLength(2);

    const eval1 = evaluations.find(e => e.goalId === goal1.id)!;
    const eval2 = evaluations.find(e => e.goalId === goal2.id)!;

    expect(eval1.justReached).toBe(true);
    expect(eval1.newStatus).toBe('reached');

    expect(eval2.justReached).toBe(false);
    expect(eval2.newStatus).toBe('active');
  });

  it('does not evaluate non-active goals', async () => {
    const goal = await createGoal(makeGoalInput({ startValue: 85, targetValue: 75 }));
    await updateGoalStatus(goal.id, 'archived');

    const measurements: DailyMeasurement[] = [
      makeDailyMeasurement('2024-01-10', 74.0),
    ];

    const evaluations = await evaluateGoals(measurements, []);

    // Archived goal should not be evaluated
    expect(evaluations).toHaveLength(0);
  });
});
