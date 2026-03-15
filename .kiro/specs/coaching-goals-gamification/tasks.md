# Implementation Plan: Coaching, Goals & Gamification

## Overview

Dreiphasige Implementierung: Phase 1 (Goal-System, Notifications, Empty States), Phase 2 (Step-by-Step Flow, Weekly Comparison), Phase 3 (Gamification, Dashboard Coaching, Onboarding). Jeder Task baut auf den vorherigen auf. Alle Services sind pure Logic-Module, unabhängig testbar. UI komplett auf Deutsch, DB UX Design System Konventionen.

## Tasks

- [x] 1. Datenmodelle, IndexedDB-Schema und Shared Test-Generatoren
  - [x] 1.1 Neue Typen in `src/types/index.ts` hinzufügen
    - Alle neuen Typen aus dem Design einfügen: `GoalMetricType`, `CircumferenceZone`, `GoalStatus`, `UserContextState`, `TrendDirection`, `Goal`, `GoalInput`, `GoalProjection`, `GoalEvaluation`, `Streaks`, `StreakInfo`, `Milestone`, `MilestoneType`, `MilestoneContext`, `ConsistencyScore`, `NonScaleVictory`, `UserContext`, `StepFlowEntry`, `StreakAchievement`
    - _Requirements: 1.5, 4.1, 11.1, 12.4_

  - [x] 1.2 IndexedDB-Schema auf Version 2 upgraden in `src/services/db.ts`
    - `FitnessTrackerDB` Interface erweitern mit `goals`, `streaks`, `milestones` Object Stores
    - Upgrade-Handler für `oldVersion < 2` hinzufügen: `goals` Store mit Indexes `by-status` und `by-createdAt`, `streaks` Store, `milestones` Store mit Indexes `by-type` und `by-earnedAt`
    - _Requirements: 4.1, 4.2, 11.3, 12.4_

  - [x] 1.3 Shared fast-check Generatoren erstellen in `src/__tests__/generators.ts`
    - `arbitraryGoal()`, `arbitraryGoalInput()`, `arbitraryDailyMeasurement()`, `arbitraryWeeklyMeasurement()`, `arbitraryDailySequence(n)`, `arbitraryWeeklySequence(n)`, `arbitraryUserContext()`, `arbitraryStepFlowEntries()`
    - _Requirements: 4.4, 4.5_


- [x] 2. Goal Service — CRUD und Persistenz
  - [x] 2.1 `src/services/goalService.ts` erstellen mit CRUD-Funktionen
    - `createGoal(input)`: UUID generieren, Start-Wert aus letzter Messung ermitteln (oder manuell), Validierung (target ≠ start), in IndexedDB speichern
    - `getGoal(id)`, `getAllGoals()`, `getActiveGoals()`: Lese-Operationen aus IndexedDB
    - `updateGoalStatus(id, status)`: Status ändern, `reachedAt` setzen bei `'reached'`, `updatedAt` aktualisieren
    - `deleteGoal(id)`: Goal aus IndexedDB entfernen
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 3.4, 3.5, 4.2_

  - [ ]* 2.2 Property-Test: Goal Serialization Round-Trip
    - **Property 1: Goal serialization round-trip**
    - Für jedes valide `Goal`-Objekt: `JSON.parse(JSON.stringify(goal))` soll deep-equal zum Original sein
    - **Validates: Requirements 4.4, 4.5**

  - [ ]* 2.3 Property-Test: Goal Persistence Round-Trip
    - **Property 2: Goal persistence round-trip**
    - Nach `createGoal` + `getGoal` sollen `metricType`, `zone`, `startValue`, `targetValue`, `deadline`, `status` übereinstimmen
    - **Validates: Requirements 1.5**

  - [ ]* 2.4 Property-Test: Start Value from Most Recent Measurement
    - **Property 3: Goal start value from most recent measurement**
    - Start-Wert soll dem neuesten Messwert des gewählten Metrik-Typs entsprechen
    - **Validates: Requirements 1.3**

  - [ ]* 2.5 Property-Test: Target Must Differ from Start
    - **Property 4: Target must differ from start**
    - `createGoal` mit `targetValue === startValue` soll Validierungsfehler werfen
    - **Validates: Requirements 1.6**

