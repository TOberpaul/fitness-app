# Implementierungsplan: Motion-Animationen

## Übersicht

Schrittweise Integration der `motion.dev`-Bibliothek in die bestehende React/TypeScript-PWA. Zuerst wird das zentrale Animations-Modul (`src/animations/`) mit Presets und Hooks erstellt, dann werden die bestehenden Komponenten nacheinander um motion-Wrapper ergänzt. Jeder Schritt baut auf dem vorherigen auf und endet mit der Verdrahtung aller Teile.

## Tasks

- [x] 1. motion.dev installieren und zentrales Animations-Modul erstellen
  - [x] 1.1 `motion`-Paket als Abhängigkeit installieren und `src/animations/presets.ts` erstellen
    - `motion` (v11+) als dependency hinzufügen
    - Timing-Konstanten (`DURATIONS`, `EASINGS`, `STAGGER_DELAY`) definieren
    - Alle Animations-Varianten exportieren: `fadeIn`, `slideUp`, `scaleIn`, `dialogVariants`, `backdropVariants`, `staggerContainer`, `tapFeedback`
    - `REDUCED_MOTION_VARIANTS` mit `duration: 0` definieren
    - `AnimationVariants`-Typ exportieren
    - _Anforderungen: 1.1, 1.2, 1.4_

  - [x] 1.2 `src/animations/hooks.ts` erstellen mit Custom Hooks
    - `useReducedMotion()` implementieren (Wrapper um motion.dev `useReducedMotion`)
    - `getVariants(variants, reducedMotion)` implementieren — gibt `REDUCED_MOTION_VARIANTS` zurück wenn reduced motion aktiv
    - `useAnimatedNumber(value, decimals, duration)` implementieren — nutzt `animate()` von motion.dev
    - _Anforderungen: 1.3, 5.4, 12.2_

  - [ ]* 1.3 Property-Test: Reduced-Motion erzeugt sofortige Übergänge
    - **Property 1: Reduced-Motion erzeugt sofortige Übergänge**
    - Datei: `src/animations/__tests__/presets.test.ts`
    - Generiert zufällige Varianten-Objekte mit fast-check, prüft dass `getVariants(v, true)` immer `duration: 0` liefert
    - **Validiert: Anforderungen 1.3, 12.2**

  - [ ]* 1.4 Property-Test: Nur GPU-kompatible Eigenschaften werden animiert
    - **Property 2: Nur GPU-kompatible Eigenschaften werden animiert**
    - Datei: `src/animations/__tests__/presets.test.ts`
    - Iteriert über alle exportierten Varianten, prüft dass nur `opacity`, `x`, `y`, `scale`, `rotate` animiert werden
    - **Validiert: Anforderung 12.1**

  - [ ]* 1.5 Unit-Tests für Presets und Timing-Konstanten
    - Datei: `src/animations/__tests__/presets.test.ts`
    - `DURATIONS.micro <= 0.4`, `DURATIONS.entrance <= 0.6` (Req 1.4)
    - `STAGGER_DELAY` zwischen 0.05 und 0.08 (Req 3.1)
    - `tapFeedback.whileTap.scale` zwischen 0.97 und 0.98 (Req 6.1)
    - `dialogVariants.initial` hat `opacity: 0` und `y > 0` (Req 2.1)
    - `dialogVariants.exit` hat `opacity: 0` und `y > 0` (Req 2.2)
    - `backdropVariants.initial.opacity === 0` (Req 2.3)
    - `slideUp.initial` hat `opacity: 0` und `y > 0` (Req 3.3)
    - `scaleIn.initial` hat `opacity: 0` und `scale < 1` (Req 3.4)
    - `DURATIONS.emphasis === 0.4` (Req 5.4)
    - `EASINGS.spring` hat `type: 'spring'` (Req 8.2)
    - `EASINGS.bounce` hat `type: 'spring'` (Req 9.4)
    - _Anforderungen: 1.4, 2.1, 2.2, 2.3, 3.1, 3.3, 3.4, 5.4, 6.1, 8.2, 9.4_

  - [ ]* 1.6 Property-Test: Animierte Zahlen konvergieren zum Zielwert
    - **Property 3: Animierte Zahlen konvergieren zum Zielwert**
    - Datei: `src/animations/__tests__/hooks.test.ts`
    - Generiert zufällige Zahlen (0–500) und Dezimalstellen (0–3), prüft dass `useAnimatedNumber` den formatierten Zielwert liefert
    - **Validiert: Anforderungen 5.1, 5.2, 5.3**

