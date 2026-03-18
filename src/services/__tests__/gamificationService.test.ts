import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { resetDB } from '../db';
import {
  updateDailyStreak,
  updateWeeklyStreak,
  getStreaks,
  computeLevelInfo,
  evaluateMilestones,
  getAllAchievements,
  getEarnedMilestones,
  ACHIEVEMENT_DEFINITIONS,
  calculateConsistencyScore,
  detectNonScaleVictories,
  detectMicroWins,
} from '../gamificationService';
import type { Goal, Milestone, MilestoneContext, DailyMeasurement, WeeklyMeasurement } from '../../types';

beforeEach(() => {
  resetDB();
  indexedDB.deleteDatabase('fitness-tracker');
});

describe('gamificationService - getStreaks', () => {
  it('returns default zeroed streaks when no data exists', async () => {
    const streaks = await getStreaks();
    expect(streaks.dailyStreak).toBe(0);
    expect(streaks.dailyLastDate).toBeNull();
    expect(streaks.weeklyStreak).toBe(0);
    expect(streaks.weeklyLastDate).toBeNull();
  });
});

describe('gamificationService - updateDailyStreak', () => {
  it('starts streak at 1 on first measurement', async () => {
    const result = await updateDailyStreak('2024-01-15');
    expect(result.currentStreak).toBe(1);
    expect(result.isNewRecord).toBe(true);
    expect(result.thresholdReached).toBeNull();
  });

  it('increments streak on consecutive days', async () => {
    await updateDailyStreak('2024-01-15');
    const result = await updateDailyStreak('2024-01-16');
    expect(result.currentStreak).toBe(2);
    expect(result.isNewRecord).toBe(true);
  });

  it('resets streak to 1 on gap', async () => {
    await updateDailyStreak('2024-01-15');
    await updateDailyStreak('2024-01-16');
    const result = await updateDailyStreak('2024-01-19'); // 2-day gap
    expect(result.currentStreak).toBe(1);
    expect(result.isNewRecord).toBe(false);
  });

  it('is idempotent for same date', async () => {
    await updateDailyStreak('2024-01-15');
    const result = await updateDailyStreak('2024-01-15');
    expect(result.currentStreak).toBe(1);
    expect(result.isNewRecord).toBe(false);
  });

  it('detects 7-day threshold', async () => {
    for (let i = 1; i <= 6; i++) {
      await updateDailyStreak(`2024-01-${String(i).padStart(2, '0')}`);
    }
    const result = await updateDailyStreak('2024-01-07');
    expect(result.currentStreak).toBe(7);
    expect(result.thresholdReached).toBe(7);
  });

  it('returns null threshold for non-threshold counts', async () => {
    for (let i = 1; i <= 5; i++) {
      await updateDailyStreak(`2024-01-${String(i).padStart(2, '0')}`);
    }
    const result = await updateDailyStreak('2024-01-06');
    expect(result.currentStreak).toBe(6);
    expect(result.thresholdReached).toBeNull();
  });

  it('persists streak data to IndexedDB', async () => {
    await updateDailyStreak('2024-01-15');
    await updateDailyStreak('2024-01-16');
    const streaks = await getStreaks();
    expect(streaks.dailyStreak).toBe(2);
    expect(streaks.dailyLastDate).toBe('2024-01-16');
  });
});

describe('gamificationService - updateWeeklyStreak', () => {
  it('starts streak at 1 on first measurement', async () => {
    const result = await updateWeeklyStreak('2024-01-15');
    expect(result.currentStreak).toBe(1);
    expect(result.isNewRecord).toBe(true);
    expect(result.thresholdReached).toBeNull();
  });

  it('increments streak on consecutive weeks', async () => {
    await updateWeeklyStreak('2024-01-15');
    const result = await updateWeeklyStreak('2024-01-22'); // +7 days
    expect(result.currentStreak).toBe(2);
    expect(result.isNewRecord).toBe(true);
  });

  it('resets streak to 1 on gap', async () => {
    await updateWeeklyStreak('2024-01-15');
    await updateWeeklyStreak('2024-01-22');
    const result = await updateWeeklyStreak('2024-02-05'); // 1-week gap
    expect(result.currentStreak).toBe(1);
    expect(result.isNewRecord).toBe(false);
  });

  it('is idempotent for same week', async () => {
    await updateWeeklyStreak('2024-01-15');
    const result = await updateWeeklyStreak('2024-01-15');
    expect(result.currentStreak).toBe(1);
    expect(result.isNewRecord).toBe(false);
  });

  it('detects 4-week threshold', async () => {
    await updateWeeklyStreak('2024-01-01');
    await updateWeeklyStreak('2024-01-08');
    await updateWeeklyStreak('2024-01-15');
    const result = await updateWeeklyStreak('2024-01-22');
    expect(result.currentStreak).toBe(4);
    expect(result.thresholdReached).toBe(4);
  });

  it('returns null threshold for non-threshold counts', async () => {
    await updateWeeklyStreak('2024-01-01');
    await updateWeeklyStreak('2024-01-08');
    const result = await updateWeeklyStreak('2024-01-15');
    expect(result.currentStreak).toBe(3);
    expect(result.thresholdReached).toBeNull();
  });

  it('persists streak data to IndexedDB', async () => {
    await updateWeeklyStreak('2024-01-15');
    await updateWeeklyStreak('2024-01-22');
    const streaks = await getStreaks();
    expect(streaks.weeklyStreak).toBe(2);
    expect(streaks.weeklyLastDate).toBe('2024-01-22');
  });
});


function makeDailyMeasurement(date: string): DailyMeasurement {
  return { date, weight: 80, source: 'manual', updatedAt: new Date().toISOString() };
}