- [x] 3. Goal Projection Engine
  - [x] 3.1 `calculateProjection` Funktion in `src/services/goalService.ts` implementieren
    - Pure Function: nimmt `Goal` + Messungen, gibt `GoalProjection` zurück
    - Weighted Moving Average der letzten 4 Wochen für `currentWeeklyRate`
    - `projectedDate`, `requiredWeeklyTempo`, `remainingDistance`, `percentComplete`, `trendFeedback` berechnen
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 3.2 Property-Test: Required Weekly Tempo Calculation
    - **Property 5: Required weekly tempo calculation**
    - `requiredWeeklyTempo === remainingDistance / weeksUntilDeadline`
    - **Validates: Requirements 2.2**

  - [ ]* 3.3 Property-Test: Projected Completion Date Existence
    - **Property 6: Projected completion date existence**
    - Bei ≥3 Datenpunkten über ≥7 Tage: `projectedDate` und `currentWeeklyRate` nicht null
    - **Validates: Requirements 2.3**

  - [ ]* 3.4 Property-Test: Trend Feedback Correctness
    - **Property 7: Trend feedback correctness**
    - `projectedDate ≤ deadline` → `'ahead'` oder `'on-track'`; `projectedDate > deadline` → `'behind'`
    - **Validates: Requirements 2.4, 2.5**

- [x] 4. Goal Lifecycle und Evaluation
  - [x] 4.1 `evaluateGoals` Funktion in `src/services/goalService.ts` implementieren
    - Nach jeder Messung aufrufen: prüft ob aktive Goals erreicht wurden
    - Setzt Status auf `'reached'`, speichert `reachedAt`, triggert Supabase Sync
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [ ]* 4.2 Property-Test: Goal Completion Detection
    - **Property 8: Goal completion detection**
    - Wenn aktueller Wert das Ziel erreicht/überschreitet → `newStatus === 'reached'`, `justReached === true`
    - **Validates: Requirements 3.1**

- [x] 5. Checkpoint — Phase 1 Services
  - Sicherstellen, dass alle Tests bestehen. Bei Fragen den User fragen.


- [x] 6. Supabase Sync für Goals, Streaks, Milestones
  - [x] 6.1 `src/services/cloudSync.ts` erweitern
    - `pushToCloud` und `pullFromCloud` um `goals`, `milestones`, `streaks` Tabellen erweitern
    - Gleiche "only overwrite if newer" Logik wie bestehende Tabellen
    - _Requirements: 4.3_

- [x] 7. Notification Engine — Emotionale und kontextabhängige Nachrichten
  - [x] 7.1 `src/services/notificationEngine.ts` erstellen
    - `getDailyReminderMessage(context)`: Phrase aus Pool wählen, Rotation via localStorage
    - `getWeeklyReminderMessage(context)`: Phrase aus Pool wählen, Rotation via localStorage
    - `categorizeUserContext(dailyMeasurements, goals)`: User-Zustand ermitteln (`progressing`, `consistent`, `stagnating`, `inactive`)
    - Mindestens 10 deutsche Phrasen pro Pool, Context-Overlays für jeden Zustand
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 7.2 Bestehenden `src/services/notificationService.ts` anpassen
    - Statische Reminder-Texte durch `notificationEngine` Aufrufe ersetzen
    - _Requirements: 7.1, 7.2_

  - [ ]* 7.3 Property-Test: Notification Messages Come from Pool
    - **Property 12: Notification messages come from pool**
    - Rückgabewert muss Element des jeweiligen Phrase-Pools sein
    - **Validates: Requirements 7.1, 7.2**

  - [ ]* 7.4 Property-Test: Notification Phrase Non-Repetition
    - **Property 13: Notification phrase non-repetition**
    - Zwei aufeinanderfolgende Aufrufe dürfen nicht dieselbe Phrase zurückgeben
    - **Validates: Requirements 7.4**

  - [ ]* 7.5 Property-Test: User Context Categorization
    - **Property 14: User context categorization**
    - Korrekte Zuordnung: 7 Tage konsistent → `'consistent'`, 3+ Tage inaktiv → `'inactive'`, etc.
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

  - [ ]* 7.6 Property-Test: Context-Appropriate Notification Selection
    - **Property 15: Context-appropriate notification selection**
    - Nachricht muss zum Context-Overlay-Pool des aktuellen Zustands passen
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [x] 8. Dashboard Empty States
  - [x] 8.1 `src/components/EmptyState.tsx` und `EmptyState.css` erstellen
    - Wiederverwendbare Komponente mit Icon, deutscher Nachricht und CTA-Button
    - `.adaptive` Klasse, CSS-Variablen, `data-interactive` auf Button, keine Inline-Styles
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 17.1, 17.2, 17.3, 17.4, 17.5_

  - [x] 8.2 `src/views/DashboardView.tsx` erweitern mit Empty States
    - Bedingte Anzeige: EmptyState für fehlende Tages-Daten, Wochen-Daten, Goals
    - CTA navigiert zur entsprechenden Eingabe-View oder Goal-Erstellung
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 9. Goal-Erstellungs-View
  - [x] 9.1 `src/views/GoalCreateView.tsx` und `GoalCreateView.css` erstellen
    - Formular: Metrik-Typ Auswahl, Zone-Selektor (bei Circumference), Zielwert, optionales Deadline-Datum
    - Start-Wert automatisch aus letzter Messung, oder manuell falls keine Daten
    - Validierung: Zielwert ≠ Startwert, deutsche Fehlermeldung
    - `.adaptive`, CSS-Variablen, `data-interactive`, alle Texte auf Deutsch
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7, 17.1, 17.2, 17.3, 17.4, 17.5_

  - [x] 9.2 Route `/goals/new` in `src/App.tsx` registrieren
    - _Requirements: 1.1_