- [x] 2. Checkpoint — Animations-Modul validieren
  - Sicherstellen, dass alle Tests bestehen, bei Fragen den Nutzer konsultieren.

- [x] 3. Dialog-Komponente mit Ein-/Austrittsanimationen erweitern
  - [x] 3.1 `src/components/core/Dialog.tsx` um motion-Animationen erweitern
    - `AnimatePresence` um den Dialog-Inhalt wrappen
    - Backdrop-`<div>` durch `<motion.div>` mit `backdropVariants` ersetzen
    - Content-`<div>` durch `<motion.div>` mit `dialogVariants` ersetzen
    - `useReducedMotion()` einbinden und `getVariants()` für reduced-motion-Unterstützung nutzen
    - Bestehende CSS-Klassen, ARIA-Attribute und `data-*`-Attribute beibehalten
    - _Anforderungen: 2.1, 2.2, 2.3, 2.4_

- [x] 4. GoalCard mit Animationen und Fortschrittsbalken erweitern
  - [x] 4.1 `src/components/GoalCard.tsx` um Eingangs- und Tap-Animation erweitern
    - Äußeres `<div>` durch `<motion.div>` mit `slideUp`-Variante ersetzen
    - `tapFeedback` (`whileTap: { scale: 0.97 }`) hinzufügen
    - `useReducedMotion()` + `getVariants()` einbinden
    - _Anforderungen: 3.3, 6.1, 6.2, 6.4_

  - [x] 4.2 Fortschrittsbalken-Animation in GoalCard implementieren
    - Fortschrittsbalken-Element durch `<motion.div>` ersetzen
    - Breite von 0% zum aktuellen Prozentwert mit `animate`-Prop animieren
    - Dauer: `DURATIONS.entrance` (600ms), Easing: `EASINGS.easeOut`
    - Bei Wertänderung vom vorherigen zum neuen Wert animieren
    - _Anforderungen: 4.1, 4.2, 4.3_

- [x] 5. AchievementCard mit Animationen erweitern
  - [x] 5.1 `src/components/AchievementCard.tsx` um Eingangs- und Tap-Animation erweitern
    - Äußeres `<div>` durch `<motion.div>` mit `scaleIn`-Variante ersetzen
    - `tapFeedback` hinzufügen
    - `useReducedMotion()` + `getVariants()` einbinden
    - _Anforderungen: 3.2, 3.4, 6.3_

- [x] 6. GoalsView mit Stagger- und Listen-Animationen erweitern
  - [x] 6.1 `src/views/GoalsView.tsx` um Stagger-Container und AnimatePresence erweitern
    - GoalCard-Listen-Container mit `<motion.div variants={staggerContainer}>` wrappen
    - AchievementCard-Listen-Container mit Stagger-Animation versehen
    - `AnimatePresence` für Ein-/Austrittsanimationen bei Hinzufügen/Entfernen von Zielen
    - `layout`-Prop auf GoalCards für Reorder-Animationen
    - Konsistenz-Score-Bereich mit `fadeIn` + `scaleIn` animieren
    - Non-Scale-Victory-Nachrichten mit Stagger-Animation
    - Streak-Karten mit Stagger-Animation und `EASINGS.bounce`
    - _Anforderungen: 3.1, 3.2, 9.2, 9.3, 9.4, 10.1, 10.2, 10.3, 10.4_