describe('gamificationService - calculateConsistencyScore', () => {
  // Week starting Monday 2024-01-15 (Mon) through 2024-01-21 (Sun)
  const weekStart = '2024-01-15';

  it('returns score 0 when no measurements and no weekly', () => {
    const result = calculateConsistencyScore(weekStart, [], false);
    expect(result.score).toBe(0);
    expect(result.daysLogged).toBe(0);
    expect(result.weeklyCompleted).toBe(false);
    expect(result.weekStart).toBe(weekStart);
  });

  it('returns score 100 when all 7 days logged and weekly completed', () => {
    const measurements = [
      makeDailyMeasurement('2024-01-15'),
      makeDailyMeasurement('2024-01-16'),
      makeDailyMeasurement('2024-01-17'),
      makeDailyMeasurement('2024-01-18'),
      makeDailyMeasurement('2024-01-19'),
      makeDailyMeasurement('2024-01-20'),
      makeDailyMeasurement('2024-01-21'),
    ];
    const result = calculateConsistencyScore(weekStart, measurements, true);
    expect(result.score).toBe(100);
    expect(result.daysLogged).toBe(7);
    expect(result.weeklyCompleted).toBe(true);
  });

  it('returns score 30 when no daily but weekly completed', () => {
    const result = calculateConsistencyScore(weekStart, [], true);
    expect(result.score).toBe(30);
    expect(result.daysLogged).toBe(0);
  });

  it('returns score 70 when all 7 days logged but no weekly', () => {
    const measurements = Array.from({ length: 7 }, (_, i) =>
      makeDailyMeasurement(`2024-01-${String(15 + i).padStart(2, '0')}`)
    );
    const result = calculateConsistencyScore(weekStart, measurements, false);
    expect(result.score).toBe(70);
    expect(result.daysLogged).toBe(7);
  });

  it('counts only days within the given week', () => {
    const measurements = [
      makeDailyMeasurement('2024-01-14'), // Sunday before — outside week
      makeDailyMeasurement('2024-01-15'), // Monday — in week
      makeDailyMeasurement('2024-01-22'), // Monday next week — outside
    ];
    const result = calculateConsistencyScore(weekStart, measurements, false);
    expect(result.daysLogged).toBe(1);
    expect(result.score).toBe(Math.round((1 / 7) * 70));
  });

  it('calculates partial score correctly for 3 days + weekly', () => {
    const measurements = [
      makeDailyMeasurement('2024-01-15'),
      makeDailyMeasurement('2024-01-17'),
      makeDailyMeasurement('2024-01-19'),
    ];
    const result = calculateConsistencyScore(weekStart, measurements, true);
    expect(result.daysLogged).toBe(3);
    expect(result.score).toBe(Math.round((3 / 7) * 70 + 30));
  });

  it('score is always in range [0, 100]', () => {
    // With max inputs
    const maxMeasurements = Array.from({ length: 7 }, (_, i) =>
      makeDailyMeasurement(`2024-01-${String(15 + i).padStart(2, '0')}`)
    );
    const maxResult = calculateConsistencyScore(weekStart, maxMeasurements, true);
    expect(maxResult.score).toBeGreaterThanOrEqual(0);
    expect(maxResult.score).toBeLessThanOrEqual(100);

    // With min inputs
    const minResult = calculateConsistencyScore(weekStart, [], false);
    expect(minResult.score).toBeGreaterThanOrEqual(0);
    expect(minResult.score).toBeLessThanOrEqual(100);
  });
});

function makeDailyWithWeight(date: string, weight: number, bodyFat?: number): DailyMeasurement {
  return { date, weight, bodyFat, source: 'manual', updatedAt: new Date().toISOString() };
}

function makeWeekly(date: string, overrides: Partial<WeeklyMeasurement> = {}): WeeklyMeasurement {
  return { date, updatedAt: new Date().toISOString(), ...overrides };
}

/** Helper: get a YYYY-MM-DD string for N days ago from today */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

describe('gamificationService - detectNonScaleVictories', () => {
  it('returns empty array when no measurements', () => {
    const result = detectNonScaleVictories([], []);
    expect(result).toEqual([]);
  });

  it('returns empty array when insufficient daily data (only 1 weight entry)', () => {
    const daily = [makeDailyWithWeight(daysAgo(5), 80)];
    const weekly = [
      makeWeekly(daysAgo(10), { waist: 90 }),
      makeWeekly(daysAgo(3), { waist: 88 }),
    ];
    const result = detectNonScaleVictories(daily, weekly);
    expect(result).toEqual([]);
  });

  it('detects circumference NSV when weight is stable and waist decreased > 0.5 cm', () => {
    const daily = [
      makeDailyWithWeight(daysAgo(13), 80.0),
      makeDailyWithWeight(daysAgo(1), 80.1),
    ];
    const weekly = [
      makeWeekly(daysAgo(12), { waist: 90 }),
      makeWeekly(daysAgo(2), { waist: 89 }),
    ];
    const result = detectNonScaleVictories(daily, weekly);
    expect(result.length).toBe(1);
    expect(result[0].metric).toBe('waist');
    expect(result[0].message).toContain('Taille');
    expect(result[0].message).toContain('1 cm');
    expect(result[0].message).toContain('geschrumpft');
  });

  it('does NOT detect circumference NSV when weight changed >= 0.3 kg', () => {
    const daily = [
      makeDailyWithWeight(daysAgo(13), 80.0),
      makeDailyWithWeight(daysAgo(1), 80.5),
    ];
    const weekly = [
      makeWeekly(daysAgo(12), { waist: 90 }),
      makeWeekly(daysAgo(2), { waist: 89 }),
    ];
    const result = detectNonScaleVictories(daily, weekly);
    expect(result).toEqual([]);
  });

  it('does NOT detect circumference NSV when zone decreased <= 0.5 cm', () => {
    const daily = [
      makeDailyWithWeight(daysAgo(13), 80.0),
      makeDailyWithWeight(daysAgo(1), 80.1),
    ];
    const weekly = [
      makeWeekly(daysAgo(12), { waist: 90 }),
      makeWeekly(daysAgo(2), { waist: 89.5 }),
    ];
    const result = detectNonScaleVictories(daily, weekly);
    expect(result).toEqual([]);
  });

  it('detects multiple circumference zone NSVs', () => {
    const daily = [
      makeDailyWithWeight(daysAgo(13), 80.0),
      makeDailyWithWeight(daysAgo(1), 80.0),
    ];
    const weekly = [
      makeWeekly(daysAgo(12), { waist: 90, chest: 100, hip: 95 }),
      makeWeekly(daysAgo(2), { waist: 89, chest: 99, hip: 94 }),
    ];
    const result = detectNonScaleVictories(daily, weekly);
    expect(result.length).toBe(3);
    const metrics = result.map((v) => v.metric);
    expect(metrics).toContain('chest');
    expect(metrics).toContain('waist');
    expect(metrics).toContain('hip');
  });

  it('detects body fat NSV when body fat dropped > 0.5%', () => {
    const daily = [
      makeDailyWithWeight(daysAgo(13), 80.0, 25.0),
      makeDailyWithWeight(daysAgo(1), 80.0, 24.0),
    ];
    const result = detectNonScaleVictories(daily, []);
    expect(result.length).toBe(1);
    expect(result[0].metric).toBe('bodyFat');
    expect(result[0].message).toContain('Körperfettanteil');
    expect(result[0].message).toContain('1%');
    expect(result[0].message).toContain('gesunken');
  });

  it('does NOT detect body fat NSV when drop <= 0.5%', () => {
    const daily = [
      makeDailyWithWeight(daysAgo(13), 80.0, 25.0),
      makeDailyWithWeight(daysAgo(1), 80.0, 24.5),
    ];
    const result = detectNonScaleVictories(daily, []);
    expect(result).toEqual([]);
  });

  it('detects body fat NSV regardless of weight change', () => {
    const daily = [
      makeDailyWithWeight(daysAgo(13), 80.0, 25.0),
      makeDailyWithWeight(daysAgo(1), 85.0, 24.0),
    ];
    const result = detectNonScaleVictories(daily, []);
    expect(result.length).toBe(1);
    expect(result[0].metric).toBe('bodyFat');
  });

  it('ignores measurements older than 14 days', () => {
    const daily = [
      makeDailyWithWeight(daysAgo(20), 80.0, 25.0),
      makeDailyWithWeight(daysAgo(1), 80.0, 24.0),
    ];
    // Only 1 measurement within 14-day window → insufficient for body fat check
    const result = detectNonScaleVictories(daily, []);
    expect(result).toEqual([]);
  });

  it('can detect both circumference and body fat NSVs simultaneously', () => {
    const daily = [
      makeDailyWithWeight(daysAgo(13), 80.0, 25.0),
      makeDailyWithWeight(daysAgo(1), 80.1, 24.0),
    ];
    const weekly = [
      makeWeekly(daysAgo(12), { waist: 90 }),
      makeWeekly(daysAgo(2), { waist: 88 }),
    ];
    const result = detectNonScaleVictories(daily, weekly);
    expect(result.length).toBe(2);
    const metrics = result.map((v) => v.metric);
    expect(metrics).toContain('waist');
    expect(metrics).toContain('bodyFat');
  });

  it('sets detectedAt to today', () => {
    const today = new Date().toISOString().split('T')[0];
    const daily = [
      makeDailyWithWeight(daysAgo(13), 80.0, 25.0),
      makeDailyWithWeight(daysAgo(1), 80.0, 24.0),
    ];
    const result = detectNonScaleVictories(daily, []);
    expect(result[0].detectedAt).toBe(today);
  });
});


