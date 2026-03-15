# Requirements Document

## Introduction

This feature adds a comprehensive coaching, goal-tracking, and gamification layer to the existing fitness tracking PWA. The system enables users to define measurable fitness goals (weight, body fat, circumference), tracks progress with projections and tempo analysis, replaces the current weekly measurement form with a guided step-by-step flow, introduces subtle adult-appropriate gamification (streaks, milestones, consistency scores), upgrades notifications to be emotionally supportive and context-aware, and enhances the dashboard with coaching summaries and better empty states. The feature is implemented in three phases: Phase 1 (goals, notifications, empty states), Phase 2 (step-by-step flow, weekly comparison), Phase 3 (streaks, milestones, smart coaching). All UI is in German. The design philosophy is calm, positive, adult, and supportive — "Ich sehe nicht nur Zahlen. Ich sehe, dass ich vorankomme."

## Glossary

- **Goal_System**: The module responsible for creating, storing, evaluating, and displaying user-defined fitness goals with start values, target values, deadlines, and progress projections
- **Goal**: A single user-defined fitness target consisting of a metric type, start value, target value, optional deadline, and creation date
- **Goal_Projection_Engine**: The calculation module that computes remaining distance, required tempo, and projected completion date for each goal based on historical measurement data
- **Step_Flow**: The guided step-by-step circumference measurement wizard that replaces the current single-form weekly input view
- **Step_Flow_Screen**: A single screen within the Step_Flow showing one measurement field with input, illustration hint, and skip option
- **Step_Flow_Summary**: The final screen of the Step_Flow displaying all entered values with comparison to the previous week and positive feedback messages
- **Notification_Engine**: The upgraded notification module that generates emotionally supportive, context-dependent messages based on user progress, stagnation, or inactivity
- **Gamification_Engine**: The module that tracks and evaluates streaks, milestones, consistency scores, trend feedback, and non-scale victories
- **Streak**: A consecutive count of completed measurement actions (e.g., days of weight logging, weeks of circumference measurement)
- **Milestone**: A significant achievement event triggered by reaching predefined thresholds (e.g., first goal reached, 5 kg lost, 10 consecutive entries)
- **Consistency_Score**: A weekly percentage value representing how well the user adhered to the measurement and goal plan
- **Trend_Feedback**: A textual assessment comparing the user's actual progress rate against the required goal tempo
- **Non_Scale_Victory**: A positive observation derived from measurement data that is not directly related to the primary goal metric (e.g., waist decreasing while weight is stable)
- **Dashboard_Coaching**: The enhanced dashboard section displaying compact summaries, goal status cards, body compass, and achievement cards
- **Body_Compass**: A compact status card showing the directional trend (improving, stable, declining) for all tracked metrics
- **Goal_Onboarding**: The guided setup flow presented after initial Fitbit connection or first app use, prompting the user to set start weight, goal, reminder time, and activate weekly measurement
- **Fitness_Tracker_App**: The existing React + TypeScript PWA that tracks daily weight/body fat and weekly circumference measurements
- **IndexedDB_Store**: The local browser database used for persistent storage of all measurement and goal data
- **Supabase_Sync**: The cloud synchronization service that backs up local IndexedDB data to Supabase

## Requirements

### Requirement 1: Goal Creation

**User Story:** As a user, I want to create fitness goals with specific target values and deadlines, so that I have clear targets to work toward.

#### Acceptance Criteria

1. WHEN the user initiates goal creation, THE Goal_System SHALL present input fields for metric type (weight, body fat, circumference zone), target value, and optional deadline date
2. WHEN the user selects a circumference metric type, THE Goal_System SHALL present a selector for the specific zone (Brust, Taille, Hüfte, Bauch, Oberarm, Oberschenkel)
3. WHEN the user confirms a new goal, THE Goal_System SHALL record the start value from the most recent measurement of the selected metric type
4. IF no measurement data exists for the selected metric type, THEN THE Goal_System SHALL prompt the user to enter a manual start value
5. WHEN the user confirms a new goal, THE Goal_System SHALL persist the goal to the IndexedDB_Store with fields: id, metricType, zone (if circumference), startValue, targetValue, deadline (if set), createdAt, and status (active)
6. THE Goal_System SHALL validate that the target value differs from the start value
7. IF the user submits a target value equal to the start value, THEN THE Goal_System SHALL display a validation message in German

### Requirement 2: Goal Progress Display

**User Story:** As a user, I want to see my current progress toward each goal including tempo and projections, so that I understand how I am tracking.

#### Acceptance Criteria

