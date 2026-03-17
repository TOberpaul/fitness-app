# Requirements Document

## Einleitung

Restrukturierung des Gamification-Systems der Fitness-Tracker-PWA. Das aktuelle System zeigt Achievements, Streaks, Non-Scale-Victories und Status-Informationen in einer unstrukturierten "kognitiven Suppe" an. Die Neustrukturierung führt ein klares 3-Schichten-Modell ein: Live-Status (tägliches Feedback), Progress/Journey (Fortschrittssystem mit Levels) und Achievements (echte Meilensteine). Ziel ist ein minimalistisches, nicht-cringe Gamification-System, bei dem Achievements auf etwas hinführen.

## Glossar

- **GoalsView**: Die Hauptansicht (`src/views/GoalsView.tsx`), die Ziele, Coaching und Gamification-Elemente anzeigt
- **Live_Status**: Oberer Bereich der GoalsView — zeigt tägliches Echtzeit-Feedback zum aktuellen Fortschritt (z.B. "Du bist auf Kurs", "leicht voraus", "hinter Plan")
- **Progress_Journey**: Mittlerer Bereich der GoalsView — zeigt den Gesamtfortschritt als Level-System mit Fortschrittsbalken (z.B. "8 / 15 kg erreicht", Level 2 / 4)
- **Achievement_Section**: Unterer Bereich der GoalsView — zeigt ausschließlich echte, verdiente Meilensteine als kompakte Karten (keine Fließtexte)
- **Level_System**: Stufenbasiertes Fortschrittssystem, das den Gesamtfortschritt eines Ziels in diskrete Stufen unterteilt (z.B. Level 1: 0–2 kg, Level 2: 2–5 kg)
- **Progress_Achievement**: Meilenstein, der durch messbaren Fortschritt verdient wird (z.B. "5 kg verloren", "Ziel erreicht")
- **Streak_Achievement**: Meilenstein, der durch konsistentes Tracking verdient wird (z.B. "7 Tage eingetragen", "3 Wochen am Stück")
- **Micro_Win**: Kurzfristiges Echtzeit-Feedback zu positiven Veränderungen (z.B. "+0.6% Fett verloren", "on track") — gehört in den Live_Status, nicht in Achievements
- **Gamification_Service**: Der Service (`src/services/gamificationService.ts`), der Streaks, Meilensteine, Konsistenz-Scores und Non-Scale-Victories berechnet
- **Goal_Projection**: Berechnete Prognose für ein Ziel, enthält aktuellen Wert, Fortschritt in Prozent und Trend-Feedback
- **Locked_Achievement**: Ein Achievement, das noch nicht verdient wurde, aber als gesperrte Vorschau sichtbar ist

## Requirements

### Requirement 1: 3-Schichten-Layout der GoalsView

**User Story:** Als Nutzer möchte ich die Gamification-Informationen in drei klar getrennten Bereichen sehen, damit ich sofort verstehe, was mein aktueller Status ist, wie weit ich insgesamt bin und welche Meilensteine ich erreicht habe.

#### Acceptance Criteria

1. WHEN die GoalsView mindestens ein aktives Ziel enthält, THE GoalsView SHALL die drei Bereiche in fester Reihenfolge anzeigen: Live_Status oben, Progress_Journey in der Mitte, Achievement_Section unten
2. THE GoalsView SHALL den bisherigen Abschnitt "Fortschritt & Erfolge" durch die drei neuen Bereiche ersetzen
3. WHEN kein aktives Ziel existiert, THE GoalsView SHALL weder Live_Status noch Progress_Journey noch Achievement_Section anzeigen

### Requirement 2: Live-Status-Bereich

**User Story:** Als Nutzer möchte ich auf einen Blick sehen, ob ich heute auf Kurs bin, damit ich tägliches Feedback zu meinem Fortschritt bekomme.

#### Acceptance Criteria

1. THE Live_Status SHALL den Trend-Feedback-Wert des primären Gewichtsziels als kurzen deutschen Text anzeigen ("auf Kurs", "leicht voraus", "hinter Plan")
2. WHEN eine messbare Veränderung in Körperfett oder Umfang innerhalb der letzten 14 Tage vorliegt, THE Live_Status SHALL diese als Micro_Win anzeigen (z.B. "+0.6% Körperfett reduziert")
3. THE Live_Status SHALL den wöchentlichen Konsistenz-Score als kompakten Indikator anzeigen
4. THE Live_Status SHALL keine Achievement-Karten oder Meilenstein-Informationen enthalten
5. WHEN nicht genug Daten für eine Trend-Berechnung vorliegen, THE Live_Status SHALL den Text "Noch nicht genug Daten" anzeigen