// ─── computeLevelInfo Tests ──────────────────────────────────────────

/** Helper: create a Goal object for testing */
function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'test-goal-1',
    metricType: 'weight',
    startValue: 90,
    targetValue: 75,
    createdAt: '2024-01-01T00:00:00Z',
    status: 'active',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('gamificationService - computeLevelInfo', () => {
  // --- Level count based on distance ---

  describe('level count based on distance', () => {
    it('returns 3 levels when distance < 6 (weight)', () => {
      const goal = makeGoal({ startValue: 80, targetValue: 75 }); // distance = 5
      const result = computeLevelInfo(goal, 80);
      expect(result.totalLevels).toBe(3);
    });

    it('returns 4 levels when distance >= 6 and < 12 (weight)', () => {
      const goal = makeGoal({ startValue: 85, targetValue: 75 }); // distance = 10
      const result = computeLevelInfo(goal, 85);
      expect(result.totalLevels).toBe(4);
    });

    it('returns 5 levels when distance >= 12 (weight)', () => {
      const goal = makeGoal({ startValue: 90, targetValue: 75 }); // distance = 15
      const result = computeLevelInfo(goal, 90);
      expect(result.totalLevels).toBe(5);
    });
  });

  // --- Level determination ---

  describe('level determination', () => {
    it('returns level 1 at start value', () => {
      const goal = makeGoal({ startValue: 90, targetValue: 75 }); // 15 distance, 5 levels, step=3
      const result = computeLevelInfo(goal, 90);
      expect(result.level).toBe(1);
    });

    it('returns correct level mid-progress (weight loss)', () => {
      const goal = makeGoal({ startValue: 90, targetValue: 75 }); // 15 distance, 5 levels, step=3
      // At 84 kg: progress = 6, level = floor(6/3)+1 = 3
      const result = computeLevelInfo(goal, 84);
      expect(result.level).toBe(3);
    });

    it('returns highest level when target reached', () => {
      const goal = makeGoal({ startValue: 90, targetValue: 75 });
      const result = computeLevelInfo(goal, 75);
      expect(result.level).toBe(5);
      expect(result.totalLevels).toBe(5);
    });

    it('returns highest level when target exceeded (weight loss overshooting)', () => {
      const goal = makeGoal({ startValue: 90, targetValue: 75 });
      const result = computeLevelInfo(goal, 70); // overshot by 5 kg
      expect(result.level).toBe(5);
    });

    it('clamps to level 1 when current value is beyond start (wrong direction)', () => {
      const goal = makeGoal({ startValue: 90, targetValue: 75 });
      const result = computeLevelInfo(goal, 95); // went up instead of down
      expect(result.level).toBe(1);
    });
  });

  // --- Level progress ---

  describe('level progress', () => {
    it('returns 0% progress at start of a level', () => {
      const goal = makeGoal({ startValue: 90, targetValue: 75 }); // step=3
      // At 90 kg: progress=0, level=1, progressInLevel=0
      const result = computeLevelInfo(goal, 90);
      expect(result.levelProgress).toBe(0);
    });

    it('returns ~50% progress mid-level', () => {
      const goal = makeGoal({ startValue: 90, targetValue: 75 }); // step=3
      // At 88.5 kg: progress=1.5, level=1, progressInLevel=1.5, levelProgress=50%
      const result = computeLevelInfo(goal, 88.5);
      expect(result.levelProgress).toBeCloseTo(50, 0);
    });

    it('returns 100% overall progress when target reached', () => {
      const goal = makeGoal({ startValue: 90, targetValue: 75 });
      const result = computeLevelInfo(goal, 75);
      expect(result.overallProgress).toBe(100);
    });

    it('returns 0% overall progress at start', () => {
      const goal = makeGoal({ startValue: 90, targetValue: 75 });
      const result = computeLevelInfo(goal, 90);
      expect(result.overallProgress).toBe(0);
    });

    it('clamps overall progress to [0, 100]', () => {
      const goal = makeGoal({ startValue: 90, targetValue: 75 });
      // Overshot target
      const result = computeLevelInfo(goal, 70);
      expect(result.overallProgress).toBe(100);
      // Wrong direction
      const result2 = computeLevelInfo(goal, 95);
      expect(result2.overallProgress).toBe(0);
    });
  });

  // --- Absolute text ---

  describe('absolute text', () => {
    it('shows correct unit for weight goals (kg)', () => {
      const goal = makeGoal({ metricType: 'weight', startValue: 90, targetValue: 75 });
      const result = computeLevelInfo(goal, 85);
      expect(result.absoluteText).toContain('kg');
      expect(result.absoluteText).toContain('erreicht');
    });

    it('shows correct unit for bodyFat goals (%)', () => {
      const goal = makeGoal({ metricType: 'bodyFat', startValue: 25, targetValue: 20 });
      const result = computeLevelInfo(goal, 23);
      expect(result.absoluteText).toContain('%');
      expect(result.absoluteText).toContain('erreicht');
    });

    it('shows correct unit for circumference goals (cm)', () => {
      const goal = makeGoal({
        metricType: 'circumference',
        zone: 'waist',
        startValue: 95,
        targetValue: 85,
      });
      const result = computeLevelInfo(goal, 90);
      expect(result.absoluteText).toContain('cm');
      expect(result.absoluteText).toContain('erreicht');
    });

    it('shows correct progress values in text', () => {
      const goal = makeGoal({ startValue: 90, targetValue: 75 }); // distance=15
      // At 82 kg: progress = 8
      const result = computeLevelInfo(goal, 82);
      expect(result.absoluteText).toBe('8 / 15 kg erreicht');
    });
  });

  // --- Degenerate case: startValue === targetValue ---

  describe('degenerate case: startValue === targetValue', () => {
    it('returns safe defaults when start equals target', () => {
      const goal = makeGoal({ startValue: 80, targetValue: 80 });
      const result = computeLevelInfo(goal, 80);
      expect(result.level).toBe(1);
      expect(result.totalLevels).toBe(1);
      expect(result.levelProgress).toBe(100);
      expect(result.overallProgress).toBe(100);
      expect(result.absoluteText).toBe('0 / 0 kg erreicht');
    });
  });

  // --- Increasing direction (gaining weight/circumference) ---

  describe('increasing direction goals', () => {
    it('handles goals where target > start (gaining)', () => {
      const goal = makeGoal({ startValue: 60, targetValue: 75 }); // distance=15, 5 levels, step=3
      const result = computeLevelInfo(goal, 66); // progress=6, level=3
      expect(result.level).toBe(3);
      expect(result.totalLevels).toBe(5);
      expect(result.absoluteText).toBe('6 / 15 kg erreicht');
    });

    it('returns highest level when target exceeded (gaining)', () => {
      const goal = makeGoal({ startValue: 60, targetValue: 75 });
      const result = computeLevelInfo(goal, 80);
      expect(result.level).toBe(5);
      expect(result.overallProgress).toBe(100);
    });
  });

  // --- Determinism ---

  describe('determinism', () => {
    it('returns identical results for identical inputs', () => {
      const goal = makeGoal({ startValue: 90, targetValue: 75 });
      const result1 = computeLevelInfo(goal, 82);
      const result2 = computeLevelInfo(goal, 82);
      expect(result1).toEqual(result2);
    });
  });

  // --- bodyFat metric ---

  describe('bodyFat metric', () => {
    it('calculates levels correctly for bodyFat (small distance)', () => {
      const goal = makeGoal({ metricType: 'bodyFat', startValue: 25, targetValue: 20 }); // distance=5, 3 levels
      const result = computeLevelInfo(goal, 22);
      expect(result.totalLevels).toBe(3);
      expect(result.absoluteText).toContain('%');
    });
  });

  // --- circumference metric ---

  describe('circumference metric', () => {
    it('calculates levels correctly for circumference', () => {
      const goal = makeGoal({
        metricType: 'circumference',
        zone: 'waist',
        startValue: 100,
        targetValue: 85,
      }); // distance=15, 5 levels
      const result = computeLevelInfo(goal, 91);
      expect(result.totalLevels).toBe(5);
      expect(result.absoluteText).toContain('cm');
      // progress = 9, step = 3, level = floor(9/3)+1 = 4
      expect(result.level).toBe(4);
    });
  });
});