- [x] 7. Checkpoint — Karten- und Listen-Animationen validieren
  - Sicherstellen, dass alle Tests bestehen, bei Fragen den Nutzer konsultieren.

- [x] 8. BottomNavigation mit Indikator-Animation erweitern
  - [x] 8.1 `src/components/BottomNavigation.tsx` um layoutId-Animation erweitern
    - Aktiven Indikator als `<motion.div layoutId="active-tab">` implementieren
    - Spring-Kurve mit Dauer 250ms (`EASINGS.spring`) verwenden
    - `useReducedMotion()` einbinden
    - _Anforderungen: 8.1, 8.2, 8.3_

- [x] 9. StepFlowScreen mit Schritt-Übergängen erweitern
  - [x] 9.1 `src/components/StepFlowScreen.tsx` um richtungsabhängige Slide-Animation erweitern
    - `AnimatePresence mode="wait"` um den Schritt-Content wrappen
    - Richtungsabhängige Slide-Varianten implementieren: forward (von rechts) / backward (von links)
    - Zusammenfassungs-Schritt mit `fadeIn`-Animation
    - `useReducedMotion()` + `getVariants()` einbinden
    - _Anforderungen: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 9.2 Property-Test: StepFlow-Slide-Richtung ist konsistent
    - **Property 4: StepFlow-Slide-Richtung ist konsistent mit Navigationsrichtung**
    - Datei: `src/animations/__tests__/presets.test.ts`
    - Generiert zufällige Richtungen, prüft dass `forward` → `initial.x > 0`, `exit.x < 0` und `backward` → `initial.x < 0`, `exit.x > 0`
    - **Validiert: Anforderungen 7.1, 7.2**

- [x] 10. Zahlen-Animationen in Dashboard und CoachingSummary integrieren
  - [x] 10.1 `src/views/DashboardView.tsx` um animierte Zahlenwerte erweitern
    - `useAnimatedNumber` für aktuellen Gewichtswert einbinden
    - `useAnimatedNumber` für prozentuale Veränderung einbinden
    - _Anforderungen: 5.1, 5.2_

  - [x] 10.2 `src/components/CoachingSummary.tsx` um animierte Zahlenwerte erweitern
    - `useAnimatedNumber` für aktuelles Gewicht und 7-Tage-Änderung einbinden
    - _Anforderung: 5.3_

- [x] 11. BodyCompass und EmptyState mit Animationen erweitern
  - [x] 11.1 `src/components/BodyCompass.tsx` um Stagger-Animation erweitern
    - Trend-Zeilen mit `staggerContainer` + `fadeIn` animieren
    - `useReducedMotion()` + `getVariants()` einbinden
    - _Anforderung: 9.1_

  - [x] 11.2 `src/components/EmptyState.tsx` um gestaffelte Eingangsanimation erweitern
    - Icon, Nachricht und Button mit gestaffelter `fadeIn` + `slideUp`-Animation
    - Initiale Verzögerung von 200ms
    - `useReducedMotion()` + `getVariants()` einbinden
    - _Anforderungen: 11.1, 11.2_

- [x] 12. Abschluss-Checkpoint — Alle Animationen und Tests validieren
  - Sicherstellen, dass alle Tests bestehen, bei Fragen den Nutzer konsultieren.

## Hinweise

- Tasks mit `*` sind optional und können für ein schnelleres MVP übersprungen werden
- Jeder Task referenziert spezifische Anforderungen für Nachvollziehbarkeit
- Checkpoints sichern inkrementelle Validierung
- Property-Tests validieren universelle Korrektheitseigenschaften
- Unit-Tests validieren spezifische Beispiele und Grenzfälle
- Alle Komponenten-Änderungen behalten bestehende CSS-Klassen, ARIA-Attribute und `data-*`-Attribute bei
