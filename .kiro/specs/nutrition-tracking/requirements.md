# Requirements Document

## Einleitung

Dieses Dokument beschreibt die Anforderungen für ein leichtgewichtiges Nutrition-Tracking-System innerhalb der bestehenden Fitness-/Gewichtstracking-PWA. Der Fokus liegt auf europäischen (DACH) Lebensmitteldaten, präziser Kalorien- und Makronährstoff-Erfassung, benutzerdefinierter Rezepterstellung und wiederverwendbaren Mahlzeiten mit Bildvorschau. Die Interaktion soll minimal und schnell sein — kein komplexes Food-Diary wie bei MyFitnessPal.

## Glossar

- **Nutrition_Tracker**: Das Gesamtsystem zur Erfassung und Berechnung von Nährwertdaten innerhalb der App
- **Food_Search**: Die Suchkomponente, die Lebensmittel aus mehreren Datenquellen abfragt und zusammenführt
- **Food_Database**: Die hybride Datenquelle bestehend aus BLS (Bundeslebensmittelschlüssel), Open Food Facts und USDA FoodData Central
- **Food**: Ein normalisiertes Lebensmittel-Objekt mit Nährwerten pro 100g/100ml
- **Food_Entry**: Ein einzelner Ernährungseintrag eines Benutzers für ein bestimmtes Datum
- **Recipe**: Ein benutzerdefiniertes Rezept bestehend aus mehreren Food-Einträgen mit berechneten Gesamtnährwerten
- **Recipe_Item**: Eine einzelne Zutat innerhalb eines Rezepts mit Mengenangabe und berechneten Nährwerten
- **Calculation_Engine**: Die Berechnungslogik, die Nährwerte basierend auf 100g-Basiswerten und Grammangabe berechnet
- **Image_Handler**: Die Komponente zur Verwaltung von Rezeptbildern (Upload/Kamera)
- **Add_Food_Screen**: Die Ansicht zum Hinzufügen von Lebensmitteln mit Suche, letzten Einträgen, Rezepten und Favoriten
- **Food_Detail_Screen**: Die Detailansicht eines Lebensmittels mit Nährwertanzeige, Mengenauswahl und Live-Berechnung
- **Recipe_Screen**: Die Ansicht zur Verwaltung und Anzeige gespeicherter Rezepte
- **BLS**: Bundeslebensmittelschlüssel — deutsche Lebensmitteldatenbank für Basislebensmittel
- **Open_Food_Facts**: Offene europäische Produktdatenbank mit Markenartikeln (z.B. Lidl, REWE, Spar)
- **USDA**: United States Department of Agriculture FoodData Central — globale Fallback-Datenbank
- **IndexedDB**: Die lokale Browser-Datenbank, die in der App für Offline-Datenhaltung verwendet wird

## Anforderungen

### Anforderung 1: Hybride Lebensmittel-Datenquelle

**User Story:** Als Benutzer möchte ich europäische und DACH-spezifische Lebensmittel finden, damit meine Nährwertdaten genau und relevant für meinen Markt sind.

#### Akzeptanzkriterien

1. WHEN der Benutzer eine Suchanfrage eingibt, THE Food_Search SHALL Ergebnisse aus Open_Food_Facts und BLS parallel abfragen und in einer zusammengeführten Liste anzeigen
2. IF keine Ergebnisse aus Open_Food_Facts und BLS gefunden werden, THEN THE Food_Search SHALL die USDA-Datenbank als Fallback abfragen
3. THE Food_Database SHALL jedes Lebensmittel mit einer Quellenangabe ("bls", "openfoodfacts" oder "usda") versehen
4. WHEN Ergebnisse aus mehreren Quellen vorliegen, THE Food_Search SHALL die Ergebnisse nach Relevanz sortieren, wobei BLS- und Open_Food_Facts-Ergebnisse Vorrang vor USDA-Ergebnissen erhalten
5. THE Food_Database SHALL für jedes Lebensmittel die Felder id, source, name, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g und default_unit ("g" oder "ml") bereitstellen

### Anforderung 2: Lebensmittelsuche und -auswahl

**User Story:** Als Benutzer möchte ich schnell Lebensmittel suchen und auswählen können, damit ich meine Ernährung mit minimalem Aufwand erfassen kann.

#### Akzeptanzkriterien