- [x] 10. Goal-Detail-View
  - [x] 10.1 `src/views/GoalDetailView.tsx` und `GoalDetailView.css` erstellen
    - Anzeige: Start-Wert, aktueller Wert, Zielwert, verbleibende Distanz, Zeitrest (bei Deadline)
    - Projection-Daten: Tempo, projiziertes Datum, Trend-Feedback auf Deutsch
    - Aktionen: Archivieren, Löschen
    - Bei erreichten Goals: Gratulationsnachricht, Dauer anzeigen
    - `.adaptive`, CSS-Variablen, `data-interactive`, alle Texte auf Deutsch
    - _Requirements: 2.1, 2.4, 2.5, 2.7, 3.2, 3.3, 3.4, 17.1, 17.2, 17.3, 17.4, 17.5_

  - [x] 10.2 Route `/goals/:id` in `src/App.tsx` registrieren
    - _Requirements: 2.1_

- [x] 11. GoalCard Komponente für Dashboard
  - [x] 11.1 `src/components/GoalCard.tsx` und `GoalCard.css` erstellen
    - Kompakte Anzeige: Fortschrittsbalken, Tempo, Trend
    - Klick navigiert zu GoalDetailView
    - `.adaptive`, CSS-Variablen, `data-interactive`
    - _Requirements: 2.1, 10.2, 17.1, 17.2, 17.3, 17.4_

  - [x] 11.2 GoalCard in `DashboardView` integrieren
    - Aktives Goal anzeigen, oder EmptyState wenn kein Goal existiert
    - _Requirements: 10.2_

- [x] 12. Checkpoint — Phase 1 komplett
  - Sicherstellen, dass alle Tests bestehen. Bei Fragen den User fragen.


