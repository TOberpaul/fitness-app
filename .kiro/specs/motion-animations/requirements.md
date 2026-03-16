# Anforderungsdokument: Motion-Animationen

## Einführung

Integration der motion.dev-Animationsbibliothek (ehemals Framer Motion) in die bestehende React-Fitness-Tracking-PWA, um durch sinnvolle, performante Animationen ein hochwertigeres UI-Erlebnis zu schaffen. Die Animationen sollen die Benutzerführung verbessern, visuelle Hierarchien verdeutlichen und Interaktionen spürbar machen — ohne die Performance oder Barrierefreiheit zu beeinträchtigen.

## Glossar

- **Animations_System**: Das zentrale Modul, das motion.dev in die App integriert und wiederverwendbare Animations-Presets bereitstellt
- **Dialog_Komponente**: Die modale Overlay-Komponente (`Dialog.tsx`), die für GoalCreateView, WeeklyInputView und GoalOnboarding verwendet wird
- **Snap_Container**: Der horizontale Scroll-Container in `App.tsx`, der die 5 Hauptpanels (Dashboard, Täglich, Wöchentlich, Ziele, Mehr) enthält
- **GoalCard_Komponente**: Die Karten-Komponente, die ein einzelnes Ziel mit Fortschrittsbalken darstellt
- **AchievementCard_Komponente**: Die Karten-Komponente für Meilensteine und Streak-Erfolge
- **BottomNavigation_Komponente**: Die untere Navigationsleiste mit 5 Tab-Buttons
- **StepFlow_Komponente**: Die Schritt-für-Schritt-Eingabe-Komponente für wöchentliche Umfangmessungen
- **CoachingSummary_Komponente**: Die Zusammenfassungs-Komponente mit aktuellen Gewichtsdaten und Zielstatus
- **BodyCompass_Komponente**: Die Visualisierung der Umfang-Trends pro Körperzone
- **Staggered_Animation**: Eine Animation, bei der mehrere Elemente nacheinander mit zeitlichem Versatz eingeblendet werden
- **Layout_Animation**: Eine Animation, die automatisch Positionsänderungen von Elementen im DOM animiert
- **AnimatePresence**: Die motion.dev-Komponente, die Exit-Animationen für Elemente ermöglicht, die aus dem DOM entfernt werden
- **Reduced_Motion**: Die Betriebssystem-Einstellung `prefers-reduced-motion`, die anzeigt, dass der Nutzer weniger Bewegung bevorzugt

## Anforderungen

### Anforderung 1: Bibliothek-Setup und Animations-Presets

**User Story:** Als Entwickler möchte ich ein zentrales Animations-Modul mit wiederverwendbaren Presets, damit Animationen konsistent und wartbar in der gesamten App eingesetzt werden.

#### Akzeptanzkriterien

1. THE Animations_System SHALL motion.dev als Abhängigkeit bereitstellen und zentrale Animations-Presets (Fade-In, Slide-Up, Scale-In, Stagger-Delay) als exportierte Konfigurationsobjekte definieren
2. THE Animations_System SHALL alle Animations-Dauern und Easing-Kurven als benannte Konstanten in einer zentralen Datei definieren
3. WHEN die Betriebssystem-Einstellung `prefers-reduced-motion: reduce` aktiv ist, THEN THE Animations_System SHALL alle Animationen auf sofortige Zustandsänderungen ohne Bewegung reduzieren
4. THE Animations_System SHALL Animationen mit einer maximalen Dauer von 400ms für Mikro-Interaktionen und 600ms für Seitenübergänge ausführen

### Anforderung 2: Dialog-Ein- und Austrittsanimationen

**User Story:** Als Nutzer möchte ich, dass Dialoge mit einer flüssigen Animation erscheinen und verschwinden, damit modale Übergänge natürlich wirken.

#### Akzeptanzkriterien

1. WHEN ein Dialog geöffnet wird, THE Dialog_Komponente SHALL den Dialog-Inhalt mit einer kombinierten Fade-In- und Slide-Up-Animation von unten einblenden
2. WHEN ein Dialog geschlossen wird, THE Dialog_Komponente SHALL den Dialog-Inhalt mit einer Fade-Out- und Slide-Down-Animation ausblenden, bevor das Element aus dem DOM entfernt wird
3. WHEN ein Dialog geöffnet wird, THE Dialog_Komponente SHALL den Backdrop mit einer Fade-In-Animation einblenden
4. THE Dialog_Komponente SHALL AnimatePresence von motion.dev verwenden, um Exit-Animationen vor dem Entfernen aus dem DOM zu ermöglichen