1. WHEN der Benutzer einen Suchbegriff in das Suchfeld eingibt, THE Food_Search SHALL nach einer Eingabepause von 300ms die Suche automatisch auslösen
2. WHEN Suchergebnisse angezeigt werden, THE Food_Search SHALL für jedes Ergebnis den Namen, die Marke (falls vorhanden) und die Kalorien pro 100g anzeigen
3. WHEN der Benutzer ein Lebensmittel aus der Ergebnisliste auswählt, THE Nutrition_Tracker SHALL den Food_Detail_Screen mit den Nährwertdaten pro 100g öffnen
4. THE Add_Food_Screen SHALL die Abschnitte Suchfeld, Letzte Einträge, Gespeicherte Rezepte und Favoriten anzeigen
5. WHILE keine Suchanfrage aktiv ist, THE Add_Food_Screen SHALL die letzten Einträge und Favoriten des Benutzers anzeigen

### Anforderung 3: Nährwertberechnung

**User Story:** Als Benutzer möchte ich die Nährwerte basierend auf meiner eingegebenen Menge live berechnet sehen, damit ich informierte Entscheidungen treffen kann.

#### Akzeptanzkriterien

1. THE Calculation_Engine SHALL Nährwerte nach der Formel (Nährwert_pro_100g × Grammangabe / 100) berechnen
2. WHEN der Benutzer die Grammangabe im Food_Detail_Screen ändert, THE Calculation_Engine SHALL die Werte für Kalorien, Protein, Kohlenhydrate und Fett in Echtzeit aktualisieren
3. THE Calculation_Engine SHALL alle berechneten Nährwerte auf eine Dezimalstelle runden
4. THE Food_Detail_Screen SHALL die Mengenauswahl in Gramm, Milliliter oder Portionen ermöglichen
5. WHEN der Benutzer eine Portion auswählt, THE Calculation_Engine SHALL die Portionsgröße in Gramm umrechnen und die Nährwerte entsprechend berechnen

### Anforderung 4: Ernährungseinträge speichern

**User Story:** Als Benutzer möchte ich meine Ernährungseinträge pro Tag speichern, damit ich meinen täglichen Kalorienverbrauch nachverfolgen kann.

#### Akzeptanzkriterien

1. WHEN der Benutzer im Food_Detail_Screen auf Speichern tippt, THE Nutrition_Tracker SHALL einen Food_Entry mit user_id, Datum, food_id, Name, Grammangabe und berechneten Nährwerten in der IndexedDB speichern
2. THE Food_Entry SHALL die Felder id, user_id, date (ISO 8601 YYYY-MM-DD), food_id, name, amount_grams, kcal, protein, carbs, fat und created_at (ISO 8601 Zeitstempel) enthalten
3. THE Nutrition_Tracker SHALL die berechneten Nährwerte im Food_Entry für schnellen Zugriff persistieren
4. WHEN ein Food_Entry gespeichert wird, THE Nutrition_Tracker SHALL das Lebensmittel in die Liste der letzten Einträge aufnehmen
5. THE Nutrition_Tracker SHALL die Tagesübersicht mit der Summe aller Kalorien, Protein, Kohlenhydrate und Fett für das ausgewählte Datum anzeigen

### Anforderung 5: Benutzerdefinierte Rezepte

**User Story:** Als Benutzer möchte ich eigene Rezepte aus mehreren Zutaten erstellen, damit ich häufig gegessene Mahlzeiten schnell erfassen kann.

#### Akzeptanzkriterien

1. WHEN der Benutzer ein neues Rezept erstellt, THE Nutrition_Tracker SHALL die Suche nach Zutaten über die Food_Search ermöglichen
2. WHEN der Benutzer eine Zutat zum Rezept hinzufügt, THE Nutrition_Tracker SHALL die Mengenangabe in Gramm erfassen und die Nährwerte für diese Zutat berechnen
3. THE Calculation_Engine SHALL die Gesamtnährwerte des Rezepts als Summe aller Recipe_Items berechnen
4. THE Recipe SHALL die Felder id, user_id, name, image_url (optional), total_kcal, total_protein, total_carbs, total_fat und created_at enthalten
5. THE Recipe_Item SHALL die Felder id, recipe_id, food_id, name, amount_grams, kcal, protein, carbs und fat enthalten
6. WHEN der Benutzer ein gespeichertes Rezept zum Tageseintrag hinzufügt, THE Nutrition_Tracker SHALL einen Food_Entry mit den Gesamtnährwerten des Rezepts erstellen

### Anforderung 6: Rezeptbilder

**User Story:** Als Benutzer möchte ich Fotos zu meinen Rezepten hinzufügen, damit ich meine Mahlzeiten visuell wiedererkennen kann.