- [x] 13. Step-by-Step Circumference Measurement Flow
  - [x] 13.1 `src/components/StepFlowScreen.tsx` und `StepFlowScreen.css` erstellen
    - Einzelne Messzone: großes Nummern-Input, Illustration-Hint, Skip-Button
    - Validierung: Wert zwischen 10.0–200.0 cm
    - Fortschrittsanzeige (stepIndex / totalSteps)
    - `.adaptive`, CSS-Variablen, `data-interactive`, deutsche Texte
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 17.1, 17.2, 17.3, 17.4, 17.5_

  - [x] 13.2 `src/components/StepFlowSummary.tsx` und `StepFlowSummary.css` erstellen
    - Alle eingegebenen Werte anzeigen mit Vergleich zur Vorwoche
    - Differenz-Klassifizierung: < −0.3 cm = Abnahme (grün + positiver Text), ±0.3 = stabil, > +0.3 = Zunahme (neutral)
    - "Erster Eintrag" wenn keine Vorwoche vorhanden
    - Globale ermutigende Nachricht wenn alle Werte stabil/gestiegen
    - Bestätigen- und Zurück-Buttons
    - `.adaptive`, CSS-Variablen, `data-interactive`, deutsche Texte
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 17.1, 17.2, 17.3, 17.4, 17.5_

  - [x] 13.3 `src/views/WeeklyInputView.tsx` refactoren zum Step-Flow
    - Intro-Screen mit Messanleitung auf Deutsch
    - State Machine: step 0 = Intro, 1–6 = Zonen (Brust, Taille, Bauch, Hüfte, Oberarm, Oberschenkel), 7 = Summary
    - Lokaler Component State für Step-Index und Einträge
    - Bestätigung speichert via `saveWeeklyMeasurement()`
    - _Requirements: 5.1, 5.2, 5.6, 5.7_

  - [ ]* 13.4 Property-Test: Step Flow Zone Ordering
    - **Property 9: Step flow zone ordering**
    - Zone an Step-Index i+1 muss der vordefinierten Reihenfolge entsprechen
    - **Validates: Requirements 5.2**

  - [ ]* 13.5 Property-Test: Step Flow Produces Correct WeeklyMeasurement
    - **Property 10: Step flow produces correct WeeklyMeasurement**
    - Eingegebene Werte korrekt übernommen, übersprungene Zonen `undefined`, Datum = Montag der aktuellen Woche
    - **Validates: Requirements 5.5, 5.7**

- [x] 14. Weekly Comparison Utility
  - [x] 14.1 `src/utils/weeklyComparison.ts` erstellen
    - Funktion zur Differenz-Klassifizierung (decrease/stable/increase) mit ±0.3 cm Schwelle
    - Funktion zur Generierung der deutschen Feedback-Texte
    - _Requirements: 6.1, 6.3, 6.4, 6.5_

  - [ ]* 14.2 Property-Test: Weekly Comparison Classification
    - **Property 11: Weekly comparison classification**
    - diff < −0.3 → `'decrease'`, diff > 0.3 → `'increase'`, sonst `'stable'`; alle stabil/gestiegen → ermutigende Nachricht
    - **Validates: Requirements 6.1, 6.3, 6.4, 6.5**

- [x] 15. Checkpoint — Phase 2 komplett
  - Sicherstellen, dass alle Tests bestehen. Bei Fragen den User fragen.


- [x] 16. Gamification Service — Streaks
  - [x] 16.1 `src/services/gamificationService.ts` erstellen mit Streak-Funktionen
    - `updateDailyStreak(date)`: Konsekutive Tage zählen, bei Lücke auf 0 zurücksetzen, in IndexedDB speichern
    - `updateWeeklyStreak(weekStart)`: Konsekutive Wochen zählen, bei Lücke auf 0 zurücksetzen
    - `getStreaks()`: Aktuelle Streak-Daten aus IndexedDB lesen
    - Schwellenwert-Erkennung: 7, 30 Tage (daily); 4, 12 Wochen (weekly)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 16.2 Property-Test: Streak Count Correctness
    - **Property 17: Streak count correctness**
    - Daily Streak = Länge des längsten konsekutiven Tages-Suffix; Weekly Streak analog
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4**

  - [ ]* 16.3 Property-Test: Streak Threshold Detection
    - **Property 18: Streak threshold detection**
    - `thresholdReached` non-null genau dann wenn Count = 7, 30 (daily) oder 4, 12 (weekly)
    - **Validates: Requirements 11.5**

