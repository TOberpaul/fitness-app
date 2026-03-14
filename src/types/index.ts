// Validation range constants
export const WEIGHT_MIN = 30;
export const WEIGHT_MAX = 300;
export const BODY_FAT_MIN = 1;
export const BODY_FAT_MAX = 60;
export const CIRCUMFERENCE_MIN = 10;
export const CIRCUMFERENCE_MAX = 200;

/** Daily measurement record for weight and body fat */
export interface DailyMeasurement {
  /** Primary Key, ISO 8601 date (YYYY-MM-DD) */
  date: string;
  /** Weight in kg, 30.0 - 300.0, one decimal place */
  weight?: number;
  /** Body fat percentage, 1.0 - 60.0, one decimal place */
  bodyFat?: number;
  /** Data source */
  source: 'manual' | 'fitbit';
  /** ISO 8601 timestamp */
  updatedAt: string;
}

/** Weekly circumference measurement record */
export interface WeeklyMeasurement {
  /** Primary Key, Monday of the week (YYYY-MM-DD) */
  date: string;
  /** Chest circumference in cm, 10.0 - 200.0 */
  chest?: number;
  /** Waist circumference in cm, 10.0 - 200.0 */
  waist?: number;
  /** Hip circumference in cm, 10.0 - 200.0 */
  hip?: number;
  /** Belly circumference in cm, 10.0 - 200.0 */
  belly?: number;
  /** Upper arm circumference in cm, 10.0 - 200.0 */
  upperArm?: number;
  /** Thigh circumference in cm, 10.0 - 200.0 */
  thigh?: number;
  /** ISO 8601 timestamp */
  updatedAt: string;
}

/** JSON export/import data format */
export interface ExportData {
  version: 1;
  exportedAt: string;
  dailyMeasurements: DailyMeasurement[];
  weeklyMeasurements: WeeklyMeasurement[];
}

/** Fitbit OAuth token storage */
export interface FitbitTokens {
  accessToken: string;
  refreshToken: string;
  /** Unix timestamp in ms */
  expiresAt: number;
  userId: string;
}

/** Single data point for graph rendering */
export interface DataPoint {
  /** ISO 8601 date */
  date: string;
  value: number;
}

/** Time range filter options */
export type TimeRange = '1W' | '1M' | '3M' | '6M' | '1J' | 'Max';

/** Result of a Fitbit data sync operation */
export interface SyncResult {
  newEntries: number;
  updatedEntries: number;
  errors: string[];
}

/** Result of a data import operation */
export interface ImportResult {
  dailyCount: number;
  weeklyCount: number;
}

/** Result of a validation check */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