### Anforderung 3: Karten-Eingangsanimationen mit Stagger-Effekt

**User Story:** Als Nutzer möchte ich, dass Karten in Listen nacheinander eingeblendet werden, damit die Oberfläche lebendig und strukturiert wirkt.

#### Akzeptanzkriterien

1. WHEN die GoalsView geladen wird, THE GoalCard_Komponente SHALL jede Karte mit einer Staggered_Animation einblenden, wobei jede Karte mit einem Versatz von 50–80ms nach der vorherigen erscheint
2. WHEN die GoalsView geladen wird, THE AchievementCard_Komponente SHALL Meilenstein-Karten mit einer Staggered_Animation einblenden
3. THE GoalCard_Komponente SHALL beim Einblenden eine kombinierte Fade-In- und Slide-Up-Animation verwenden
4. THE AchievementCard_Komponente SHALL beim Einblenden eine kombinierte Fade-In- und Scale-In-Animation verwenden

### Anforderung 4: Fortschrittsbalken-Animation

**User Story:** Als Nutzer möchte ich, dass der Fortschrittsbalken meiner Ziele animiert aufgefüllt wird, damit der Fortschritt visuell erlebbar ist.

#### Akzeptanzkriterien

1. WHEN eine GoalCard_Komponente sichtbar wird, THE GoalCard_Komponente SHALL den Fortschrittsbalken von 0% bis zum aktuellen Prozentwert mit einer animierten Breitenänderung füllen
2. THE GoalCard_Komponente SHALL die Fortschrittsbalken-Animation mit einer Dauer von 600ms und einer Ease-Out-Kurve ausführen
3. WHEN sich der Fortschrittswert eines Ziels ändert, THE GoalCard_Komponente SHALL den Fortschrittsbalken vom vorherigen zum neuen Wert animieren

### Anforderung 5: Zahlen-Animationen für Statistiken

**User Story:** Als Nutzer möchte ich, dass Zahlenwerte im Dashboard und in der CoachingSummary animiert hochzählen, damit Datenänderungen wahrnehmbar sind.

#### Akzeptanzkriterien

1. WHEN das Dashboard geladen wird, THE DashboardView SHALL den aktuellen Gewichtswert mit einer Zähl-Animation vom vorherigen zum aktuellen Wert darstellen
2. WHEN das Dashboard geladen wird, THE DashboardView SHALL die prozentuale Veränderung mit einer Zähl-Animation darstellen
3. THE CoachingSummary_Komponente SHALL Zahlenwerte (aktuelles Gewicht, 7-Tage-Änderung) mit einer Zähl-Animation darstellen
4. THE Animations_System SHALL die Zähl-Animation mit der motion.dev `animate`-Funktion und einer Dauer von 400ms umsetzen

### Anforderung 6: Interaktives Tap- und Hover-Feedback

**User Story:** Als Nutzer möchte ich visuelles Feedback bei Berührung und Hover auf interaktiven Elementen, damit die App reaktionsfreudig wirkt.

#### Akzeptanzkriterien

1. WHEN ein Nutzer eine GoalCard_Komponente berührt oder klickt, THE GoalCard_Komponente SHALL eine kurze Scale-Down-Animation (auf 97–98%) ausführen
2. WHEN ein Nutzer den Finger oder die Maustaste loslässt, THE GoalCard_Komponente SHALL zur Originalgröße zurückkehren
3. WHEN ein Nutzer eine AchievementCard_Komponente berührt, THE AchievementCard_Komponente SHALL eine kurze Scale-Down-Animation ausführen
4. THE Animations_System SHALL Tap-Feedback über die motion.dev `whileTap`-Eigenschaft umsetzen

### Anforderung 7: StepFlow-Schrittübergänge

**User Story:** Als Nutzer möchte ich, dass die Schritte der wöchentlichen Umfangmessung mit einer Slide-Animation wechseln, damit der Fortschritt im Eingabefluss spürbar ist.

#### Akzeptanzkriterien

1. WHEN der Nutzer zum nächsten Schritt navigiert, THE StepFlow_Komponente SHALL den aktuellen Schritt nach links herausschieben und den neuen Schritt von rechts hereinschieben
2. WHEN der Nutzer zum vorherigen Schritt navigiert, THE StepFlow_Komponente SHALL den aktuellen Schritt nach rechts herausschieben und den neuen Schritt von links hereinschieben
3. THE StepFlow_Komponente SHALL AnimatePresence mit einer richtungsabhängigen Slide-Animation verwenden
4. WHEN der Nutzer zur Zusammenfassung gelangt, THE StepFlow_Komponente SHALL die Zusammenfassung mit einer Fade-In-Animation einblenden