// ─── evaluateMilestones Tests ──────────────────────────────────────────

/** Helper: create a default MilestoneContext */
function makeContext(overrides: Partial<MilestoneContext> = {}): MilestoneContext {
  return {
    goals: [],
    streaks: {
      dailyStreak: 0,
      dailyLastDate: null,
      weeklyStreak: 0,
      weeklyLastDate: null,
      updatedAt: new Date().toISOString(),
    },
    dailyMeasurements: [],
    weeklyMeasurements: [],
    earnedMilestones: [],
    ...overrides,
  };
}

/** Helper: create a DailyMeasurement with weight */
function makeDaily(date: string, weight: number): DailyMeasurement {
  return { date, weight, source: 'manual', updatedAt: new Date().toISOString() };
}

/** Helper: create a Milestone for earned list */
function makeEarnedMilestone(type: string): Milestone {
  return {
    id: `earned-${type}`,
    type: type as any,
    label: type,
    earnedAt: '2024-01-01',
    notified: true,
  };
}

describe('gamificationService - evaluateMilestones', () => {
  describe('weight-loss milestones', () => {
    it('awards weight-loss-2kg when loss >= 2 kg', async () => {
      const ctx = makeContext({
        dailyMeasurements: [makeDaily('2024-01-01', 80), makeDaily('2024-02-01', 77.5)],
      });
      const result = await evaluateMilestones(ctx);
      expect(result.some((m) => m.type === 'weight-loss-2kg')).toBe(true);
    });

    it('awards weight-loss-5kg when loss >= 5 kg', async () => {
      const ctx = makeContext({
        dailyMeasurements: [makeDaily('2024-01-01', 80), makeDaily('2024-02-01', 74)],
      });
      const result = await evaluateMilestones(ctx);
      expect(result.some((m) => m.type === 'weight-loss-5kg')).toBe(true);
    });

    it('awards weight-loss-10kg when loss >= 10 kg', async () => {
      const ctx = makeContext({
        dailyMeasurements: [makeDaily('2024-01-01', 90), makeDaily('2024-06-01', 79)],
      });
      const result = await evaluateMilestones(ctx);
      expect(result.some((m) => m.type === 'weight-loss-10kg')).toBe(true);
    });

    it('does NOT award weight-loss-2kg when loss < 2 kg', async () => {
      const ctx = makeContext({
        dailyMeasurements: [makeDaily('2024-01-01', 80), makeDaily('2024-02-01', 78.5)],
      });
      const result = await evaluateMilestones(ctx);
      expect(result.some((m) => m.type === 'weight-loss-2kg')).toBe(false);
    });
  });

  describe('first-goal-reached milestone', () => {
    it('awards first-goal-reached when a goal has status reached', async () => {
      const ctx = makeContext({
        goals: [makeGoal({ status: 'reached' })],
      });
      const result = await evaluateMilestones(ctx);
      expect(result.some((m) => m.type === 'first-goal-reached')).toBe(true);
    });

    it('does NOT award first-goal-reached when no goal is reached', async () => {
      const ctx = makeContext({
        goals: [makeGoal({ status: 'active' })],
      });
      const result = await evaluateMilestones(ctx);
      expect(result.some((m) => m.type === 'first-goal-reached')).toBe(false);
    });
  });

  describe('daily entry milestones', () => {
    it('awards daily-entries-3 when dailyMeasurements.length >= 3', async () => {
      const ctx = makeContext({
        dailyMeasurements: Array.from({ length: 3 }, (_, i) => makeDaily(`2024-01-0${i + 1}`, 80)),
      });
      const result = await evaluateMilestones(ctx);
      expect(result.some((m) => m.type === 'daily-entries-3')).toBe(true);
    });

    it('awards daily-entries-7 when dailyMeasurements.length >= 7', async () => {
      const ctx = makeContext({
        dailyMeasurements: Array.from({ length: 7 }, (_, i) => makeDaily(`2024-01-${String(i + 1).padStart(2, '0')}`, 80)),
      });
      const result = await evaluateMilestones(ctx);
      expect(result.some((m) => m.type === 'daily-entries-7')).toBe(true);
    });

    it('does NOT award daily-entries-7 when dailyMeasurements.length < 7', async () => {
      const ctx = makeContext({
        dailyMeasurements: Array.from({ length: 6 }, (_, i) => makeDaily(`2024-01-0${i + 1}`, 80)),
      });
      const result = await evaluateMilestones(ctx);
      expect(result.some((m) => m.type === 'daily-entries-7')).toBe(false);
    });
  });

  describe('weekly entry milestones', () => {
    it('awards weekly-entries-3 when weeklyMeasurements.length >= 3', async () => {
      const weekly = Array.from({ length: 3 }, (_, i) => ({
        date: `2024-01-${String((i + 1) * 7).padStart(2, '0')}`,
        updatedAt: new Date().toISOString(),
      })) as WeeklyMeasurement[];
      const ctx = makeContext({ weeklyMeasurements: weekly });
      const result = await evaluateMilestones(ctx);
      expect(result.some((m) => m.type === 'weekly-entries-3')).toBe(true);
    });

    it('awards weekly-entries-10 when weeklyMeasurements.length >= 10', async () => {
      const weekly = Array.from({ length: 10 }, (_, i) => ({
        date: `2024-${String(Math.floor(i / 4) + 1).padStart(2, '0')}-${String((i % 4 + 1) * 7).padStart(2, '0')}`,
        updatedAt: new Date().toISOString(),
      })) as WeeklyMeasurement[];
      const ctx = makeContext({ weeklyMeasurements: weekly });
      const result = await evaluateMilestones(ctx);
      expect(result.some((m) => m.type === 'weekly-entries-10')).toBe(true);
    });

    it('does NOT award weekly-entries-3 when weeklyMeasurements.length < 3', async () => {
      const weekly = Array.from({ length: 2 }, (_, i) => ({
        date: `2024-01-${String((i + 1) * 7).padStart(2, '0')}`,
        updatedAt: new Date().toISOString(),
      })) as WeeklyMeasurement[];
      const ctx = makeContext({ weeklyMeasurements: weekly });
      const result = await evaluateMilestones(ctx);
      expect(result.some((m) => m.type === 'weekly-entries-3')).toBe(false);
    });
  });

  describe('deduplication', () => {
    it('does NOT re-award already earned milestones', async () => {
      const ctx = makeContext({
        dailyMeasurements: [makeDaily('2024-01-01', 80), makeDaily('2024-02-01', 74)],
        earnedMilestones: [makeEarnedMilestone('weight-loss-2kg'), makeEarnedMilestone('weight-loss-5kg')],
      });
      const result = await evaluateMilestones(ctx);
      expect(result.some((m) => m.type === 'weight-loss-2kg')).toBe(false);
      expect(result.some((m) => m.type === 'weight-loss-5kg')).toBe(false);
    });
  });

  describe('persistence', () => {
    it('persists new milestones to IndexedDB', async () => {
      const ctx = makeContext({
        dailyMeasurements: [makeDaily('2024-01-01', 80), makeDaily('2024-02-01', 77)],
      });
      await evaluateMilestones(ctx);
      const earned = await getEarnedMilestones();
      expect(earned.some((m) => m.type === 'weight-loss-2kg')).toBe(true);
    });
  });
});

