import { describe, it, expect } from 'vitest';
import {
  validateWeight,
  validateBodyFat,
  validateCircumference,
  roundToOneDecimal,
  validateDailyMeasurement,
  validateWeeklyMeasurement,
} from './validation';

describe('validateWeight', () => {
  it('accepts values within range 30-300', () => {
    expect(validateWeight(30)).toBe(true);
    expect(validateWeight(85.5)).toBe(true);
    expect(validateWeight(300)).toBe(true);
  });

  it('rejects values outside range', () => {
    expect(validateWeight(29.9)).toBe(false);
    expect(validateWeight(300.1)).toBe(false);
    expect(validateWeight(0)).toBe(false);
    expect(validateWeight(-10)).toBe(false);
  });

  it('rejects NaN', () => {
    expect(validateWeight(NaN)).toBe(false);
  });
});

describe('validateBodyFat', () => {
  it('accepts values within range 1-60', () => {
    expect(validateBodyFat(1)).toBe(true);
    expect(validateBodyFat(25.5)).toBe(true);
    expect(validateBodyFat(60)).toBe(true);
  });

  it('rejects values outside range', () => {
    expect(validateBodyFat(0.9)).toBe(false);
    expect(validateBodyFat(60.1)).toBe(false);
    expect(validateBodyFat(0)).toBe(false);
  });
});

describe('validateCircumference', () => {
  it('accepts values within range 10-200', () => {
    expect(validateCircumference(10)).toBe(true);
    expect(validateCircumference(90.5)).toBe(true);
    expect(validateCircumference(200)).toBe(true);
  });

  it('rejects values outside range', () => {
    expect(validateCircumference(9.9)).toBe(false);
    expect(validateCircumference(200.1)).toBe(false);
  });
});

describe('roundToOneDecimal', () => {
  it('rounds to one decimal place', () => {
    expect(roundToOneDecimal(85.55)).toBe(85.6);
    expect(roundToOneDecimal(85.54)).toBe(85.5);
    expect(roundToOneDecimal(100)).toBe(100);
    expect(roundToOneDecimal(0.123)).toBe(0.1);
  });
});

describe('validateDailyMeasurement', () => {
  it('accepts valid measurement with all fields', () => {
    const result = validateDailyMeasurement({
      date: '2024-01-15',
      weight: 80.5,
      bodyFat: 20.1,
      source: 'manual',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts measurement with only date', () => {
    const result = validateDailyMeasurement({ date: '2024-01-15' });
    expect(result.valid).toBe(true);
  });

  it('rejects non-object data', () => {
    expect(validateDailyMeasurement(null).valid).toBe(false);
    expect(validateDailyMeasurement('string').valid).toBe(false);
    expect(validateDailyMeasurement(42).valid).toBe(false);
  });

  it('rejects missing date', () => {
    const result = validateDailyMeasurement({ weight: 80 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Date is required and must be a string');
  });

  it('rejects out-of-range weight', () => {
    const result = validateDailyMeasurement({ date: '2024-01-15', weight: 500 });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Weight must be between');
  });

  it('rejects out-of-range body fat', () => {
    const result = validateDailyMeasurement({ date: '2024-01-15', bodyFat: 70 });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Body fat must be between');
  });

  it('rejects invalid source', () => {
    const result = validateDailyMeasurement({ date: '2024-01-15', source: 'garmin' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Source must be "manual" or "fitbit"');
  });
});

describe('validateWeeklyMeasurement', () => {
  it('accepts valid measurement with all circumference fields', () => {
    const result = validateWeeklyMeasurement({
      date: '2024-01-15',
      chest: 100,
      waist: 85.5,
      hip: 95,
      belly: 90,
      upperArm: 35,
      thigh: 55,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts measurement with only date', () => {
    const result = validateWeeklyMeasurement({ date: '2024-01-15' });
    expect(result.valid).toBe(true);
  });

  it('rejects non-object data', () => {
    expect(validateWeeklyMeasurement(null).valid).toBe(false);
  });

  it('rejects missing date', () => {
    const result = validateWeeklyMeasurement({ chest: 100 });
    expect(result.valid).toBe(false);
  });

  it('rejects out-of-range circumference values', () => {
    const result = validateWeeklyMeasurement({ date: '2024-01-15', waist: 5 });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('waist must be between');
  });

  it('collects multiple errors', () => {
    const result = validateWeeklyMeasurement({
      date: '2024-01-15',
      chest: 5,
      waist: 250,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });
});