### Anforderung 8: BottomNavigation-Indikator-Animation

**User Story:** Als Nutzer möchte ich, dass der aktive Tab in der Navigation mit einer sanften Animation hervorgehoben wird, damit der Wechsel zwischen Panels visuell begleitet wird.

#### Akzeptanzkriterien

1. WHEN der aktive Tab wechselt, THE BottomNavigation_Komponente SHALL den aktiven Zustand (Hintergrund/Material-Wechsel) mit einer Layout_Animation von motion.dev animieren
2. THE BottomNavigation_Komponente SHALL die Indikator-Animation mit einer Dauer von 250ms und einer Spring-Kurve ausführen
3. THE BottomNavigation_Komponente SHALL die `layoutId`-Eigenschaft von motion.dev verwenden, um den aktiven Indikator zwischen Tabs zu animieren

### Anforderung 9: BodyCompass- und Gamification-Animationen

**User Story:** Als Nutzer möchte ich, dass Gamification-Elemente wie Konsistenz-Score, Non-Scale-Victories und der Körperkompass animiert erscheinen, damit Erfolge visuell gefeiert werden.

#### Akzeptanzkriterien

1. WHEN die GoalsView geladen wird, THE BodyCompass_Komponente SHALL die Trend-Zeilen mit einer Staggered_Animation einblenden
2. WHEN die GoalsView geladen wird, THE GoalsView SHALL den Konsistenz-Score-Bereich mit einer Fade-In- und Scale-In-Animation einblenden
3. WHEN die GoalsView geladen wird, THE GoalsView SHALL Non-Scale-Victory-Nachrichten mit einer Staggered_Animation einblenden
4. WHEN die GoalsView geladen wird, THE GoalsView SHALL Streak-Karten mit einer Staggered_Animation und einer leichten Bounce-Kurve einblenden

### Anforderung 10: Listenelement-Animationen bei Datenänderungen

**User Story:** Als Nutzer möchte ich, dass beim Hinzufügen oder Entfernen von Zielen die Liste animiert aktualisiert wird, damit Änderungen nachvollziehbar sind.

#### Akzeptanzkriterien

1. WHEN ein neues Ziel erstellt wird, THE GoalsView SHALL die neue GoalCard_Komponente mit einer Eingangsanimation in die Liste einfügen
2. WHEN ein Ziel entfernt wird, THE GoalsView SHALL die GoalCard_Komponente mit einer Exit-Animation aus der Liste entfernen
3. THE GoalsView SHALL AnimatePresence von motion.dev verwenden, um Ein- und Austrittsanimationen der Listenelemente zu koordinieren
4. WHEN sich die Reihenfolge der Ziele ändert, THE GoalsView SHALL die Positionsänderungen der GoalCard_Komponenten mit einer Layout_Animation animieren

### Anforderung 11: EmptyState-Animation

**User Story:** Als Nutzer möchte ich, dass der Leer-Zustand mit einer einladenden Animation erscheint, damit die App auch ohne Daten lebendig wirkt.

#### Akzeptanzkriterien

1. WHEN keine Daten vorhanden sind, THE EmptyState SHALL den Inhalt (Icon, Nachricht, Button) mit einer gestaffelten Fade-In- und Slide-Up-Animation einblenden
2. THE EmptyState SHALL die Animation mit einem initialen Verzögerungswert von 200ms starten, damit der Leer-Zustand nicht abrupt erscheint

### Anforderung 12: Performance und Barrierefreiheit

**User Story:** Als Nutzer möchte ich, dass Animationen die App-Performance nicht beeinträchtigen und für alle Nutzer zugänglich sind.

#### Akzeptanzkriterien

1. THE Animations_System SHALL ausschließlich `transform`- und `opacity`-Eigenschaften für Animationen verwenden, um GPU-beschleunigte Compositing-Animationen sicherzustellen
2. THE Animations_System SHALL die `prefers-reduced-motion`-Media-Query respektieren und bei aktivierter Einstellung alle Bewegungsanimationen deaktivieren
3. THE Animations_System SHALL keine Animationen verwenden, die den Zugang zu Inhalten blockieren oder verzögern
4. THE Animations_System SHALL sicherstellen, dass alle animierten Elemente ihre bestehenden ARIA-Attribute und Tastatur-Zugänglichkeit beibehalten
