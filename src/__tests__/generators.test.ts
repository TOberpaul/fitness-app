import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  arbitraryGoal,
  arbitraryGoalInput,
  arbitraryDailyMeasurement,
  arbitraryWeeklyMeasurement,
  arbitraryDailySequence,
  arbitraryWeeklySequence,
  arbitraryUserContext,
  arbitraryStepFlowEntries,
} from './generators';
import {
  WEIGHT_MIN,
  WEIGHT_MAX,
  BODY_FAT_MIN,
  BODY_FAT_MAX,
  CIRCUMFERENCE_MIN,
  CIRCUMFERENCE_MAX,
} from '../types';

/**
 * Validates: Requirements 4.4, 4.5
 * Smoke tests ensuring all shared generators produce structurally valid data.
 */

describe('Shared fast-check generators', () => {
  it('arbitraryGoal produces valid Goal objects', () => {
    fc.assert(
      fc.property(arbitraryGoal(), (goal) => {
        expect(goal.id).toBeTruthy();
        expect(['weight', 'bodyFat', 'circumference']).toContain(goal.metricType);
        expect(['active', 'reached', 'archived']).toContain(goal.status);
        if (goal.metricType === 'circumference') {
          expect(goal.zone).toBeTruthy();
        }
        expect(goal.createdAt).toBeTruthy();
        expect(goal.updatedAt).toBeTruthy();
      }),
      { numRuns: 50 }
    );
  });

  it('arbitraryGoalInput produces valid GoalInput objects', () => {
    fc.assert(
      fc.property(arbitraryGoalInput(), (input) => {
        expect(['weight', 'bodyFat', 'circumference']).toContain(input.metricType);
        if (input.metricType === 'circumference') {
          expect(input.zone).toBeTruthy();
        }
        expect(typeof input.startValue).toBe('number');
        expect(typeof input.targetValue).toBe('number');
      }),
      { numRuns: 50 }
    );
  });

  it('arbitraryDailyMeasurement produces valid DailyMeasurement objects', () => {
    fc.assert(
      fc.property(arbitraryDailyMeasurement(), (m) => {
        expect(m.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(['manual', 'fitbit']).toContain(m.source);
        if (m.weight !== undefined) {
          expect(m.weight).toBeGreaterThanOrEqual(WEIGHT_MIN);
          expect(m.weight).toBeLessThanOrEqual(WEIGHT_MAX);
        }
        if (m.bodyFat !== undefined) {
          expect(m.bodyFat).toBeGreaterThanOrEqual(BODY_FAT_MIN);
          expect(m.bodyFat).toBeLessThanOrEqual(BODY_FAT_MAX);
        }
      }),
      { numRuns: 50 }
    );
  });

  it('arbitraryWeeklyMeasurement produces valid WeeklyMeasurement with Monday dates', () => {
    fc.assert(
      fc.property(arbitraryWeeklyMeasurement(), (m) => {
        expect(m.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        // Verify it's a Monday
        const day = new Date(m.date + 'T00:00:00Z').getUTCDay();
        expect(day).toBe(1);
        const zones = [m.chest, m.waist, m.hip, m.belly, m.upperArm, m.thigh];
        for (const v of zones) {
          if (v !== undefined) {
            expect(v).toBeGreaterThanOrEqual(CIRCUMFERENCE_MIN);
            expect(v).toBeLessThanOrEqual(CIRCUMFERENCE_MAX);
          }
        }
      }),
      { numRuns: 50 }
    );
  });

  it('arbitraryDailySequence produces consecutive dates', () => {
    const n = 7;
    fc.assert(
      fc.property(arbitraryDailySequence(n), (seq) => {
        expect(seq).toHaveLength(n);
        for (let i = 1; i < seq.length; i++) {
          const prev = new Date(seq[i - 1].date + 'T00:00:00Z');
          const curr = new Date(seq[i].date + 'T00:00:00Z');
          const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
          expect(diffDays).toBe(1);
        }
      }),
      { numRuns: 30 }
    );
  });

  it('arbitraryWeeklySequence produces consecutive Monday dates', () => {
    const n = 4;
    fc.assert(
      fc.property(arbitraryWeeklySequence(n), (seq) => {
        expect(seq).toHaveLength(n);
        for (let i = 0; i < seq.length; i++) {
          const d = new Date(seq[i].date + 'T00:00:00Z');
          expect(d.getUTCDay()).toBe(1); // Monday
        }
        for (let i = 1; i < seq.length; i++) {
          const prev = new Date(seq[i - 1].date + 'T00:00:00Z');
          const curr = new Date(seq[i].date + 'T00:00:00Z');
          const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
          expect(diffDays).toBe(7);
        }
      }),
      { numRuns: 30 }
    );
  });

  it('arbitraryUserContext produces valid UserContext objects', () => {
    fc.assert(
      fc.property(arbitraryUserContext(), (ctx) => {
        expect(['progressing', 'consistent', 'stagnating', 'inactive']).toContain(ctx.state);
        expect(ctx.currentDailyStreak).toBeGreaterThanOrEqual(0);
        expect(typeof ctx.hasActiveGoal).toBe('boolean');
      }),
      { numRuns: 50 }
    );
  });

  it('arbitraryStepFlowEntries produces 6 entries in zone order', () => {
    const expectedZones = ['chest', 'waist', 'hip', 'belly', 'upperArm', 'thigh'];
    fc.assert(
      fc.property(arbitraryStepFlowEntries(), (entries) => {
        expect(entries).toHaveLength(6);
        entries.forEach((entry, i) => {
          expect(entry.zone).toBe(expectedZones[i]);
          expect(entry.label).toBeTruthy();
          expect(typeof entry.skipped).toBe('boolean');
          if (entry.skipped) {
            expect(entry.value).toBeNull();
          }
          if (entry.value !== null) {
            expect(entry.value).toBeGreaterThanOrEqual(CIRCUMFERENCE_MIN);
            expect(entry.value).toBeLessThanOrEqual(CIRCUMFERENCE_MAX);
          }
        });
      }),
      { numRuns: 50 }
    );
  });
});
