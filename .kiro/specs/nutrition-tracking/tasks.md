# Implementation Plan: Nutrition Tracking

## Übersicht

Schrittweise Implementierung des Nutrition-Tracking-Systems: Zuerst Typen und DB-Migration, dann Pure Functions (calculationEngine, nutritionSerializer), dann Services (foodSearchService, nutritionService), dann Views (NutritionView, AddFoodView, FoodDetailView, RecipeListView, RecipeDetailView), und zuletzt Routing-Integration.

## Tasks

- [x] 1. Typen und IndexedDB-Migration
  - [x] 1.1 Nutrition-Typen in src/types/index.ts ergänzen
    - `FoodSource`, `Food`, `FoodEntry`, `Recipe`, `RecipeItem`, `Favorite`, `DailySummary`, `NutritionExportData` wie im Design definiert hinzufügen
    - Bestehende Typen nicht verändern
    - _Requirements: 1.5, 4.2, 5.4, 5.5, 9.1_

  - [x] 1.2 IndexedDB von Version 2 auf 3 migrieren in src/services/db.ts
    - `FitnessTrackerDB`-Interface um 5 neue Stores erweitern: `foods`, `foodEntries`, `recipes`, `recipeItems`, `favorites`
    - Indexes laut Design anlegen (by-date, by-source, by-name, by-recipe-id, by-added, etc.)
    - DB-Version von 2 auf 3 erhöhen, upgrade-Funktion mit `if (oldVersion < 3)` Block ergänzen
    - Neue Typen aus `src/types/index.ts` importieren
    - _Requirements: 8.1_

- [x] 2. Calculation Engine (Pure Functions)
  - [x] 2.1 src/utils/calculationEngine.ts erstellen
    - `roundToOneDecimal(value)`: Rundung auf 1 Dezimalstelle
    - `calculateNutrition(food, amountGrams)`: Nährwerte berechnen nach Formel `(wert_pro_100g × gramm / 100)`, gerundet
    - `portionToGrams(portionSize, portionCount)`: Portionsgröße in Gramm umrechnen
    - `calculateRecipeTotals(items)`: Summe aller RecipeItem-Nährwerte
    - `calculateDailyTotals(entries)`: Summe aller FoodEntry-Nährwerte eines Tages
    - _Requirements: 3.1, 3.3, 3.5, 4.5, 5.3_

  - [ ]* 2.2 Property-Tests für calculationEngine (src/utils/calculationEngine.property.test.ts)
    - **Property 1: Nährwertberechnung ist korrekt und gerundet**
    - Generator: Arbitrary Food + positive number
    - Prüft: `calculateNutrition(food, grams)` === `roundToOneDecimal(wert_pro_100g × grams / 100)` für jeden Nährwert
    - **Validates: Requirements 3.1, 3.3, 3.5**

  - [ ]* 2.3 Property-Test: Tagessummen (src/utils/calculationEngine.property.test.ts)
    - **Property 4: Tagessummen-Berechnung**
    - Generator: Arbitrary FoodEntry[]
    - Prüft: `calculateDailyTotals` === Summe der Einzelwerte, gerundet auf 1 Dezimalstelle
    - **Validates: Requirements 4.5**

  - [ ]* 2.4 Property-Test: Rezept-Gesamtnährwerte (src/utils/calculationEngine.property.test.ts)
    - **Property 5: Rezept-Gesamtnährwerte**
    - Generator: Arbitrary RecipeItem[]
    - Prüft: `calculateRecipeTotals` === Summe der Einzelwerte, gerundet auf 1 Dezimalstelle
    - **Validates: Requirements 5.3**

  - [ ]* 2.5 Unit-Tests für calculationEngine (src/utils/calculationEngine.test.ts)
    - Bekannte Lebensmittel mit erwarteten Werten (z.B. 250g Hähnchenbrust)
    - Grenzwerte: 0g, sehr große Mengen
    - Rundungsbeispiele
    - _Requirements: 3.1, 3.3_

- [x] 3. Nutrition Serializer
  - [x] 3.1 src/utils/nutritionSerializer.ts erstellen
    - `serializeNutrition(data: NutritionExportData): string` — JSON-Serialisierung
    - `deserializeNutrition(json: string): NutritionExportData` — JSON-Deserialisierung mit Validierung
    - `validateNutritionData(data: unknown): data is NutritionExportData` — Type Guard
    - Bei ungültigen Daten: beschreibende Fehlermeldung werfen
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 3.2 Property-Test: Serialisierung Round-Trip (src/utils/nutritionSerializer.property.test.ts)
    - **Property 11: Serialisierung Round-Trip**
    - Generator: Arbitrary NutritionExportData
    - Prüft: `deserialize(serialize(data))` === data UND `serialize(deserialize(serialize(data)))` === `serialize(data)`
    - **Validates: Requirements 9.1, 9.2, 9.3**

  - [ ]* 3.3 Property-Test: Ungültige JSON-Daten (src/utils/nutritionSerializer.property.test.ts)
    - **Property 12: Ungültige JSON-Daten erzeugen Fehlermeldung**
    - Generator: Arbitrary invalid strings
    - Prüft: `deserializeNutrition` wirft Error mit beschreibender Fehlermeldung
    - **Validates: Requirements 9.4**

  - [ ]* 3.4 Unit-Tests für nutritionSerializer (src/utils/nutritionSerializer.test.ts)
    - Spezifische ungültige JSON-Formate, fehlende Felder, falsche Typen
    - _Requirements: 9.4_

