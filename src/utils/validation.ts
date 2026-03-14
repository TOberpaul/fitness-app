import {
  WEIGHT_MIN,
  WEIGHT_MAX,
  BODY_FAT_MIN,
  BODY_FAT_MAX,
  CIRCUMFERENCE_MIN,
  CIRCUMFERENCE_MAX,
  type ValidationResult,
  type WeeklyMeasurement,
} from '../types';

/** Validate weight is within range 30-300 kg */
export function validateWeight(value: number): boolean {
  return typeof value === 'number' && !Number.isNaN(value) && value >= WEIGHT_MIN && value <= WEIGHT_MAX;
}

/** Validate body fat percentage is within range 1-60% */
export function validateBodyFat(value: number): boolean {
  return typeof value === 'number' && !Number.isNaN(value) && value >= BODY_FAT_MIN && value <= BODY_FAT_MAX;
}

/** Validate circumference is within range 10-200 cm */
export function validateCircumference(value: number): boolean {
  return typeof value === 'number' && !Number.isNaN(value) && value >= CIRCUMFERENCE_MIN && value <= CIRCUMFERENCE_MAX;
}

/** Round a number to one decimal place */
export function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
/** Normalize decimal input: replace comma with dot for locales that use comma as decimal separator */
export function normalizeDecimal(value: string): string {
  return value.replace(',', '.');
}

/** Validate a daily measurement object */
export function validateDailyMeasurement(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof data !== 'object' || data === null) {
    return { valid: false, errors: ['Data must be an object'] };
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.date !== 'string' || obj.date.length === 0) {
    errors.push('Date is required and must be a string');
  }

  if (obj.weight !== undefined && obj.weight !== null) {
    if (typeof obj.weight !== 'number' || !validateWeight(obj.weight)) {
      errors.push(`Weight must be between ${WEIGHT_MIN} and ${WEIGHT_MAX} kg`);
    }
  }

  if (obj.bodyFat !== undefined && obj.bodyFat !== null) {
    if (typeof obj.bodyFat !== 'number' || !validateBodyFat(obj.bodyFat)) {
      errors.push(`Body fat must be between ${BODY_FAT_MIN} and ${BODY_FAT_MAX}%`);
    }
  }

  if (obj.source !== undefined) {
    if (obj.source !== 'manual' && obj.source !== 'fitbit') {
      errors.push('Source must be "manual" or "fitbit"');
    }
  }

  return { valid: errors.length === 0, errors };
}

const CIRCUMFERENCE_FIELDS: (keyof WeeklyMeasurement)[] = [
  'chest', 'waist', 'hip', 'belly', 'upperArm', 'thigh',
];

/** Validate a weekly measurement object */
export function validateWeeklyMeasurement(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof data !== 'object' || data === null) {
    return { valid: false, errors: ['Data must be an object'] };
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.date !== 'string' || obj.date.length === 0) {
    errors.push('Date is required and must be a string');
  }

  for (const field of CIRCUMFERENCE_FIELDS) {
    const value = obj[field];
    if (value !== undefined && value !== null) {
      if (typeof value !== 'number' || !validateCircumference(value)) {
        errors.push(`${field} must be between ${CIRCUMFERENCE_MIN} and ${CIRCUMFERENCE_MAX} cm`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