### Requirement 3: Progress/Journey-Bereich mit Level-System

**User Story:** Als Nutzer möchte ich meinen Gesamtfortschritt als Level-System sehen, damit ich ein klares Ziel vor Augen habe und motiviert bleibe.

#### Acceptance Criteria

1. THE Progress_Journey SHALL für jedes aktive Ziel ein Level-System berechnen, das den Gesamtfortschritt in mindestens 3 Stufen unterteilt
2. THE Progress_Journey SHALL das aktuelle Level, den Fortschritt innerhalb des Levels und den Gesamtfortschritt als Fortschrittsbalken anzeigen
3. WHEN ein Nutzer ein neues Level erreicht, THE Progress_Journey SHALL das neue Level visuell hervorheben
4. THE Progress_Journey SHALL den absoluten Fortschritt anzeigen (z.B. "8 / 15 kg erreicht")
5. THE Level_System SHALL die Stufen basierend auf der Gesamtdistanz zwischen Start- und Zielwert gleichmäßig berechnen
6. WHEN ein Ziel den Metrik-Typ "weight" hat, THE Level_System SHALL die Stufen in kg-Schritten berechnen
7. WHEN ein Ziel den Metrik-Typ "bodyFat" hat, THE Level_System SHALL die Stufen in Prozentpunkt-Schritten berechnen
8. WHEN ein Ziel den Metrik-Typ "circumference" hat, THE Level_System SHALL die Stufen in cm-Schritten berechnen

### Requirement 4: Achievement-Bereich (nur echte Meilensteine)

**User Story:** Als Nutzer möchte ich nur echte, verdiente Meilensteine als Achievements sehen, damit die Achievements bedeutungsvoll bleiben und auf etwas hinführen.

#### Acceptance Criteria

1. THE Achievement_Section SHALL ausschließlich Progress_Achievements und Streak_Achievements anzeigen
2. THE Achievement_Section SHALL keine Micro_Wins, keine Non-Scale-Victories und keine Konsistenz-Scores enthalten
3. THE Achievement_Section SHALL jedes Achievement als kompakte Karte ohne Fließtext anzeigen
4. THE Achievement_Section SHALL verdiente Achievements mit einem Häkchen-Symbol und gesperrte Achievements mit einem Schloss-Symbol anzeigen
5. WHEN ein Achievement verdient wird, THE Achievement_Section SHALL das Achievement von gesperrt auf verdient umschalten
6. THE Achievement_Section SHALL die Achievements in zwei Gruppen anzeigen: verdiente Achievements zuerst, gesperrte Achievements danach

### Requirement 5: Progress-Achievements

**User Story:** Als Nutzer möchte ich Meilensteine für messbaren Fortschritt erhalten, damit ich für meine Ergebnisse belohnt werde.

#### Acceptance Criteria

1. WHEN ein Nutzer kumulativ 2 kg Gewicht verloren hat, THE Gamification_Service SHALL das Achievement "2 kg verloren" als verdient markieren
2. WHEN ein Nutzer kumulativ 5 kg Gewicht verloren hat, THE Gamification_Service SHALL das Achievement "5 kg verloren" als verdient markieren
3. WHEN ein Nutzer kumulativ 10 kg Gewicht verloren hat, THE Gamification_Service SHALL das Achievement "10 kg verloren" als verdient markieren
4. WHEN ein Nutzer sein erstes Ziel erreicht, THE Gamification_Service SHALL das Achievement "Erstes Ziel erreicht" als verdient markieren
5. THE Gamification_Service SHALL jedes Progress_Achievement genau einmal vergeben (Deduplizierung)
6. THE Gamification_Service SHALL neu verdiente Progress_Achievements in IndexedDB persistieren

### Requirement 6: Streak-Achievements

**User Story:** Als Nutzer möchte ich Meilensteine für konsistentes Tracking erhalten, damit meine Regelmäßigkeit belohnt wird.

#### Acceptance Criteria

