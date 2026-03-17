# Tasks

## Task 1: Achievement-Datenmodell erweitern
- [x] Neue Typen in `src/types/index.ts` hinzufügen: `AchievementDefinition` (id, label, category: 'progress' | 'streak', icon), `AchievementStatus` ('locked' | 'earned'), `Achievement` (definition + status + earnedAt?), `LevelInfo` (level, totalLevels, levelProgress, overallProgress, absoluteText)
- [x] `MilestoneType` um neue Typen erweitern: `weight-loss-2kg`, `weight-loss-10kg`, `daily-streak-7`, `weekly-streak-3`, `weekly-streak-10`
- [x] Bestehende `Milestone`-Typen beibehalten für Rückwärtskompatibilität
- [x] Alle 266 Tests müssen weiterhin bestehen

**Requirements:** 9.1, 9.2, 9.3, 9.4

## Task 2: Level-System im GamificationService implementieren
- [x] `computeLevelInfo(goal: Goal, currentValue: number): LevelInfo` Funktion in `src/services/gamificationService.ts` erstellen
- [x] Gesamtdistanz (startValue → targetValue) in 3–5 gleich große Stufen aufteilen (3 bei <6 Einheiten Distanz, 4 bei <12, sonst 5)
- [x] Aktuelles Level basierend auf aktuellem Messwert und Stufengrenzen bestimmen
- [x] Fortschritt innerhalb des aktuellen Levels als Prozent berechnen
- [x] Absoluten Fortschrittstext generieren (z.B. "8 / 15 kg erreicht")
- [x] Determinismus: identische Eingaben → identische Ergebnisse
- [x] Unit-Tests für Level-Berechnung mit weight, bodyFat und circumference Metriken

**Requirements:** 10.1, 10.2, 10.3, 10.4, 10.5, 3.5, 3.6, 3.7, 3.8

## Task 3: Achievement-Registry und Evaluation erweitern
- [x] `ACHIEVEMENT_DEFINITIONS` Array mit allen Progress- und Streak-Achievements definieren (2kg, 5kg, 10kg, erstes Ziel, 7 Tage, 30 Tage, 3 Wochen, 10 Wochen)
- [x] `getAllAchievements(): Promise<Achievement[]>` — merged Definitionen mit earned-Status aus IndexedDB
- [x] `evaluateMilestones` erweitern um neue Typen: `weight-loss-2kg` (≥2kg), `weight-loss-10kg` (≥10kg), `daily-streak-7` (≥7), `weekly-streak-3` (≥3), `weekly-streak-10` (≥10)
- [x] Deduplizierung beibehalten — jedes Achievement nur einmal vergeben
- [x] Bestehende Tests in `src/services/__tests__/gamificationService.test.ts` anpassen und neue Tests hinzufügen

**Requirements:** 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 9.1, 9.2, 9.3, 9.4

## Task 4: Micro-Win-Erkennung für Live-Status
- [x] `detectMicroWins(dailyMeasurements, weeklyMeasurements): MicroWin[]` Funktion erstellen (oder bestehende `detectNonScaleVictories` refactoren)
- [x] Körperfett-Check: >0.5% Reduktion in 14 Tagen → MicroWin mit Wert
- [x] Umfang-Check: >0.5cm Reduktion in 14 Tagen → MicroWin mit Zone und Wert
- [x] Rückgabe als kurze einzeilige Texte (z.B. "−0.6% Körperfett", "−1.2 cm Taille")
- [x] Unit-Tests für Micro-Win-Erkennung

**Requirements:** 7.1, 7.2, 7.3, 7.4

## Task 5: Live-Status-Komponente erstellen
- [x] `src/components/LiveStatus.tsx` + `src/components/LiveStatus.css` erstellen
- [x] Props: `projection: GoalProjection | null`, `consistencyScore: ConsistencyScore | null`, `microWins: MicroWin[]`
- [x] Trend-Feedback als prominenten Text anzeigen: "auf Kurs" / "leicht voraus" / "hinter Plan" / "Noch nicht genug Daten"
- [x] Konsistenz-Score als kompakten Indikator (Notification-Komponente mit Farbe basierend auf Score)
- [x] Micro-Wins als kurze einzeilige Texte darunter
- [x] Keine Achievement-Karten oder Meilenstein-Informationen
- [x] Design-System-Konventionen: `.adaptive`, `data-*` Attribute, `var(--size-*)` Tokens

**Requirements:** 2.1, 2.2, 2.3, 2.4, 2.5

## Task 6: Progress/Journey-Komponente erstellen
- [x] `src/components/ProgressJourney.tsx` + `src/components/ProgressJourney.css` erstellen
- [x] Props: `goals: Goal[]`, `projections: Map<string, GoalProjection>`, `dailyMeasurements: DailyMeasurement[]`, `weeklyMeasurements: WeeklyMeasurement[]`
- [x] Für jedes aktive Ziel: Level-Info via `computeLevelInfo` berechnen und anzeigen
- [x] Fortschrittsbalken für Gesamtfortschritt (CSS mit `var(--size-*)` Tokens, `data-color` basierend auf Trend)
- [x] Aktuelles Level + Gesamtlevels anzeigen (z.B. "Level 2 / 4")
- [x] Absoluten Fortschritt anzeigen (z.B. "8 / 15 kg erreicht")
- [x] Design-System-Konventionen einhalten

**Requirements:** 3.1, 3.2, 3.3, 3.4

## Task 7: Achievement-Section-Komponente erstellen
- [x] `src/components/AchievementSection.tsx` + `src/components/AchievementSection.css` erstellen
- [x] Props: `achievements: Achievement[]`
- [x] Nur Progress- und Streak-Achievements anzeigen (keine Micro-Wins, keine NSVs, keine Konsistenz-Scores)
- [x] Verdiente Achievements: Häkchen-Symbol + Label, gesperrte: Schloss-Symbol + Label
- [x] Sortierung: verdiente zuerst, gesperrte danach
- [x] Kompakte Karten ohne Fließtext
- [x] Bestehende `AchievementCard`-Komponente wiederverwenden oder anpassen
- [ ] Design-System-Konventionen einhalten

**Requirements:** 4.1, 4.2, 4.3, 4.4, 4.5, 4.6

## Task 8: GoalsView auf 3-Schichten-Layout umbauen
- [x] Alten "Fortschritt & Erfolge" Abschnitt komplett entfernen (Konsistenz-Notification, NSV-Karten, Milestone-Karten, Streak-Karten)
- [x] `LiveStatus`-Komponente nach CoachingSummary und vor "Aktive Ziele" einbauen
- [x] `ProgressJourney`-Komponente nach "Aktive Ziele" Section einbauen
- [x] `AchievementSection`-Komponente als letzten Bereich einbauen
- [x] Reihenfolge: CoachingSummary → Live-Status → Aktive Ziele → Körperkompass → Progress/Journey → Achievements
- [x] Alle drei Bereiche nur anzeigen wenn mindestens ein aktives Ziel existiert
- [x] CoachingSummary bleibt als eigenständige Komponente bestehen
- [x] Nicht mehr benötigte Imports und CSS-Klassen entfernen
- [ ] Alle 266 Tests müssen weiterhin bestehen

**Requirements:** 1.1, 1.2, 1.3, 8.1, 8.2, 8.3, 8.4, 8.5
