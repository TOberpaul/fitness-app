import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDailyReminderMessage,
  getWeeklyReminderMessage,
  categorizeUserContext,
  DAILY_PHRASES,
  WEEKLY_PHRASES,
  CONTEXT_OVERLAYS,
} from '../notificationEngine';
import type { DailyMeasurement, Goal, UserContext } from '../../types';

// ─── Helper to format date as YYYY-MM-DD ────────────────────────────

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return formatDate(d);
}

function makeDailyMeasurement(date: string, weight?: number, bodyFat?: number): DailyMeasurement {
  return { date, weight, bodyFat, source: 'manual', updatedAt: new Date().toISOString() };
}

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'goal-1',
    metricType: 'weight',
    startValue: 90,
    targetValue: 80,
    createdAt: new Date().toISOString(),
    status: 'active',
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('notificationEngine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('phrase pools', () => {
    it('should have at least 10 daily phrases', () => {
      expect(DAILY_PHRASES.length).toBeGreaterThanOrEqual(10);
    });

    it('should have at least 10 weekly phrases', () => {
      expect(WEEKLY_PHRASES.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('getDailyReminderMessage', () => {
    const ctx: UserContext = {
      state: 'progressing',
      currentDailyStreak: 5,
      hasActiveGoal: true,
    };

    it('should return a message containing a phrase from the daily pool', () => {
      const msg = getDailyReminderMessage(ctx);
      const containsPhrase = DAILY_PHRASES.some((p) => msg.includes(p));
      expect(containsPhrase).toBe(true);
    });

    it('should prepend the context overlay for the given state', () => {
      const msg = getDailyReminderMessage(ctx);
      expect(msg).toContain(CONTEXT_OVERLAYS.progressing);
    });

    it('should not repeat the same phrase on consecutive calls', () => {
      const msg1 = getDailyReminderMessage(ctx);
      const msg2 = getDailyReminderMessage(ctx);
      expect(msg1).not.toBe(msg2);
    });

    it('should rotate through all phrases', () => {
      const seen = new Set<string>();
      for (let i = 0; i < DAILY_PHRASES.length; i++) {
        seen.add(getDailyReminderMessage(ctx));
      }
      expect(seen.size).toBe(DAILY_PHRASES.length);
    });
  });

  describe('getWeeklyReminderMessage', () => {
    const ctx: UserContext = {
      state: 'consistent',
      currentDailyStreak: 7,
      hasActiveGoal: false,
    };

    it('should return a message containing a phrase from the weekly pool', () => {
      const msg = getWeeklyReminderMessage(ctx);
      const containsPhrase = WEEKLY_PHRASES.some((p) => msg.includes(p));
      expect(containsPhrase).toBe(true);
    });

    it('should prepend the context overlay for the given state', () => {
      const msg = getWeeklyReminderMessage(ctx);
      expect(msg).toContain(CONTEXT_OVERLAYS.consistent);
    });

    it('should not repeat the same phrase on consecutive calls', () => {
      const msg1 = getWeeklyReminderMessage(ctx);
      const msg2 = getWeeklyReminderMessage(ctx);
      expect(msg1).not.toBe(msg2);
    });
  });

  describe('categorizeUserContext', () => {
    it('should return "inactive" when no measurements exist', () => {
      expect(categorizeUserContext([], [])).toBe('inactive');
    });

    it('should return "inactive" when last measurement is 3+ days ago', () => {
      const measurements = [makeDailyMeasurement(daysAgo(4), 85)];
      expect(categorizeUserContext(measurements, [])).toBe('inactive');
    });

    it('should return "consistent" when logged every day for past 7 days', () => {
      const measurements = Array.from({ length: 7 }, (_, i) =>
        makeDailyMeasurement(daysAgo(i), 85 - i * 0.1)
      );
      expect(categorizeUserContext(measurements, [])).toBe('consistent');
    });

    it('should return "progressing" when latest measurement shows progress toward goal', () => {
      const measurements = [
        makeDailyMeasurement(daysAgo(1), 86),
        makeDailyMeasurement(daysAgo(0), 85),
      ];
      const goals = [makeGoal({ targetValue: 80, startValue: 90 })];
      expect(categorizeUserContext(measurements, goals)).toBe('progressing');
    });

    it('should return "stagnating" when weight change over 14 days < 0.2 kg', () => {
      const measurements = [
        makeDailyMeasurement(daysAgo(15), 85.0),
        makeDailyMeasurement(daysAgo(0), 85.1),
      ];
      expect(categorizeUserContext(measurements, [])).toBe('stagnating');
    });

    it('should prioritize inactive over consistent', () => {
      // 3 days gap means inactive, even if there were 7 entries before
      const measurements = [makeDailyMeasurement(daysAgo(3), 85)];
      expect(categorizeUserContext(measurements, [])).toBe('inactive');
    });

    it('should prioritize consistent over progressing', () => {
      // 7 consecutive days + progress toward goal → consistent wins
      const measurements = Array.from({ length: 7 }, (_, i) =>
        makeDailyMeasurement(daysAgo(i), 85 - i * 0.5)
      );
      const goals = [makeGoal({ targetValue: 80, startValue: 90 })];
      expect(categorizeUserContext(measurements, goals)).toBe('consistent');
    });
  });
});