#### Akzeptanzkriterien

1. WHEN der Benutzer ein Rezept erstellt oder bearbeitet, THE Image_Handler SHALL die Option zum Hochladen eines Bildes oder zur Aufnahme eines Fotos anbieten
2. WHEN ein Bild hochgeladen wird, THE Image_Handler SHALL das Bild in einem externen Speicher (Supabase Storage oder S3) ablegen und die URL im Recipe speichern
3. THE Recipe_Screen SHALL gespeicherte Rezepte als Grid oder Liste mit Bildvorschau anzeigen
4. IF kein Bild für ein Rezept vorhanden ist, THEN THE Recipe_Screen SHALL einen Platzhalter anzeigen

### Anforderung 7: Favoriten und Wiederverwendung

**User Story:** Als Benutzer möchte ich häufig verwendete Lebensmittel als Favoriten markieren, damit ich diese schnell wiederfinden kann.

#### Akzeptanzkriterien

1. WHEN der Benutzer ein Lebensmittel als Favorit markiert, THE Nutrition_Tracker SHALL das Lebensmittel in der Favoritenliste in der IndexedDB speichern
2. THE Add_Food_Screen SHALL die Favoritenliste im Abschnitt Favoriten anzeigen
3. WHEN der Benutzer einen Favoriten auswählt, THE Nutrition_Tracker SHALL den Food_Detail_Screen mit den gespeicherten Nährwertdaten öffnen
4. THE Nutrition_Tracker SHALL die letzten 20 verwendeten Lebensmittel im Abschnitt Letzte Einträge anzeigen

### Anforderung 8: Offline-Fähigkeit und Datenhaltung

**User Story:** Als Benutzer möchte ich meine Ernährungsdaten auch offline erfassen können, damit ich nicht von einer Internetverbindung abhängig bin.

#### Akzeptanzkriterien

1. THE Nutrition_Tracker SHALL alle Food_Entries, Recipes, Recipe_Items und Favoriten in der IndexedDB speichern
2. WHILE die App offline ist, THE Nutrition_Tracker SHALL das Erstellen, Bearbeiten und Löschen von Food_Entries und Recipes ermöglichen
3. THE Nutrition_Tracker SHALL häufig verwendete Lebensmittel aus der Food_Database lokal in der IndexedDB zwischenspeichern
4. WHEN die App nach einer Offline-Phase wieder online ist, THE Nutrition_Tracker SHALL lokal erstellte Einträge mit dem Cloud-Speicher synchronisieren

### Anforderung 9: Nährwert-Serialisierung (Round-Trip)

**User Story:** Als Benutzer möchte ich meine Ernährungsdaten exportieren und importieren können, damit ich meine Daten sichern und übertragen kann.

#### Akzeptanzkriterien

1. THE Nutrition_Tracker SHALL Food_Entries und Recipes in ein JSON-Format serialisieren können
2. THE Nutrition_Tracker SHALL serialisierte JSON-Daten zurück in Food_Entries und Recipes deserialisieren können
3. FOR ALL gültigen Food_Entries und Recipes, Serialisierung gefolgt von Deserialisierung gefolgt von erneuter Serialisierung SHALL ein identisches JSON-Ergebnis erzeugen (Round-Trip-Eigenschaft)
4. WHEN ungültige JSON-Daten importiert werden, THE Nutrition_Tracker SHALL eine beschreibende Fehlermeldung zurückgeben

### Anforderung 10: UX-Prinzipien und Einschränkungen

**User Story:** Als Benutzer möchte ich eine einfache und schnelle Ernährungserfassung, damit ich mich auf meine Ziele konzentrieren kann statt auf die App.

#### Akzeptanzkriterien

1. THE Nutrition_Tracker SHALL die Erfassung eines Lebensmitteleintrags in maximal 3 Interaktionsschritten ermöglichen (Suchen → Menge eingeben → Speichern)
2. THE Nutrition_Tracker SHALL keine verpflichtende Makronährstoff-Eingabe erfordern — Kalorien sind das primäre Tracking-Ziel
3. THE Add_Food_Screen SHALL die zuletzt verwendeten Lebensmittel priorisiert anzeigen, um Wiederholungseingaben zu beschleunigen
4. THE Nutrition_Tracker SHALL alle UI-Texte in deutscher Sprache anzeigen
5. THE Nutrition_Tracker SHALL das bestehende Design-System der App mit adaptiven Komponenten verwenden