- [x] 4. Checkpoint — Alle Pure-Function-Tests prüfen
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Food Search Service
  - [x] 5.1 src/services/foodSearchService.ts erstellen
    - `searchOpenFoodFacts(query)`: Open Food Facts API mit DACH-Fokus (cc=de, lc=de), Response auf `Food` mappen
    - `searchBLS(query)`: BLS-API-Abfrage, Response auf `Food` mappen
    - `searchUSDA(query)`: USDA FoodData Central als Fallback, Response auf `Food` mappen
    - `mergeAndRank(offResults, blsResults, usdaResults)`: Ergebnisse zusammenführen, BLS/OFF vor USDA
    - `searchFoods(query)`: Hauptfunktion — OFF + BLS parallel, bei leeren Ergebnissen USDA-Fallback
    - Quellenangabe (`source`) bei jedem Ergebnis setzen
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 5.2 Property-Test: Food-Objekt-Vollständigkeit (src/services/foodSearchService.property.test.ts)
    - **Property 2: Food-Objekt-Vollständigkeit**
    - Generator: Arbitrary API responses
    - Prüft: Alle Pflichtfelder vorhanden, `source` ist einer der erlaubten Werte
    - **Validates: Requirements 1.3, 1.5**

  - [ ]* 5.3 Property-Test: Merge & Ranking (src/services/foodSearchService.property.test.ts)
    - **Property 3: Suchergebnis-Zusammenführung und Ranking**
    - Generator: Arbitrary result lists with mixed sources
    - Prüft: Alle Eingabe-Elemente enthalten, BLS/OFF vor USDA
    - **Validates: Requirements 1.1, 1.4**

  - [ ]* 5.4 Unit-Tests für foodSearchService (src/services/foodSearchService.test.ts)
    - Mock-API-Responses, Fallback-Verhalten, Fehlerbehandlung bei API-Timeout
    - _Requirements: 1.1, 1.2_

- [x] 6. Nutrition Service (CRUD + Cache)
  - [x] 6.1 src/services/nutritionService.ts erstellen
    - Food Entries: `saveFoodEntry`, `getFoodEntriesByDate`, `deleteFoodEntry`, `getRecentFoods` (max 20, sortiert nach created_at desc)
    - Recipes: `saveRecipe`, `getAllRecipes`, `getRecipe`, `deleteRecipe`, `saveRecipeItem`, `getRecipeItems`, `deleteRecipeItem`
    - Favorites: `addFavorite`, `removeFavorite`, `getAllFavorites`, `isFavorite`
    - Food Cache: `cacheFood`, `getCachedFood`
    - Tagesübersicht: `getDailySummary` — FoodEntries für Datum laden, Summen via `calculateDailyTotals` berechnen
    - Bild-Upload: `uploadRecipeImage` via Supabase Storage
    - Beim Speichern eines FoodEntry: Nährwerte via `calculateNutrition` berechnen und persistieren
    - _Requirements: 4.1, 4.3, 4.4, 4.5, 5.1, 5.2, 5.4, 5.5, 5.6, 6.2, 7.1, 7.4, 8.1, 8.3_

  - [ ]* 6.2 Property-Test: Persistierte Nährwerte (src/services/nutritionService.property.test.ts)
    - **Property 6: Persistierte Nährwerte stimmen mit Berechnung überein**
    - Generator: Arbitrary Food + positive grams
    - Prüft: Im gespeicherten FoodEntry stimmen kcal/protein/carbs/fat mit `calculateNutrition` überein
    - **Validates: Requirements 4.3**

  - [ ]* 6.3 Property-Test: Rezept als Tageseintrag (src/services/nutritionService.property.test.ts)
    - **Property 7: Rezept als Tageseintrag**
    - Generator: Arbitrary Recipe
    - Prüft: FoodEntry-Nährwerte === Recipe-Gesamtnährwerte
    - **Validates: Requirements 5.6**

  - [ ]* 6.4 Property-Test: Letzte Einträge (src/services/nutritionService.property.test.ts)
    - **Property 8: Letzte Einträge — Begrenzung und Reihenfolge**
    - Generator: Arbitrary FoodEntry sequences
    - Prüft: Max 20 Einträge, sortiert nach created_at desc
    - **Validates: Requirements 4.4, 7.4**

  - [ ]* 6.5 Property-Test: Favoriten Round-Trip (src/services/nutritionService.property.test.ts)
    - **Property 9: Favoriten Round-Trip**
    - Generator: Arbitrary Food
    - Prüft: Nach `addFavorite` in Liste enthalten, nach `removeFavorite` nicht mehr
    - **Validates: Requirements 7.1**

  - [ ]* 6.6 Property-Test: Food-Cache Round-Trip (src/services/nutritionService.property.test.ts)
    - **Property 10: Food-Cache Round-Trip**
    - Generator: Arbitrary Food
    - Prüft: `getCachedFood(id)` gibt äquivalentes Objekt zurück
    - **Validates: Requirements 8.3**

  - [ ]* 6.7 Unit-Tests für nutritionService (src/services/nutritionService.test.ts)
    - CRUD-Operationen, Datumsfilterung, Favoriten-Toggle
    - _Requirements: 4.1, 7.1, 7.4_