1. WHEN the user views an active goal, THE Goal_System SHALL display: start value, current value, target value, remaining distance, and time remaining (if deadline is set)
2. WHEN a goal has a deadline and at least two measurement data points, THE Goal_Projection_Engine SHALL calculate the required weekly tempo to reach the target by the deadline
3. WHEN a goal has at least three measurement data points spanning at least 7 days, THE Goal_Projection_Engine SHALL calculate a projected completion date based on the current rate of change
4. WHEN the projected completion date is before the deadline, THE Goal_System SHALL display positive Trend_Feedback in German (e.g., "Du liegst vor deinem Zielplan")
5. WHEN the projected completion date is after the deadline, THE Goal_System SHALL display encouraging Trend_Feedback in German (e.g., "Etwas mehr Tempo nötig — du schaffst das")
6. THE Goal_Projection_Engine SHALL use a weighted moving average of the most recent 4 weeks of data to calculate the current rate of change
7. WHEN a goal has fewer than two measurement data points, THE Goal_System SHALL display the start value and target value without tempo or projection data

### Requirement 3: Goal Completion and Lifecycle

**User Story:** As a user, I want my goals to be automatically recognized as completed when I reach the target, so that I receive acknowledgment of my achievement.

#### Acceptance Criteria

1. WHEN a new measurement is saved and the current value meets or exceeds the target for an active goal, THE Goal_System SHALL mark the goal status as "reached" and record the completion date
2. WHEN a goal is marked as reached, THE Goal_System SHALL display a congratulatory message in German
3. WHEN the user views a reached goal, THE Goal_System SHALL display the start value, target value, actual final value, and duration from creation to completion
4. THE Goal_System SHALL allow the user to manually archive or delete a goal
5. THE Goal_System SHALL persist goal status changes to the IndexedDB_Store and trigger Supabase_Sync

### Requirement 4: Goal Data Persistence and Sync

**User Story:** As a user, I want my goals to be stored locally and synced to the cloud, so that my goal data is safe and available across sessions.

#### Acceptance Criteria

1. THE Goal_System SHALL store all goal records in a dedicated "goals" object store in the IndexedDB_Store
2. WHEN a goal is created, updated, or deleted, THE Goal_System SHALL persist the change to the IndexedDB_Store
3. WHEN a goal record changes in the IndexedDB_Store, THE Supabase_Sync SHALL include goal data in the next synchronization cycle
4. THE Goal_System SHALL serialize goal records to JSON for export and deserialize goal records from JSON for import
5. FOR ALL valid Goal objects, serializing then deserializing SHALL produce an equivalent Goal object (round-trip property)

### Requirement 5: Step-by-Step Circumference Measurement Flow

**User Story:** As a user, I want to enter my weekly circumference measurements through a guided step-by-step flow, so that the process feels structured and less overwhelming.

#### Acceptance Criteria

1. WHEN the user navigates to the weekly measurement view, THE Step_Flow SHALL display an intro screen with brief measurement instructions in German
2. WHEN the user proceeds from the intro screen, THE Step_Flow SHALL present one Step_Flow_Screen per measurement zone in order: Brust, Taille, Bauch, Hüfte, Oberarm, Oberschenkel
3. WHEN a Step_Flow_Screen is displayed, THE Step_Flow SHALL show a large number input field, a small illustration hint for the measurement zone, and a skip button
4. WHEN the user enters a value on a Step_Flow_Screen, THE Step_Flow SHALL validate the value against the circumference range (10.0–200.0 cm) before allowing progression
5. WHEN the user taps skip on a Step_Flow_Screen, THE Step_Flow SHALL record no value for that zone and advance to the next screen
6. WHEN all measurement screens are completed, THE Step_Flow SHALL display the Step_Flow_Summary
7. WHEN the user confirms the Step_Flow_Summary, THE Step_Flow SHALL save all entered values as a single WeeklyMeasurement record via the existing data service

### Requirement 6: Weekly Comparison and Feedback

**User Story:** As a user, I want to see how my measurements compare to the previous week after completing the step-by-step flow, so that I can see my progress.

#### Acceptance Criteria

1. WHEN the Step_Flow_Summary is displayed, THE Step_Flow SHALL show the difference from the previous week's measurement for each entered zone (e.g., "Taille −1.2 cm seit letzter Woche")
2. IF no previous week measurement exists for a zone, THEN THE Step_Flow SHALL display "Erster Eintrag" for that zone
3. WHEN a circumference value has decreased compared to the previous week, THE Step_Flow SHALL display a positive feedback phrase in German (e.g., "Starker Fortschritt")
4. WHEN all entered values are stable or increased, THE Step_Flow SHALL display a neutral encouraging message in German (e.g., "Dranbleiben — Veränderung braucht Zeit")
5. THE Step_Flow SHALL determine decrease, stable, or increase using a threshold of ±0.3 cm