- [x] 17. Gamification Service — Milestones
  - [x] 17.1 `evaluateMilestones(context)` und `getEarnedMilestones()` implementieren
    - Milestone-Typen: `first-goal-reached`, `weight-loss-5kg`, `daily-streak-10`, `daily-streak-30`, `weekly-streak-4`, `weekly-streak-12`
    - Deduplizierung: bereits verdiente Milestones nicht erneut auslösen
    - In IndexedDB speichern mit `earnedAt` Datum
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ]* 17.2 Property-Test: First Goal Reached Milestone
    - **Property 19: First goal reached milestone**
    - Genau ein Goal `reached` + kein `first-goal-reached` Milestone → Milestone wird erzeugt
    - **Validates: Requirements 12.1**

  - [ ]* 17.3 Property-Test: Cumulative Weight Loss Milestone
    - **Property 20: Cumulative weight loss milestone**
    - Kumulativer Gewichtsverlust ≥ 5 kg + kein `weight-loss-5kg` Milestone → Milestone wird erzeugt
    - **Validates: Requirements 12.2**

  - [ ]* 17.4 Property-Test: Daily Streak 10 Milestone
    - **Property 21: Daily streak 10 milestone**
    - `dailyStreak ≥ 10` + kein `daily-streak-10` Milestone → Milestone wird erzeugt
    - **Validates: Requirements 12.3**

  - [ ]* 17.5 Property-Test: Milestone Notified Flag
    - **Property 22: Milestone notified flag**
    - Nach Anzeige als Notification: `notified === true`, nicht mehr in unnotified-Liste
    - **Validates: Requirements 12.5**

- [x] 18. Gamification Service — Consistency Score und Non-Scale Victories
  - [x] 18.1 `calculateConsistencyScore` implementieren
    - Formel: `(daysLogged / 7) * 70 + (weeklyCompleted ? 30 : 0)`, gerundet, 0–100
    - _Requirements: 13.1, 13.2_

  - [x] 18.2 `detectNonScaleVictories` implementieren
    - Check 1: Gewicht stabil (< 0.3 kg über 14 Tage) + Umfang-Zone > 0.5 cm gesunken → NSV
    - Check 2: Körperfett > 0.5% gesunken über 14 Tage → NSV
    - Deutsche Nachrichten generieren
    - _Requirements: 14.1, 14.2, 14.3_

  - [ ]* 18.3 Property-Test: Consistency Score Formula
    - **Property 23: Consistency score formula**
    - Score = `Math.round((daysLogged / 7) * 70 + (weeklyCompleted ? 30 : 0))`, Bereich [0, 100]
    - **Validates: Requirements 13.1, 13.2**

  - [ ]* 18.4 Property-Test: Non-Scale Victory — Circumference Drop
    - **Property 24: Non-scale victory — circumference drop with stable weight**
    - Gewicht stabil + Umfang gesunken → mindestens eine NSV
    - **Validates: Requirements 14.1**

  - [ ]* 18.5 Property-Test: Non-Scale Victory — Body Fat Drop
    - **Property 25: Non-scale victory — body fat drop**
    - Körperfett > 0.5% gesunken → mindestens eine NSV
    - **Validates: Requirements 14.2**

- [x] 19. Checkpoint — Gamification Services komplett
  - Sicherstellen, dass alle Tests bestehen. Bei Fragen den User fragen.


- [x] 20. Dashboard Coaching Summary
  - [x] 20.1 `src/components/CoachingSummary.tsx` und `CoachingSummary.css` erstellen
    - Kompakte Karte: aktuelles Gewicht, 7-Tage-Änderung, aktiver Goal-Status mit Tempo
    - `.adaptive`, CSS-Variablen, `data-interactive`, deutsche Texte
    - _Requirements: 10.1, 10.2, 17.1, 17.2, 17.3, 17.4, 17.5_

  - [x] 20.2 `src/components/BodyCompass.tsx` und `BodyCompass.css` erstellen
    - Trend-Richtung (improving/stable/declining) pro Umfang-Zone basierend auf letzten 3 Messungen
    - "Noch nicht genug Daten" bei < 3 Messungen
    - `.adaptive`, CSS-Variablen, deutsche Texte
    - _Requirements: 10.3, 10.4, 10.5, 17.1, 17.2, 17.4, 17.5_

  - [ ]* 20.3 Property-Test: Body Compass Trend Calculation
    - **Property 16: Body compass trend calculation**
    - ≥3 Messungen: abnehmend → `'improving'`, zunehmend → `'declining'`, sonst `'stable'`; <3 → `null`
    - **Validates: Requirements 10.3, 10.4**

  - [x] 20.4 Consistency Score Anzeige auf Dashboard
    - Wöchentlichen Score mit deutschem Label anzeigen (z.B. "Diese Woche: 86% on track")
    - _Requirements: 13.3_