// ─── getAllAchievements Tests ──────────────────────────────────────────

describe('gamificationService - getAllAchievements', () => {
  it('returns all achievement definitions with locked status when no milestones earned', async () => {
    const achievements = await getAllAchievements();
    expect(achievements.length).toBe(ACHIEVEMENT_DEFINITIONS.length);
    expect(achievements.every((a) => a.status === 'locked')).toBe(true);
    expect(achievements.every((a) => a.earnedAt === undefined)).toBe(true);
  });

  it('merges earned status from IndexedDB', async () => {
    // First earn a milestone
    const ctx = makeContext({
      dailyMeasurements: [makeDaily('2024-01-01', 80), makeDaily('2024-02-01', 77)],
    });
    await evaluateMilestones(ctx);

    const achievements = await getAllAchievements();
    const weightLoss2kg = achievements.find((a) => a.definition.id === 'weight-loss-2kg');
    expect(weightLoss2kg?.status).toBe('earned');
    expect(weightLoss2kg?.earnedAt).toBeDefined();
  });

  it('returns correct count matching ACHIEVEMENT_DEFINITIONS', async () => {
    const achievements = await getAllAchievements();
    expect(achievements.length).toBe(10);
  });

  it('has unique ids for all achievements', async () => {
    const achievements = await getAllAchievements();
    const ids = achievements.map((a) => a.definition.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all achievements have valid category', async () => {
    const achievements = await getAllAchievements();
    expect(achievements.every((a) => ['progress', 'streak'].includes(a.definition.category))).toBe(true);
  });
});


// ─── Property-Based Tests ──────────────────────────────────────────
import fc from 'fast-check';

// Feature: gamification-restructure, Property 5: Gewichtsverlust-Achievements bei Schwellenwert
describe('Property 5: Weight-loss achievements at threshold', () => {
  /** Validates: Requirements 5.1, 5.2, 5.3 */
  it('awards weight-loss milestone when cumulative loss >= threshold', async () => {
    const thresholds: Array<{ threshold: number; type: string }> = [
      { threshold: 2, type: 'weight-loss-2kg' },
      { threshold: 5, type: 'weight-loss-5kg' },
      { threshold: 10, type: 'weight-loss-10kg' },
    ];

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 2 }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(50), noNaN: true }),
        async (thresholdIdx, extraLoss) => {
          resetDB();
          indexedDB.deleteDatabase('fitness-tracker');

          const { threshold, type } = thresholds[thresholdIdx];
          const startWeight = 100;
          const loss = threshold + Math.abs(extraLoss);
          const endWeight = startWeight - loss;

          const ctx = makeContext({
            dailyMeasurements: [
              makeDaily('2024-01-01', startWeight),
              makeDaily('2024-06-01', endWeight),
            ],
            earnedMilestones: [],
          });

          const result = await evaluateMilestones(ctx);
          expect(result.some((m) => m.type === type)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: gamification-restructure, Property 6: Erstes-Ziel-erreicht-Achievement
describe('Property 6: First-goal-reached achievement', () => {
  /** Validates: Requirements 5.4 */
  it('awards first-goal-reached when at least one goal has status reached', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            status: fc.constantFrom('active' as const, 'reached' as const, 'archived' as const),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (goalStatuses) => {
          resetDB();
          indexedDB.deleteDatabase('fitness-tracker');

          const hasReached = goalStatuses.some((g) => g.status === 'reached');
          const goals = goalStatuses.map((g, i) =>
            makeGoal({ id: `goal-${i}`, status: g.status })
          );

          const ctx = makeContext({ goals, earnedMilestones: [] });
          const result = await evaluateMilestones(ctx);
          const awarded = result.some((m) => m.type === 'first-goal-reached');

          if (hasReached) {
            expect(awarded).toBe(true);
          } else {
            expect(awarded).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: gamification-restructure, Property 7: Entry-Achievements bei Schwellenwert
describe('Property 7: Entry achievements at threshold', () => {
  /** Validates: Requirements 6.1, 6.2, 6.3, 6.4 */
  it('awards entry milestone when measurement count >= threshold', async () => {
    const dailyThresholds = [
      { threshold: 3, type: 'daily-entries-3' },
      { threshold: 7, type: 'daily-entries-7' },
      { threshold: 14, type: 'daily-entries-14' },
      { threshold: 30, type: 'daily-entries-30' },
    ];
    const weeklyThresholds = [
      { threshold: 3, type: 'weekly-entries-3' },
      { threshold: 10, type: 'weekly-entries-10' },
    ];

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 50 }),
        fc.integer({ min: 0, max: 20 }),
        async (dailyCount, weeklyCount) => {
          resetDB();
          indexedDB.deleteDatabase('fitness-tracker');

          const dailyMeasurements = Array.from({ length: dailyCount }, (_, i) =>
            makeDaily(`2024-${String(Math.floor(i / 28) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`, 80)
          );
          const weeklyMeasurements = Array.from({ length: weeklyCount }, (_, i) => ({
            date: `2024-${String(Math.floor(i / 4) + 1).padStart(2, '0')}-${String((i % 4 + 1) * 7).padStart(2, '0')}`,
            updatedAt: new Date().toISOString(),
          })) as WeeklyMeasurement[];

          const ctx = makeContext({
            dailyMeasurements,
            weeklyMeasurements,
            earnedMilestones: [],
          });

          const result = await evaluateMilestones(ctx);

          for (const { threshold, type } of dailyThresholds) {
            if (dailyCount >= threshold) {
              expect(result.some((m) => m.type === type)).toBe(true);
            }
          }
          for (const { threshold, type } of weeklyThresholds) {
            if (weeklyCount >= threshold) {
              expect(result.some((m) => m.type === type)).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: gamification-restructure, Property 8: Achievement-Deduplizierung (Idempotenz)
describe('Property 8: Achievement deduplication (idempotency)', () => {
  /** Validates: Requirements 5.5, 6.6 */
  it('does NOT return already earned milestones', async () => {
    const allTypes = [
      'first-goal-reached', 'weight-loss-2kg', 'weight-loss-5kg', 'weight-loss-10kg',
      'daily-entries-3', 'daily-entries-7', 'daily-entries-14', 'daily-entries-30',
      'weekly-entries-3', 'weekly-entries-10',
    ] as const;

    await fc.assert(
      fc.asyncProperty(
        fc.subarray([...allTypes], { minLength: 1 }),
        async (earnedTypes) => {
          resetDB();
          indexedDB.deleteDatabase('fitness-tracker');

          const earnedMilestones = earnedTypes.map((type) => makeEarnedMilestone(type));

          // Create a context that would trigger all milestones
          const ctx = makeContext({
            goals: [makeGoal({ status: 'reached' })],
            dailyMeasurements: Array.from({ length: 30 }, (_, i) =>
              makeDaily(`2024-${String(Math.floor(i / 28) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`, 100 - i * 0.5)
            ),
            weeklyMeasurements: Array.from({ length: 10 }, (_, i) => ({
              date: `2024-${String(Math.floor(i / 4) + 1).padStart(2, '0')}-${String((i % 4 + 1) * 7).padStart(2, '0')}`,
              updatedAt: new Date().toISOString(),
            })) as WeeklyMeasurement[],
            earnedMilestones,
          });

          const result = await evaluateMilestones(ctx);

          // None of the already earned types should appear in the result
          for (const type of earnedTypes) {
            expect(result.some((m) => m.type === type)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: gamification-restructure, Property 9: Entry-Achievements bleiben erhalten
describe('Property 9: Entry achievements persist', () => {
  /** Validates: Requirements 6.5 */
  it('earned entry achievements remain earned', async () => {
    const entryTypes = [
      'daily-entries-3', 'daily-entries-7', 'daily-entries-14', 'daily-entries-30',
      'weekly-entries-3', 'weekly-entries-10',
    ] as const;

    await fc.assert(
      fc.asyncProperty(
        fc.subarray([...entryTypes], { minLength: 1 }),
        async (earnedEntryTypes) => {
          resetDB();
          indexedDB.deleteDatabase('fitness-tracker');

          // First, earn the milestones by providing enough measurements
          const ctx = makeContext({
            dailyMeasurements: Array.from({ length: 30 }, (_, i) =>
              makeDaily(`2024-${String(Math.floor(i / 28) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`, 80)
            ),
            weeklyMeasurements: Array.from({ length: 10 }, (_, i) => ({
              date: `2024-${String(Math.floor(i / 4) + 1).padStart(2, '0')}-${String((i % 4 + 1) * 7).padStart(2, '0')}`,
              updatedAt: new Date().toISOString(),
            })) as WeeklyMeasurement[],
            earnedMilestones: [],
          });
          await evaluateMilestones(ctx);

          // Now get all achievements — earned ones should stay
          const achievements = await getAllAchievements();

          for (const type of earnedEntryTypes) {
            const achievement = achievements.find((a) => a.definition.id === type);
            expect(achievement?.status).toBe('earned');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: gamification-restructure, Property 11: Achievement-Datenmodell-Vollständigkeit
describe('Property 11: Achievement data model completeness', () => {
  /** Validates: Requirements 9.1, 9.2, 9.3, 9.4 */
  it('all achievements have valid structure and correct count', async () => {
    const allTypes = [
      'weight-loss-2kg', 'weight-loss-5kg', 'weight-loss-10kg', 'first-goal-reached',
      'daily-entries-3', 'daily-entries-7', 'daily-entries-14', 'daily-entries-30',
      'weekly-entries-3', 'weekly-entries-10',
    ] as const;

    await fc.assert(
      fc.asyncProperty(
        fc.subarray([...allTypes]),
        async (earnedTypes) => {
          resetDB();
          indexedDB.deleteDatabase('fitness-tracker');

          // Earn selected milestones
          if (earnedTypes.length > 0) {
            const ctx = makeContext({
              goals: earnedTypes.includes('first-goal-reached') ? [makeGoal({ status: 'reached' })] : [],
              dailyMeasurements: Array.from({ length: 30 }, (_, i) =>
                makeDaily(`2024-${String(Math.floor(i / 28) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`, 100 - i * 0.5)
              ),
              weeklyMeasurements: Array.from({ length: 10 }, (_, i) => ({
                date: `2024-${String(Math.floor(i / 4) + 1).padStart(2, '0')}-${String((i % 4 + 1) * 7).padStart(2, '0')}`,
                updatedAt: new Date().toISOString(),
              })) as WeeklyMeasurement[],
              earnedMilestones: [],
            });
            await evaluateMilestones(ctx);
          }

          const achievements = await getAllAchievements();

          // (c) total count equals ACHIEVEMENT_DEFINITIONS count
          expect(achievements.length).toBe(ACHIEVEMENT_DEFINITIONS.length);

          // (a) unique ids, German label, valid category and status
          const ids = achievements.map((a) => a.definition.id);
          expect(new Set(ids).size).toBe(ids.length);

          for (const a of achievements) {
            expect(a.definition.label.length).toBeGreaterThan(0);
            expect(['progress', 'streak']).toContain(a.definition.category);
            expect(['locked', 'earned']).toContain(a.status);

            // (b) earned achievements have earnedAt
            if (a.status === 'earned') {
              expect(a.earnedAt).toBeDefined();
              expect(typeof a.earnedAt).toBe('string');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ─── detectMicroWins Unit Tests ──────────────────────────────────────────

describe('gamificationService - detectMicroWins', () => {
  it('returns empty array when no measurements', () => {
    const result = detectMicroWins([], []);
    expect(result).toEqual([]);
  });

  it('returns empty array when insufficient daily data (only 1 bodyFat entry in 14 days)', () => {
    const daily = [makeDailyWithWeight(daysAgo(5), 80, 25.0)];
    const result = detectMicroWins(daily, []);
    expect(result).toEqual([]);
  });

  it('returns empty array when insufficient weekly data (only 1 entry in 14 days)', () => {
    const weekly = [makeWeekly(daysAgo(5), { waist: 90 })];
    const result = detectMicroWins([], weekly);
    expect(result).toEqual([]);
  });

  it('detects body fat micro-win when drop > 0.5%', () => {
    const daily = [
      makeDailyWithWeight(daysAgo(13), 80, 25.0),
      makeDailyWithWeight(daysAgo(1), 80, 24.3),
    ];
    const result = detectMicroWins(daily, []);
    expect(result.length).toBe(1);
    expect(result[0].metric).toBe('bodyFat');
    expect(result[0].text).toBe('−0.7% Körperfett');
  });

  it('does NOT detect body fat micro-win when drop <= 0.5%', () => {
    const daily = [
      makeDailyWithWeight(daysAgo(13), 80, 25.0),
      makeDailyWithWeight(daysAgo(1), 80, 24.5),
    ];
    const result = detectMicroWins(daily, []);
    expect(result).toEqual([]);
  });

  it('detects circumference micro-win when drop > 0.5 cm (no stable weight required)', () => {
    const daily = [
      makeDailyWithWeight(daysAgo(13), 80.0),
      makeDailyWithWeight(daysAgo(1), 85.0), // weight changed significantly
    ];
    const weekly = [
      makeWeekly(daysAgo(12), { waist: 90 }),
      makeWeekly(daysAgo(2), { waist: 88.5 }),
    ];
    const result = detectMicroWins(daily, weekly);
    expect(result.length).toBe(1);
    expect(result[0].metric).toBe('waist');
    expect(result[0].text).toBe('−1.5 cm Taille');
  });

  it('does NOT detect circumference micro-win when drop <= 0.5 cm', () => {
    const weekly = [
      makeWeekly(daysAgo(12), { waist: 90 }),
      makeWeekly(daysAgo(2), { waist: 89.5 }),
    ];
    const result = detectMicroWins([], weekly);
    expect(result).toEqual([]);
  });

  it('detects multiple circumference zone micro-wins', () => {
    const weekly = [
      makeWeekly(daysAgo(12), { waist: 90, chest: 100, hip: 95 }),
      makeWeekly(daysAgo(2), { waist: 89, chest: 99, hip: 94 }),
    ];
    const result = detectMicroWins([], weekly);
    expect(result.length).toBe(3);
    const metrics = result.map((w) => w.metric);
    expect(metrics).toContain('chest');
    expect(metrics).toContain('waist');
    expect(metrics).toContain('hip');
  });

  it('detects both body fat and circumference micro-wins simultaneously', () => {
    const daily = [
      makeDailyWithWeight(daysAgo(13), 80, 25.0),
      makeDailyWithWeight(daysAgo(1), 80, 24.0),
    ];
    const weekly = [
      makeWeekly(daysAgo(12), { waist: 90 }),
      makeWeekly(daysAgo(2), { waist: 88 }),
    ];
    const result = detectMicroWins(daily, weekly);
    expect(result.length).toBe(2);
    const metrics = result.map((w) => w.metric);
    expect(metrics).toContain('bodyFat');
    expect(metrics).toContain('waist');
  });

  it('ignores measurements older than 14 days', () => {
    const daily = [
      makeDailyWithWeight(daysAgo(20), 80, 25.0),
      makeDailyWithWeight(daysAgo(1), 80, 24.0),
    ];
    // Only 1 bodyFat entry within 14-day window → insufficient
    const result = detectMicroWins(daily, []);
    expect(result).toEqual([]);
  });

  it('uses correct zone labels in text output', () => {
    const weekly = [
      makeWeekly(daysAgo(12), { chest: 100, belly: 95, upperArm: 35, thigh: 60 }),
      makeWeekly(daysAgo(2), { chest: 98, belly: 93, upperArm: 33, thigh: 58 }),
    ];
    const result = detectMicroWins([], weekly);
    const texts = result.map((w) => w.text);
    expect(texts).toContain('−2 cm Brust');
    expect(texts).toContain('−2 cm Bauch');
    expect(texts).toContain('−2 cm Oberarm');
    expect(texts).toContain('−2 cm Oberschenkel');
  });

  it('skips zones with missing values', () => {
    const weekly = [
      makeWeekly(daysAgo(12), { waist: 90 }),
      makeWeekly(daysAgo(2), { waist: 88, chest: 99 }), // chest only in latest
    ];
    const result = detectMicroWins([], weekly);
    expect(result.length).toBe(1);
    expect(result[0].metric).toBe('waist');
  });
});

// Feature: gamification-restructure, Property 10: Micro-Win-Erkennung bei Schwellenwertüberschreitung
describe('Property 10: Micro-Win detection at threshold', () => {
  /** Validates: Requirements 7.1, 7.2 */
  it('returns at least one MicroWin when body fat or circumference dropped > 0.5 within 14 days', () => {
    const circumferenceZones = ['chest', 'waist', 'hip', 'belly', 'upperArm', 'thigh'] as const;

    fc.assert(
      fc.property(
        fc.record({
          bodyFatDrop: fc.float({ min: Math.fround(0.51), max: Math.fround(10), noNaN: true }),
          circumDrop: fc.float({ min: Math.fround(0.51), max: Math.fround(20), noNaN: true }),
          zoneIdx: fc.integer({ min: 0, max: 5 }),
          testBodyFat: fc.boolean(),
          testCircum: fc.boolean(),
        }),
        ({ bodyFatDrop, circumDrop, zoneIdx, testBodyFat, testCircum }) => {
          // At least one must be tested
          const doBodyFat = testBodyFat || !testCircum;
          const doCircum = testCircum || !testBodyFat;

          const today = new Date();
          const d13 = new Date(today);
          d13.setDate(d13.getDate() - 13);
          const d1 = new Date(today);
          d1.setDate(d1.getDate() - 1);
          const dateEarly = d13.toISOString().split('T')[0];
          const dateLate = d1.toISOString().split('T')[0];

          const daily: DailyMeasurement[] = [];
          const weekly: WeeklyMeasurement[] = [];

          if (doBodyFat) {
            const startBf = 25;
            const endBf = startBf - bodyFatDrop;
            daily.push(
              { date: dateEarly, weight: 80, bodyFat: startBf, source: 'manual', updatedAt: '' },
              { date: dateLate, weight: 80, bodyFat: endBf, source: 'manual', updatedAt: '' }
            );
          }

          if (doCircum) {
            const zone = circumferenceZones[zoneIdx];
            const startVal = 90;
            const endVal = startVal - circumDrop;
            weekly.push(
              { date: dateEarly, [zone]: startVal, updatedAt: '' } as WeeklyMeasurement,
              { date: dateLate, [zone]: endVal, updatedAt: '' } as WeeklyMeasurement
            );
          }

          const result = detectMicroWins(daily, weekly);
          expect(result.length).toBeGreaterThanOrEqual(1);

          if (doBodyFat) {
            expect(result.some((w) => w.metric === 'bodyFat')).toBe(true);
          }
          if (doCircum) {
            const zone = circumferenceZones[zoneIdx];
            expect(result.some((w) => w.metric === zone)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