### Requirement 7: Emotionally Supportive Notifications

**User Story:** As a user, I want to receive warm, supportive notification messages instead of plain reminders, so that I feel motivated rather than nagged.

#### Acceptance Criteria

1. WHEN a daily reminder notification is triggered, THE Notification_Engine SHALL select a message from a pool of emotionally supportive German phrases instead of a static reminder text
2. WHEN a weekly reminder notification is triggered, THE Notification_Engine SHALL select a message from a pool of emotionally supportive German phrases
3. THE Notification_Engine SHALL maintain a pool of at least 10 distinct daily reminder phrases and at least 10 distinct weekly reminder phrases
4. THE Notification_Engine SHALL rotate through phrases so that the same phrase is not repeated on consecutive notifications

### Requirement 8: Context-Dependent Smart Notifications

**User Story:** As a user, I want notifications that adapt to my current progress context, so that I receive relevant encouragement.

#### Acceptance Criteria

1. WHEN the user has logged measurements consistently for the past 7 days, THE Notification_Engine SHALL select a praise-oriented notification message
2. WHEN the user's most recent measurement shows progress toward an active goal, THE Notification_Engine SHALL include a progress-acknowledging phrase
3. WHEN the user has not logged any measurement for 3 or more days, THE Notification_Engine SHALL select a soft reactivation message (e.g., "Schon eine Weile her — ein kurzer Check-in reicht")
4. WHEN the user's measurements show stagnation (less than 0.2 kg change over 14 days), THE Notification_Engine SHALL select a motivating message acknowledging the plateau
5. THE Notification_Engine SHALL categorize the user's current context into one of four states: progressing, consistent, stagnating, or inactive

### Requirement 9: Dashboard Empty States

**User Story:** As a user, I want to see helpful guidance instead of blank screens when I have no data yet, so that I know what to do next.

#### Acceptance Criteria

1. WHEN the dashboard is displayed and no daily measurement data exists, THE Dashboard_Coaching SHALL display an empty state with a German call-to-action prompting the user to enter a first weight measurement
2. WHEN the dashboard is displayed and no weekly measurement data exists, THE Dashboard_Coaching SHALL display an empty state with a German call-to-action prompting the user to enter circumference measurements
3. WHEN the dashboard is displayed and no goals exist, THE Dashboard_Coaching SHALL display an empty state with a German call-to-action prompting the user to create a first goal
4. WHEN the user taps an empty state call-to-action, THE Dashboard_Coaching SHALL navigate the user to the corresponding input view or goal creation view

### Requirement 10: Dashboard Coaching Summary

**User Story:** As a user, I want to see a compact coaching summary on my dashboard, so that I get a quick overview of my current status and progress.

#### Acceptance Criteria

1. WHEN the dashboard is displayed and daily measurement data exists, THE Dashboard_Coaching SHALL display a compact summary card showing: current weight, 7-day weight change, and active goal status
2. WHEN the user has at least one active goal, THE Dashboard_Coaching SHALL display a goal status indicator showing remaining distance and tempo assessment
3. WHEN the user has weekly measurement data, THE Dashboard_Coaching SHALL display the Body_Compass card showing directional trend (improving, stable, declining) for each tracked circumference zone
4. THE Body_Compass SHALL determine trend direction using the most recent 3 weekly measurements per zone
5. WHEN fewer than 3 weekly measurements exist for a zone, THE Body_Compass SHALL display "Noch nicht genug Daten" for that zone

### Requirement 11: Streaks

**User Story:** As a user, I want to see my measurement streaks, so that I feel motivated to maintain consistency.

#### Acceptance Criteria

1. THE Gamification_Engine SHALL track a daily weight logging streak counting consecutive days with a weight measurement
2. THE Gamification_Engine SHALL track a weekly circumference streak counting consecutive weeks with at least one circumference measurement
3. WHEN the user logs a measurement that extends a streak, THE Gamification_Engine SHALL update the streak count and persist the value to the IndexedDB_Store
4. WHEN a streak is broken (a day or week is missed), THE Gamification_Engine SHALL reset the streak count to zero
5. WHEN a streak reaches a notable threshold (7 days, 30 days, 4 weeks, 12 weeks), THE Gamification_Engine SHALL display a subtle acknowledgment message in German