- [x] 7. Checkpoint — Services und alle Tests prüfen
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. NutritionView (Tagesübersicht)
  - [x] 8.1 src/views/NutritionView.tsx + NutritionView.css erstellen
    - Kalorienfortschritt-Anzeige (Summe kcal des Tages)
    - Makronährstoff-Übersicht (Protein, Kohlenhydrate, Fett)
    - Liste der FoodEntries für das ausgewählte Datum mit Löschen-Option
    - Button zum Hinzufügen (navigiert zu AddFoodView)
    - Datumsauswahl (Vor/Zurück)
    - Alle UI-Texte in Deutsch
    - Bestehendes Design-System verwenden (adaptive Komponenten)
    - _Requirements: 4.5, 10.1, 10.4, 10.5_

- [x] 9. AddFoodView (Suche und Auswahl)
  - [x] 9.1 src/views/AddFoodView.tsx + AddFoodView.css erstellen
    - Suchfeld mit 300ms Debounce, automatische Suche via `foodSearchService.searchFoods`
    - Ergebnisliste: Name, Marke (falls vorhanden), kcal pro 100g
    - Tabs/Abschnitte: Letzte Einträge, Gespeicherte Rezepte, Favoriten
    - Ohne aktive Suche: Letzte Einträge und Favoriten anzeigen
    - Auswahl eines Lebensmittels navigiert zu FoodDetailView
    - Auswahl eines Rezepts erstellt FoodEntry mit Rezept-Gesamtnährwerten
    - Alle UI-Texte in Deutsch
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.6, 10.1, 10.3, 10.4_

- [x] 10. FoodDetailView (Nährwert-Detail und Speichern)
  - [x] 10.1 src/views/FoodDetailView.tsx + FoodDetailView.css erstellen
    - Nährwerte pro 100g anzeigen
    - Mengenfeld (Gramm/Milliliter/Portionen) mit Live-Berechnung via `calculateNutrition`
    - Portionsumrechnung via `portionToGrams`
    - Favorit-Toggle (Stern-Icon)
    - Speichern-Button: FoodEntry via `nutritionService.saveFoodEntry` erstellen
    - Validierung: Ungültige Grammangabe (≤ 0, NaN) als ungültig markieren
    - Alle UI-Texte in Deutsch
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 4.1, 7.1, 7.3, 10.1, 10.2, 10.4_

- [x] 11. RecipeListView und RecipeDetailView
  - [x] 11.1 src/views/RecipeListView.tsx + RecipeListView.css erstellen
    - Grid/Liste gespeicherter Rezepte mit Bildvorschau
    - Platzhalter wenn kein Bild vorhanden
    - Button zum Erstellen eines neuen Rezepts
    - Alle UI-Texte in Deutsch
    - _Requirements: 6.3, 6.4, 10.4_

  - [x] 11.2 src/views/RecipeDetailView.tsx + RecipeDetailView.css erstellen
    - Rezept erstellen/bearbeiten: Name, Zutatenliste
    - Zutaten suchen via `foodSearchService`, Menge in Gramm eingeben
    - Nährwerte pro Zutat und Gesamtnährwerte live berechnen via `calculateRecipeTotals`
    - Bild-Upload/Kamera via `uploadRecipeImage` (Supabase Storage)
    - Speichern-Button: Recipe + RecipeItems via `nutritionService` speichern
    - Alle UI-Texte in Deutsch
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 10.4_

- [x] 12. Routing und Navigation integrieren
  - [x] 12.1 Routen in src/App.tsx ergänzen
    - `/nutrition` → NutritionView
    - `/nutrition/add` → AddFoodView
    - `/nutrition/food/:id` → FoodDetailView
    - `/nutrition/recipes` → RecipeListView
    - `/nutrition/recipe/:id` → RecipeDetailView
    - Als Detail-Routen (außerhalb des Snap-Containers) einfügen
    - Navigation-Eintrag in BottomNavigation ergänzen (Ernährung-Icon)
    - _Requirements: 10.1, 10.5_

- [x] 13. Final Checkpoint — Alle Tests und Integration prüfen
  - Ensure all tests pass, ask the user if questions arise.

## Hinweise

- Tasks mit `*` sind optional und können für ein schnelleres MVP übersprungen werden
- Jeder Task referenziert spezifische Anforderungen für Nachverfolgbarkeit
- Checkpoints sichern inkrementelle Validierung
- Property-Tests validieren universelle Korrektheitseigenschaften (fast-check)
- Unit-Tests validieren spezifische Beispiele und Edge Cases
