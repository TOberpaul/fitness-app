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

// ─── Coaching, Goals & Gamification Types ────────────────────────────

/** Metric types that can be tracked as goals */
export type GoalMetricType = 'weight' | 'bodyFat' | 'circumference';

/** Circumference zone identifiers */
export type CircumferenceZone = 'chest' | 'waist' | 'hip' | 'belly' | 'upperArm' | 'thigh';

/** Goal lifecycle status */
export type GoalStatus = 'active' | 'reached' | 'archived';

/** User context state for notification engine */
export type UserContextState = 'progressing' | 'consistent' | 'stagnating' | 'inactive';

/** Trend direction for body compass */
export type TrendDirection = 'improving' | 'stable' | 'declining';

/** A user-defined fitness goal */
export interface Goal {
  /** UUID primary key */
  id: string;
  /** Which metric this goal tracks */
  metricType: GoalMetricType;
  /** Circumference zone, required when metricType is 'circumference' */
  zone?: CircumferenceZone;
  /** Value at goal creation */
  startValue: number;
  /** Target value to reach */
  targetValue: number;
  /** Optional deadline date (YYYY-MM-DD) */
  deadline?: string;
  /** ISO 8601 timestamp of creation */
  createdAt: string;
  /** Goal lifecycle status */
  status: GoalStatus;
  /** ISO 8601 timestamp when goal was reached, if applicable */
  reachedAt?: string;
  /** ISO 8601 timestamp of last update */
  updatedAt: string;
}

/** Input for creating a new goal (id, createdAt, status, updatedAt are generated) */
export interface GoalInput {
  metricType: GoalMetricType;
  zone?: CircumferenceZone;
  startValue: number;
  targetValue: number;
  deadline?: string;
}

/** Projection data calculated by the goal projection engine */
export interface GoalProjection {
  /** Current measured value */
  currentValue: number;
  /** Absolute distance remaining to target */
  remainingDistance: number;
  /** Percentage of goal completed (0-100) */
  percentComplete: number;
  /** Required weekly change to hit deadline (null if no deadline) */
  requiredWeeklyTempo: number | null;
  /** Projected completion date based on current rate (null if insufficient data) */
  projectedDate: string | null;
  /** Current weekly rate of change (weighted moving average of last 4 weeks) */
  currentWeeklyRate: number | null;
  /** Trend feedback category */
  trendFeedback: 'ahead' | 'on-track' | 'behind' | 'insufficient-data';
}

/** Result of evaluating a goal against current measurements */
export interface GoalEvaluation {
  goalId: string;
  previousStatus: GoalStatus;
  newStatus: GoalStatus;
  justReached: boolean;
}

/** Streak tracking data */
export interface Streaks {
  /** Consecutive days with a weight measurement */
  dailyStreak: number;
  /** Date of last daily measurement (YYYY-MM-DD) */
  dailyLastDate: string | null;
  /** Consecutive weeks with a circumference measurement */
  weeklyStreak: number;
  /** Week start date of last weekly measurement (YYYY-MM-DD) */
  weeklyLastDate: string | null;
  /** ISO 8601 timestamp */
  updatedAt: string;
}

/** Info returned after a streak update */
export interface StreakInfo {
  currentStreak: number;
  isNewRecord: boolean;
  thresholdReached: number | null;
}

/** A recorded milestone achievement */
export interface Milestone {
  /** UUID primary key */
  id: string;
  /** Machine-readable milestone type */
  type: MilestoneType;
  /** German display label */
  label: string;
  /** Date earned (YYYY-MM-DD) */
  earnedAt: string;
  /** Whether the user has been notified */
  notified: boolean;
}

/** Known milestone types */
export type MilestoneType =
  | 'first-goal-reached'
  | 'weight-loss-5kg'
  | 'daily-streak-10'
  | 'daily-streak-30'
  | 'weekly-streak-4'
  | 'weekly-streak-12';

/** Context passed to milestone evaluation */
export interface MilestoneContext {
  goals: Goal[];
  streaks: Streaks;
  dailyMeasurements: DailyMeasurement[];
  earnedMilestones: Milestone[];
}

/** Weekly consistency score */
export interface ConsistencyScore {
  /** Week start date (YYYY-MM-DD) */
  weekStart: string;
  /** Number of days with weight logged (0-7) */
  daysLogged: number;
  /** Whether weekly circumference was completed */
  weeklyCompleted: boolean;
  /** Final score 0-100 */
  score: number;
}

/** A detected non-scale victory */
export interface NonScaleVictory {
  /** German message describing the victory */
  message: string;
  /** Which metric improved */
  metric: string;
  /** Date detected */
  detectedAt: string;
}

/** User context for notification message selection */
export interface UserContext {
  state: UserContextState;
  currentDailyStreak: number;
  hasActiveGoal: boolean;
  lastNotificationPhrase?: string;
}

/** Entry in the step flow wizard */
export interface StepFlowEntry {
  zone: CircumferenceZone;
  label: string;
  value: number | null;
  skipped: boolean;
}

/** Streak achievement for display purposes */
export interface StreakAchievement {
  type: 'daily-streak' | 'weekly-streak';
  count: number;
  label: string;
}
