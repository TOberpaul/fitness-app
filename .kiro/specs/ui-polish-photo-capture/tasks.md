# Implementation Plan: UI-Polish, Foto-Capture & Dashboard-Optimierung

## Übersicht

Nachträgliche Dokumentation der bereits implementierten UI-Verbesserungen. Alle Tasks sind abgeschlossen.

## Tasks

- [x] 1. Image Compression Utility
  - [x] 1.1 `src/utils/imageCompression.ts` erstellen
    - `compressImage(file: File | Blob): Promise<string>` — Canvas-basierte Komprimierung auf max. 150KB, 800px, JPEG
    - Absteigende Quality-Stufen (0.8 → 0.5 → 0.3) bis Zielgröße erreicht
    - _Requirements: 1.3, 2.2_

- [x] 2. Foto-Capture für Gerichte
  - [x] 2.1 NutritionView: Kamera-Button beim Gericht-Anlegen
    - Input-Feld + Camera-iconOnly-Button in einer Zeile
    - OK-Button als `variant="primary" width="full"` darunter
    - Abbrechen-Button darunter
    - _Requirements: 1.1, 1.2_

  - [x] 2.2 `createMeal()` um `image_url`-Parameter erweitern
    - Optionaler dritter Parameter für Base64 Data-URL
    - _Requirements: 1.4_

  - [x] 2.3 Meal-Card Thumbnail im Header
    - 4rem × 4rem Vorschaubild im Gericht-Header
    - _Requirements: 1.5_

- [x] 3. Foto-Capture für eigene Lebensmittel
  - [x] 3.1 AddFoodView: Kamera-Button im Custom-Food-Dialog
    - Gleiche Komprimierungslogik wie bei Gerichten
    - _Requirements: 2.1, 2.2_

  - [x] 3.2 `createCustomFood()` um `image_url`-Parameter erweitern
    - _Requirements: 2.3_

- [x] 4. Nachträgliche Gericht-Bearbeitung
  - [x] 4.1 `updateMeal(id, { name?, image_url? })` in nutritionService
    - Ersetzt die alte `updateMealName()` Funktion
    - _Requirements: 3.4_

  - [x] 4.2 Edit-Dialog in NutritionView
    - Pencil-Button in Gericht-Aktionen
    - Dialog mit Name-Input + Foto-Vorschau
    - "Foto ändern" + X-Button unter dem Foto
    - Keine Zutaten-Sektion (redundant)
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [x] 5. Separate Messungs-Cards
  - [x] 5.1 MeasurementView: 3 Cards statt 1
    - Gewicht-Card, Körperfett-Card ("Optionale Messung", Percent-Icon), Umfang-Card
    - _Requirements: 4.1, 4.2_

  - [x] 5.2 DailyInputView: `mode`-Prop
    - `mode?: 'weight' | 'bodyFat' | 'both'` (Default: `'both'`)
    - Rendert nur die zum Mode passenden Felder
    - _Requirements: 4.3, 4.4, 4.5_

- [x] 6. Dashboard-Rendering ohne Layout-Jump
  - [x] 6.1 Sofortiges Rendering mit 0-Fallback
    - Value-Display immer gerendert, kein bedingtes Rendering
    - Datum zeigt Non-Breaking-Space wenn kein Datenpunkt vorhanden
    - _Requirements: 5.1, 5.2, 5.5_

  - [x] 6.2 localStorage-Cache für Streaks und Goal-Percent
    - `streaks` und `goalPercent` aus localStorage initialisieren
    - Nach `loadMeta` in localStorage zurückschreiben
    - _Requirements: 5.3, 5.4_

- [x] 7. Design-System-Konformität
  - [x] 7.1 Dashboard: Inaktive Buttons → `data-material="transparent"`
    - Time-Range-Selector und Circumference-Sub-Selector
    - _Requirements: 6.1_

  - [x] 7.2 NutritionView: Button-Styling
    - OK → `variant="primary"`, Abbrechen → Default (filled)
    - _Requirements: 6.4, 6.5_

  - [x] 7.3 Input full-width
    - `.core-input-field { width: 100% }` in Input.css
    - _Requirements: 6.6_

- [x] 8. NutritionView UX-Verbesserungen
  - [x] 8.1 `<h1>Ernährung</h1>` Überschrift
    - _Requirements: 7.1_

  - [x] 8.2 Zutaten-Styling
    - Einträge: `className="adaptive" data-material="semi-transparent"`
    - Innerer Löschen-Button: `data-material="transparent"`
    - _Requirements: 7.2, 7.3_

  - [x] 8.3 Gericht-Card Accessibility
    - `role="button" tabIndex={0}` auf Card-Ebene
    - Enter/Space-Handler, `cursor: pointer`
    - _Requirements: 7.4_

  - [x] 8.4 Button-Label "+ Zutaten"
    - Statt "Hinzufügen"
    - _Requirements: 7.5_

## Hinweise

- Alle Tasks sind bereits implementiert und getestet (332 Tests bestehen)
- Diese Spec wurde nachträglich als Dokumentation erstellt
- Betroffene Dateien: `src/utils/imageCompression.ts`, `src/services/nutritionService.ts`, `src/views/NutritionView.tsx`, `src/views/NutritionView.css`, `src/views/AddFoodView.tsx`, `src/views/AddFoodView.css`, `src/views/MeasurementView.tsx`, `src/views/DailyInputView.tsx`, `src/views/DashboardView.tsx`, `src/components/core/Input.css`