### Requirement 12: Milestones

**User Story:** As a user, I want to be recognized when I reach significant achievements, so that I feel a sense of accomplishment.

#### Acceptance Criteria

1. WHEN the user reaches a goal for the first time, THE Gamification_Engine SHALL record and display a "Erstes Ziel erreicht" milestone
2. WHEN the user's cumulative weight loss from any goal start value reaches 5 kg, THE Gamification_Engine SHALL record and display a "5 kg geschafft" milestone
3. WHEN the user logs 10 consecutive daily measurements, THE Gamification_Engine SHALL record and display a "10 Einträge am Stück" milestone
4. THE Gamification_Engine SHALL persist all earned milestones to the IndexedDB_Store with the date earned
5. THE Gamification_Engine SHALL display earned milestones only once as a notification and persistently in a milestones list

### Requirement 13: Consistency Score

**User Story:** As a user, I want to see a weekly consistency score, so that I understand how well I am sticking to my tracking routine.

#### Acceptance Criteria

1. THE Gamification_Engine SHALL calculate a weekly Consistency_Score as a percentage based on: days with weight logged (out of 7) and whether a weekly circumference measurement was completed
2. THE Gamification_Engine SHALL weight the daily logging component at 70% and the weekly measurement component at 30% of the Consistency_Score
3. WHEN the Consistency_Score is calculated, THE Gamification_Engine SHALL display the score on the dashboard with a German label (e.g., "Diese Woche: 86% on track")
4. THE Gamification_Engine SHALL recalculate the Consistency_Score at the end of each calendar week (Sunday 23:59)

### Requirement 14: Non-Scale Victories

**User Story:** As a user, I want to be informed about positive changes beyond the scale number, so that I stay motivated even when weight is not changing.

#### Acceptance Criteria

1. WHEN the user's weight has been stable (less than 0.3 kg change) over 14 days but a circumference zone has decreased by more than 0.5 cm, THE Gamification_Engine SHALL display a Non_Scale_Victory message in German (e.g., "Taille sinkt trotz konstantem Gewicht")
2. WHEN the user's body fat percentage has decreased by more than 0.5% over 14 days regardless of weight change, THE Gamification_Engine SHALL display a Non_Scale_Victory message
3. THE Gamification_Engine SHALL evaluate Non_Scale_Victory conditions after each new measurement is saved

### Requirement 15: Goal Onboarding Flow

**User Story:** As a user, I want to be guided through setting up my first goal after connecting Fitbit or on first use, so that I start with a clear plan.

#### Acceptance Criteria

1. WHEN the user completes Fitbit connection and no goals exist, THE Goal_Onboarding SHALL present a guided setup flow
2. WHEN the user opens the app for the first time and no measurement data and no goals exist, THE Goal_Onboarding SHALL present the guided setup flow
3. WHEN the Goal_Onboarding is active, THE Goal_Onboarding SHALL guide the user through: setting a start weight, creating a first weight goal, choosing a daily reminder time, and optionally activating weekly circumference measurement
4. THE Goal_Onboarding SHALL allow the user to skip any individual step
5. WHEN the user completes or skips all onboarding steps, THE Goal_Onboarding SHALL navigate to the dashboard

### Requirement 16: Achievement Cards on Dashboard

**User Story:** As a user, I want to see my recent achievements displayed on the dashboard, so that I am reminded of my progress.

#### Acceptance Criteria

1. WHEN the user has earned milestones or notable streaks, THE Dashboard_Coaching SHALL display up to 3 achievement cards on the dashboard
2. THE Dashboard_Coaching SHALL prioritize displaying the most recently earned achievements
3. WHEN the user taps an achievement card, THE Dashboard_Coaching SHALL navigate to a detail view showing all earned milestones and current streaks
4. WHEN no achievements exist, THE Dashboard_Coaching SHALL not display the achievement cards section

### Requirement 17: Design System Compliance

**User Story:** As a developer, I want all new UI components to follow the DB UX Design System conventions, so that the app maintains visual consistency.

#### Acceptance Criteria

1. THE Fitness_Tracker_App SHALL use the `.adaptive` CSS class on all new interactive and container elements
2. THE Fitness_Tracker_App SHALL use CSS custom properties (variables) for all color, spacing, and typography values in new components
3. THE Fitness_Tracker_App SHALL apply the `data-interactive` attribute on all new clickable button elements
4. THE Fitness_Tracker_App SHALL not use inline styles, hardcoded pixel values, opacity overrides, or line-height overrides in new components
5. THE Fitness_Tracker_App SHALL render all user-facing text in German
