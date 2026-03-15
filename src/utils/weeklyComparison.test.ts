import { describe, it, expect } from 'vitest';
import {
  classifyDiff,
  getDiffFeedback,
  getFirstEntryText,
  getGlobalFeedback,
  type DiffClassification,
} from './weeklyComparison';

describe('weeklyComparison', () => {
  describe('classifyDiff', () => {
    it('returns "decrease" when diff < -0.3', () => {
      expect(classifyDiff(80.0, 80.5)).toBe('decrease');
    });

    it('returns "decrease" at boundary diff = -0.31', () => {
      expect(classifyDiff(80.0, 80.31)).toBe('decrease');
    });

    it('returns "stable" when diff is exactly -0.3', () => {
      expect(classifyDiff(80.0, 80.3)).toBe('stable');
    });

    it('returns "stable" when diff is 0', () => {
      expect(classifyDiff(80.0, 80.0)).toBe('stable');
    });

    it('returns "stable" when diff is exactly +0.3', () => {
      expect(classifyDiff(80.3, 80.0)).toBe('stable');
    });

    it('returns "increase" when diff > +0.3', () => {
      expect(classifyDiff(81.0, 80.0)).toBe('increase');
    });

    it('returns "increase" at boundary diff = +0.31', () => {
      expect(classifyDiff(80.31, 80.0)).toBe('increase');
    });
  });

  describe('getDiffFeedback', () => {
    it('returns a positive phrase for decrease', () => {
      const feedback = getDiffFeedback('decrease');
      expect(feedback).toBe('Starker Fortschritt!');
    });

    it('rotates positive phrases by index', () => {
      expect(getDiffFeedback('decrease', 0)).toBe('Starker Fortschritt!');
      expect(getDiffFeedback('decrease', 1)).toBe('Weiter so!');
      expect(getDiffFeedback('decrease', 2)).toBe('Tolle Entwicklung!');
      expect(getDiffFeedback('decrease', 3)).toBe('Starker Fortschritt!');
    });

    it('returns neutral text for stable', () => {
      expect(getDiffFeedback('stable')).toBe('Stabil — gut gehalten.');
    });

    it('returns neutral text for increase (no negative language)', () => {
      const feedback = getDiffFeedback('increase');
      expect(feedback).toBe('Leicht gestiegen — kein Grund zur Sorge.');
    });
  });

  describe('getFirstEntryText', () => {
    it('returns "Erster Eintrag"', () => {
      expect(getFirstEntryText()).toBe('Erster Eintrag');
    });
  });

  describe('getGlobalFeedback', () => {
    it('returns encouraging message when all are stable', () => {
      const classifications: DiffClassification[] = ['stable', 'stable', 'stable'];
      expect(getGlobalFeedback(classifications)).toBe('Dranbleiben — Veränderung braucht Zeit.');
    });

    it('returns encouraging message when all are increase', () => {
      const classifications: DiffClassification[] = ['increase', 'increase'];
      expect(getGlobalFeedback(classifications)).toBe('Dranbleiben — Veränderung braucht Zeit.');
    });

    it('returns encouraging message when mix of stable and increase', () => {
      const classifications: DiffClassification[] = ['stable', 'increase', 'stable'];
      expect(getGlobalFeedback(classifications)).toBe('Dranbleiben — Veränderung braucht Zeit.');
    });

    it('returns null when any zone decreased', () => {
      const classifications: DiffClassification[] = ['stable', 'decrease', 'increase'];
      expect(getGlobalFeedback(classifications)).toBeNull();
    });

    it('returns null for empty array', () => {
      expect(getGlobalFeedback([])).toBeNull();
    });

    it('returns null when all are decrease', () => {
      const classifications: DiffClassification[] = ['decrease', 'decrease'];
      expect(getGlobalFeedback(classifications)).toBeNull();
    });
  });
});