1. WHEN ein Nutzer 7 aufeinanderfolgende Tage gewogen hat, THE Gamification_Service SHALL das Achievement "7 Tage eingetragen" als verdient markieren
2. WHEN ein Nutzer 30 aufeinanderfolgende Tage gewogen hat, THE Gamification_Service SHALL das Achievement "30 Tage eingetragen" als verdient markieren
3. WHEN ein Nutzer 3 aufeinanderfolgende Wochen Umfänge gemessen hat, THE Gamification_Service SHALL das Achievement "3 Wochen am Stück" als verdient markieren
4. WHEN ein Nutzer 10 aufeinanderfolgende Wochen Umfänge gemessen hat, THE Gamification_Service SHALL das Achievement "10 Wochen getrackt" als verdient markieren
5. IF ein Streak unterbrochen wird, THEN THE Gamification_Service SHALL bereits verdiente Streak_Achievements beibehalten und den Streak-Zähler auf 0 zurücksetzen
6. THE Gamification_Service SHALL jedes Streak_Achievement genau einmal vergeben (Deduplizierung)

### Requirement 7: Micro-Wins im Live-Status

**User Story:** Als Nutzer möchte ich kurzfristiges positives Feedback im Live-Status sehen, damit ich sofort erkenne, dass sich etwas verbessert hat.

#### Acceptance Criteria

1. WHEN der Körperfettanteil innerhalb der letzten 14 Tage um mehr als 0.5% gesunken ist, THE Live_Status SHALL einen Micro_Win mit dem Wert der Reduktion anzeigen
2. WHEN ein Umfangswert innerhalb der letzten 14 Tage um mehr als 0.5 cm gesunken ist, THE Live_Status SHALL einen Micro_Win mit Zone und Wert anzeigen
3. THE Live_Status SHALL Micro_Wins als kurze, einzeilige Texte ohne Fließtext anzeigen
4. THE Live_Status SHALL Micro_Wins klar vom Trend-Status-Text trennen

### Requirement 8: Entfernung der alten Gamification-Darstellung

**User Story:** Als Nutzer möchte ich keine gemischte "kognitive Suppe" mehr sehen, damit die Informationen klar strukturiert sind.

#### Acceptance Criteria

1. THE GoalsView SHALL den bisherigen Abschnitt "Fortschritt & Erfolge" vollständig entfernen
2. THE GoalsView SHALL Non-Scale-Victory-Karten nicht mehr als eigenständige Karten im Achievement-Bereich anzeigen
3. THE GoalsView SHALL Streak-Informationen nicht mehr als separate Karten neben Milestones anzeigen
4. THE GoalsView SHALL den Konsistenz-Score nicht mehr als Notification im Achievement-Bereich anzeigen
5. THE CoachingSummary SHALL weiterhin als eigenständige Komponente oberhalb der Ziele bestehen bleiben

### Requirement 9: Achievement-Datenmodell

**User Story:** Als Entwickler möchte ich ein erweiterbares Datenmodell für Achievements, damit neue Achievement-Typen einfach hinzugefügt werden können.

#### Acceptance Criteria

1. THE Gamification_Service SHALL jeden Achievement-Typ mit einer eindeutigen ID, einem deutschen Label, einem Kategorie-Feld ("progress" oder "streak") und einem Status ("locked" oder "earned") speichern
2. THE Gamification_Service SHALL für verdiente Achievements das Datum der Erreichung speichern
3. THE Gamification_Service SHALL eine vollständige Liste aller definierten Achievements bereitstellen (verdiente und gesperrte)
4. WHEN die App gestartet wird, THE Gamification_Service SHALL alle Achievement-Definitionen mit dem aktuellen Verdienst-Status aus IndexedDB zusammenführen

### Requirement 10: Level-Berechnung

**User Story:** Als Entwickler möchte ich eine deterministische Level-Berechnung, damit der Fortschritt konsistent und nachvollziehbar dargestellt wird.

#### Acceptance Criteria

1. THE Level_System SHALL die Gesamtdistanz (Startwert minus Zielwert) in gleich große Stufen aufteilen
2. THE Level_System SHALL mindestens 3 und höchstens 5 Stufen pro Ziel berechnen
3. THE Level_System SHALL das aktuelle Level basierend auf dem aktuellen Messwert und den Stufengrenzen bestimmen
4. WHEN der aktuelle Wert den Zielwert erreicht oder überschreitet, THE Level_System SHALL das höchste Level als erreicht markieren
5. FOR ALL gültigen Ziele, THE Level_System SHALL bei identischen Eingabewerten (Startwert, Zielwert, aktueller Wert) identische Level-Ergebnisse liefern (Determinismus)
