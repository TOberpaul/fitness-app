import fc from 'fast-check';
import type {
  Goal,
  GoalInput,
  GoalMetricType,
  CircumferenceZone,
  GoalStatus,
  DailyMeasurement,
  WeeklyMeasurement,
  UserContext,
  UserContextState,
  StepFlowEntry,
} from '../types';
import {
  WEIGHT_MIN,
  WEIGHT_MAX,
  BODY_FAT_MIN,
  BODY_FAT_MAX,
  CIRCUMFERENCE_MIN,
  CIRCUMFERENCE_MAX,
} from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────

const METRIC_TYPES: GoalMetricType[] = ['weight', 'bodyFat', 'circumference'];
const CIRCUMFERENCE_ZONES: CircumferenceZone[] = ['chest', 'waist', 'hip', 'belly', 'upperArm', 'thigh'];
const GOAL_STATUSES: GoalStatus[] = ['active', 'reached', 'archived'];
const USER_CONTEXT_STATES: UserContextState[] = ['progressing', 'consistent', 'stagnating', 'inactive'];

const ZONE_LABELS: Record<CircumferenceZone, string> = {
  chest: 'Brust',
  waist: 'Taille',
  hip: 'Hüfte',
  belly: 'Bauch',
  upperArm: 'Oberarm',
  thigh: 'Oberschenkel',
};

/** Round to one decimal place */
const round1 = (n: number) => Math.round(n * 10) / 10;