- [x] 21. Achievement Cards und Achievements View
  - [x] 21.1 `src/components/AchievementCard.tsx` und `AchievementCard.css` erstellen
    - Milestone/Streak-Anzeige-Karte
    - `.adaptive`, CSS-Variablen, `data-interactive`, deutsche Texte
    - _Requirements: 16.1, 16.2, 17.1, 17.2, 17.3, 17.4, 17.5_

  - [x] 21.2 Achievement Cards in `DashboardView` integrieren
    - Maximal 3 Karten, sortiert nach `earnedAt` absteigend
    - Keine Anzeige wenn keine Achievements vorhanden
    - Klick navigiert zu AchievementsView
    - _Requirements: 16.1, 16.2, 16.3, 16.4_

  - [ ]* 21.3 Property-Test: Achievement Display Limit and Recency Ordering
    - **Property 26: Achievement display limit and recency ordering**
    - Maximal 3 Achievements, sortiert nach `earnedAt` absteigend
    - **Validates: Requirements 16.1, 16.2**

  - [x] 21.4 `src/views/AchievementsView.tsx` und `AchievementsView.css` erstellen
    - Vollständige Liste aller verdienten Milestones und aktuellen Streaks
    - `.adaptive`, CSS-Variablen, deutsche Texte
    - _Requirements: 16.3_

  - [x] 21.5 Route `/achievements` in `src/App.tsx` registrieren
    - _Requirements: 16.3_

- [x] 22. Goal Onboarding Flow
  - [x] 22.1 `src/views/GoalOnboarding.tsx` und `GoalOnboarding.css` erstellen
    - Geführter Setup-Flow: Startgewicht setzen, erstes Gewichtsziel erstellen, Erinnerungszeit wählen, optional wöchentliche Umfangmessung aktivieren
    - Jeder Schritt überspringbar
    - Nach Abschluss/Überspringen aller Schritte: Navigation zum Dashboard
    - `.adaptive`, CSS-Variablen, `data-interactive`, deutsche Texte
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 17.1, 17.2, 17.3, 17.4, 17.5_

  - [x] 22.2 Route `/onboarding` in `src/App.tsx` registrieren und Trigger-Logik einbauen
    - Trigger: nach Fitbit-Verbindung wenn keine Goals existieren, oder beim ersten App-Start ohne Daten und Goals
    - _Requirements: 15.1, 15.2_

- [x] 23. Dashboard Coaching Integration und Wiring
  - [x] 23.1 `src/views/DashboardView.tsx` komplett verdrahten
    - CoachingSummary, GoalCard, BodyCompass, AchievementCards oberhalb der bestehenden Graph-Tabs einbauen
    - Bedingte Anzeige: EmptyState pro Sektion wenn Daten fehlen
    - Consistency Score Anzeige
    - Non-Scale Victory Nachrichten anzeigen wenn vorhanden
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 10.1, 10.2, 10.3, 13.3, 14.1, 14.2, 16.1, 16.4_

  - [x] 23.2 Gamification-Hooks in Mess-Speicherung einbauen
    - Nach `saveDailyMeasurement`: `updateDailyStreak`, `evaluateGoals`, `evaluateMilestones`, `detectNonScaleVictories` aufrufen
    - Nach `saveWeeklyMeasurement`: `updateWeeklyStreak`, `evaluateGoals`, `evaluateMilestones`, `detectNonScaleVictories` aufrufen
    - _Requirements: 3.1, 11.3, 12.4, 14.3_

- [x] 24. Final Checkpoint — Alle Phasen komplett
  - Sicherstellen, dass alle Tests bestehen. Bei Fragen den User fragen.

## Notes

- Tasks mit `*` sind optional und können für ein schnelleres MVP übersprungen werden
- Jeder Task referenziert spezifische Requirements für Nachverfolgbarkeit
- Checkpoints sichern inkrementelle Validierung
- Property-Tests validieren universelle Korrektheitseigenschaften (fast-check)
- Alle UI-Texte auf Deutsch, DB UX Design System Konventionen durchgehend
- Services sind pure Logic-Module ohne UI-Code, unabhängig testbar