/** Generate an ISO date string (YYYY-MM-DD) within a reasonable range */
const arbitraryDateString = (): fc.Arbitrary<string> =>
  fc.integer({ min: 0, max: 3650 }).map((offset) => {
    const d = new Date('2020-01-01T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + offset);
    return d.toISOString().slice(0, 10);
  });

/** Generate an ISO 8601 timestamp */
const arbitraryTimestamp = (): fc.Arbitrary<string> =>
  fc.integer({ min: 0, max: 3650 }).map((offset) => {
    const d = new Date('2020-01-01T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + offset);
    return d.toISOString();
  });

/** Generate a weight value within valid range, one decimal */
const arbitraryWeight = (): fc.Arbitrary<number> =>
  fc.double({ min: WEIGHT_MIN, max: WEIGHT_MAX, noNaN: true }).map(round1);

/** Generate a body fat value within valid range, one decimal */
const arbitraryBodyFat = (): fc.Arbitrary<number> =>
  fc.double({ min: BODY_FAT_MIN, max: BODY_FAT_MAX, noNaN: true }).map(round1);

/** Generate a circumference value within valid range, one decimal */
const arbitraryCircumference = (): fc.Arbitrary<number> =>
  fc.double({ min: CIRCUMFERENCE_MIN, max: CIRCUMFERENCE_MAX, noNaN: true }).map(round1);

// ─── Public Generators ───────────────────────────────────────────────

/** Generate a valid Goal object */
export function arbitraryGoal(): fc.Arbitrary<Goal> {
  return fc
    .record({
      metricType: fc.constantFrom(...METRIC_TYPES),
      status: fc.constantFrom(...GOAL_STATUSES),
      startValue: arbitraryWeight(),
      targetValue: arbitraryWeight(),
      deadline: fc.option(arbitraryDateString(), { nil: undefined }),
      createdAt: arbitraryTimestamp(),
      updatedAt: arbitraryTimestamp(),
      reachedAt: fc.option(arbitraryTimestamp(), { nil: undefined }),
    })
    .chain((base) => {
      const zone: fc.Arbitrary<CircumferenceZone | undefined> =
        base.metricType === 'circumference'
          ? fc.constantFrom(...CIRCUMFERENCE_ZONES)
          : fc.constant(undefined);

      // Adjust value ranges based on metric type
      const valueArb =
        base.metricType === 'weight'
          ? arbitraryWeight()
          : base.metricType === 'bodyFat'
            ? arbitraryBodyFat()
            : arbitraryCircumference();

      return fc.record({
        id: fc.uuid(),
        metricType: fc.constant(base.metricType),
        zone,
        startValue: valueArb,
        targetValue: valueArb,
        deadline: fc.constant(base.deadline),
        createdAt: fc.constant(base.createdAt),
        status: fc.constant(base.status),
        reachedAt: fc.constant(base.status === 'reached' ? base.reachedAt ?? base.updatedAt : undefined),
        updatedAt: fc.constant(base.updatedAt),
      });
    });
}

/** Generate a valid GoalInput object */
export function arbitraryGoalInput(): fc.Arbitrary<GoalInput> {
  return fc
    .constantFrom(...METRIC_TYPES)
    .chain((metricType) => {
      const zone: fc.Arbitrary<CircumferenceZone | undefined> =
        metricType === 'circumference'
          ? fc.constantFrom(...CIRCUMFERENCE_ZONES)
          : fc.constant(undefined);

      const valueArb =
        metricType === 'weight'
          ? arbitraryWeight()
          : metricType === 'bodyFat'
            ? arbitraryBodyFat()
            : arbitraryCircumference();

      return fc.record({
        metricType: fc.constant(metricType),
        zone,
        startValue: valueArb,
        targetValue: valueArb,
        deadline: fc.option(arbitraryDateString(), { nil: undefined }),
      });
    });
}

/** Generate a valid DailyMeasurement */
export function arbitraryDailyMeasurement(): fc.Arbitrary<DailyMeasurement> {
  return fc.record({
    date: arbitraryDateString(),
    weight: fc.option(arbitraryWeight(), { nil: undefined }),
    bodyFat: fc.option(arbitraryBodyFat(), { nil: undefined }),
    source: fc.constantFrom('manual' as const, 'fitbit' as const),
    updatedAt: arbitraryTimestamp(),
  });
}

/** Generate a valid WeeklyMeasurement */
export function arbitraryWeeklyMeasurement(): fc.Arbitrary<WeeklyMeasurement> {
  return fc.record({
    date: arbitraryMondayDateString(),
    chest: fc.option(arbitraryCircumference(), { nil: undefined }),
    waist: fc.option(arbitraryCircumference(), { nil: undefined }),
    hip: fc.option(arbitraryCircumference(), { nil: undefined }),
    belly: fc.option(arbitraryCircumference(), { nil: undefined }),
    upperArm: fc.option(arbitraryCircumference(), { nil: undefined }),
    thigh: fc.option(arbitraryCircumference(), { nil: undefined }),
    updatedAt: arbitraryTimestamp(),
  });
}

/** Generate a Monday date string (YYYY-MM-DD). 2020-01-06 is a Monday. */
function arbitraryMondayDateString(): fc.Arbitrary<string> {
  // Generate week offsets from a known Monday (2020-01-06)
  return fc.integer({ min: 0, max: 520 }).map((weekOffset) => {
    const d = new Date('2020-01-06T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + weekOffset * 7);
    return d.toISOString().slice(0, 10);
  });
}

/**
 * Generate an array of n DailyMeasurements with consecutive dates.
 * Starts from a random date and increments by 1 day.
 */
export function arbitraryDailySequence(n: number): fc.Arbitrary<DailyMeasurement[]> {
  return fc
    .record({
      startOffset: fc.integer({ min: 0, max: 3650 - n }),
      weights: fc.array(fc.option(arbitraryWeight(), { nil: undefined }), { minLength: n, maxLength: n }),
      bodyFats: fc.array(fc.option(arbitraryBodyFat(), { nil: undefined }), { minLength: n, maxLength: n }),
      sources: fc.array(fc.constantFrom('manual' as const, 'fitbit' as const), { minLength: n, maxLength: n }),
      updatedAts: fc.array(arbitraryTimestamp(), { minLength: n, maxLength: n }),
    })
    .map(({ startOffset, weights, bodyFats, sources, updatedAts }) => {
      const measurements: DailyMeasurement[] = [];
      for (let i = 0; i < n; i++) {
        const date = new Date('2020-01-01T00:00:00Z');
        date.setUTCDate(date.getUTCDate() + startOffset + i);
        measurements.push({
          date: date.toISOString().slice(0, 10),
          weight: weights[i],
          bodyFat: bodyFats[i],
          source: sources[i],
          updatedAt: updatedAts[i],
        });
      }
      return measurements;
    });
}

/**
 * Generate an array of n WeeklyMeasurements with consecutive week dates (Mondays).
 * Starts from a random Monday and increments by 7 days.
 */
export function arbitraryWeeklySequence(n: number): fc.Arbitrary<WeeklyMeasurement[]> {
  return fc
    .record({
      startWeekOffset: fc.integer({ min: 0, max: 520 - n }),
      chests: fc.array(fc.option(arbitraryCircumference(), { nil: undefined }), { minLength: n, maxLength: n }),
      waists: fc.array(fc.option(arbitraryCircumference(), { nil: undefined }), { minLength: n, maxLength: n }),
      hips: fc.array(fc.option(arbitraryCircumference(), { nil: undefined }), { minLength: n, maxLength: n }),
      bellies: fc.array(fc.option(arbitraryCircumference(), { nil: undefined }), { minLength: n, maxLength: n }),
      upperArms: fc.array(fc.option(arbitraryCircumference(), { nil: undefined }), { minLength: n, maxLength: n }),
      thighs: fc.array(fc.option(arbitraryCircumference(), { nil: undefined }), { minLength: n, maxLength: n }),
      updatedAts: fc.array(arbitraryTimestamp(), { minLength: n, maxLength: n }),
    })
    .map(({ startWeekOffset, chests, waists, hips, bellies, upperArms, thighs, updatedAts }) => {
      const measurements: WeeklyMeasurement[] = [];
      // 2020-01-06 is a Monday
      const baseMonday = new Date('2020-01-06T00:00:00Z');
      for (let i = 0; i < n; i++) {
        const date = new Date(baseMonday);
        date.setUTCDate(date.getUTCDate() + (startWeekOffset + i) * 7);
        measurements.push({
          date: date.toISOString().slice(0, 10),
          chest: chests[i],
          waist: waists[i],
          hip: hips[i],
          belly: bellies[i],
          upperArm: upperArms[i],
          thigh: thighs[i],
          updatedAt: updatedAts[i],
        });
      }
      return measurements;
    });
}

/** Generate a valid UserContext */
export function arbitraryUserContext(): fc.Arbitrary<UserContext> {
  return fc.record({
    state: fc.constantFrom(...USER_CONTEXT_STATES),
    currentDailyStreak: fc.nat({ max: 365 }),
    hasActiveGoal: fc.boolean(),
    lastNotificationPhrase: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  });
}

/** Generate a valid array of StepFlowEntry (one per zone, in order) */
export function arbitraryStepFlowEntries(): fc.Arbitrary<StepFlowEntry[]> {
  return fc
    .tuple(
      ...CIRCUMFERENCE_ZONES.map(() =>
        fc.record({
          skipped: fc.boolean(),
          value: fc.option(arbitraryCircumference(), { nil: null }),
        })
      )
    )
    .map((entries) =>
      CIRCUMFERENCE_ZONES.map((zone, i) => ({
        zone,
        label: ZONE_LABELS[zone],
        value: entries[i].skipped ? null : entries[i].value,
        skipped: entries[i].skipped,
      }))
    );
}
