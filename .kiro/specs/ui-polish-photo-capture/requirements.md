# Anforderungsdokument: UI-Polish, Foto-Capture & Dashboard-Optimierung

## Einführung

Dieses Feature umfasst eine Reihe von UI-Verbesserungen, die nach der initialen Implementierung des Nutrition-Tracking-Systems und der Kern-App vorgenommen wurden. Die Änderungen betreffen: Foto-Capture für Gerichte und eigene Lebensmittel, nachträgliche Bearbeitung von Gerichten (Name, Foto), Aufteilung der Messungs-Cards, Dashboard-Rendering-Optimierung (kein Layout-Jump), Design-System-Konformität (Button-Materials, Badge-Caching) und diverse UX-Verbesserungen in der NutritionView.

## Glossar

- **Foto_Capture**: Die Kamera-Integration zum Aufnehmen von Fotos für Gerichte und eigene Lebensmittel direkt in der App
- **Image_Compression**: Die Komprimierungslogik, die aufgenommene Fotos auf max. 150KB / 800px / JPEG reduziert
- **Meal_Edit_Dialog**: Der Dialog zum nachträglichen Bearbeiten von Gerichtnamen und -fotos
- **MeasurementView_Cards**: Die aufgeteilten Karten für Gewicht, Körperfett und Umfangmessung (vorher eine kombinierte Karte)
- **Dashboard_Cache**: localStorage-basiertes Caching von Streak- und Goal-Daten zur Vermeidung von Layout-Jumps beim Reload
- **DailyInputView_Mode**: Der `mode`-Prop (`'weight' | 'bodyFat' | 'both'`) der DailyInputView zur selektiven Anzeige von Eingabefeldern

## Anforderungen

### Anforderung 1: Foto-Capture für Gerichte

**User Story:** Als Nutzer möchte ich beim Anlegen eines Gerichts direkt ein Foto aufnehmen können, damit ich eine visuelle Vorschau in der Gerichtsliste habe.

#### Akzeptanzkriterien

1. WHEN der Nutzer ein neues Gericht anlegt, THE NutritionView SHALL neben dem Namensfeld einen Kamera-Button (iconOnly) anzeigen
2. WHEN der Nutzer den Kamera-Button tippt, THE App SHALL die Gerätekamera öffnen und ein Foto aufnehmen lassen
3. WHEN ein Foto aufgenommen wurde, THE Image_Compression SHALL das Bild auf maximal 150KB, 800px Breite und JPEG-Format komprimieren
4. WHEN das Gericht gespeichert wird, THE NutritionView SHALL das komprimierte Bild als `image_url` (Base64 Data-URL) im Meal-Objekt speichern
5. WHEN ein Gericht ein Foto hat, THE NutritionView SHALL ein Thumbnail (4rem × 4rem) im Gericht-Header anzeigen

### Anforderung 2: Foto-Capture für eigene Lebensmittel

**User Story:** Als Nutzer möchte ich beim Anlegen eines eigenen Lebensmittels ein Foto aufnehmen können, damit ich es später leichter wiedererkennen kann.

#### Akzeptanzkriterien

1. WHEN der Nutzer ein eigenes Lebensmittel anlegt, THE AddFoodView SHALL einen Kamera-Button im Custom-Food-Dialog anzeigen
2. WHEN ein Foto aufgenommen wurde, THE Image_Compression SHALL das Bild identisch wie bei Gerichten komprimieren (max. 150KB, 800px, JPEG)
3. WHEN das Lebensmittel gespeichert wird, THE AddFoodView SHALL das Bild als `image_url` im Food-Objekt speichern

### Anforderung 3: Nachträgliche Bearbeitung von Gerichten

**User Story:** Als Nutzer möchte ich den Namen und das Foto eines bestehenden Gerichts nachträglich ändern können.

#### Akzeptanzkriterien

1. WHEN der Nutzer auf den Bearbeiten-Button (Pencil-Icon) eines Gerichts tippt, THE NutritionView SHALL einen Edit-Dialog öffnen
2. THE Meal_Edit_Dialog SHALL ein Namensfeld und das aktuelle Foto (falls vorhanden) anzeigen
3. WHEN ein Foto vorhanden ist, THE Meal_Edit_Dialog SHALL zwei Buttons unter dem Foto anzeigen: "Foto ändern" und ein X-Button zum Entfernen
4. WHEN der Nutzer "OK" tippt, THE NutritionView SHALL die Änderungen via `updateMeal(id, { name?, image_url? })` speichern
5. THE Meal_Edit_Dialog SHALL keine Zutaten-Sektion enthalten (Zutaten werden direkt in der expandierten Card verwaltet)

### Anforderung 4: Separate Messungs-Cards

**User Story:** Als Nutzer möchte ich Gewicht und Körperfett als separate Karten sehen, da nicht alle Nutzer Körperfett messen.

#### Akzeptanzkriterien

1. THE MeasurementView SHALL drei separate Cards anzeigen: Gewicht, Körperfett, Umfangmessung
2. THE Körperfett-Card SHALL den Untertitel "Optionale Messung" und ein Prozent-Icon tragen
3. THE DailyInputView SHALL einen `mode`-Prop akzeptieren (`'weight' | 'bodyFat' | 'both'`), der steuert welche Felder angezeigt werden
4. WHEN `mode` "weight" ist, THE DailyInputView SHALL nur das Gewichtsfeld anzeigen
5. WHEN `mode` "bodyFat" ist, THE DailyInputView SHALL nur das Körperfettfeld anzeigen

### Anforderung 5: Dashboard-Rendering ohne Layout-Jump

**User Story:** Als Nutzer möchte ich, dass das Dashboard beim Laden nicht springt, sondern sofort mit Platzhalter-Werten gerendert wird.

#### Akzeptanzkriterien

1. THE DashboardView SHALL den gesamten Content (Tabs, Wert-Anzeige, Graph, Time-Range-Selector) sofort rendern, auch wenn die Daten noch laden
2. WHEN keine Daten geladen sind, THE DashboardView SHALL den Wert "0" mit der entsprechenden Einheit anzeigen
3. THE DashboardView SHALL Streak- und Goal-Daten im localStorage cachen und beim nächsten Laden sofort aus dem Cache initialisieren
4. WHEN der Nutzer die Seite neu lädt (Cmd+R), THE Streak-Badge und Goal-Badge SHALL sofort mit den gecachten Werten sichtbar sein (kein Flackern)
5. THE DashboardView SHALL den EmptyState nur anzeigen, wenn definitiv keine Daten existieren (nicht während des Ladens)

### Anforderung 6: Design-System-Konformität

**User Story:** Als Entwickler möchte ich, dass alle UI-Elemente den Design-System-Regeln entsprechen.

#### Akzeptanzkriterien

1. Inaktive Buttons in Sub-Selektoren (Circumference, Time-Range) SHALL `data-material="transparent"` verwenden (nicht `undefined` oder `"filled"`)
2. Inaktive Buttons in Tab-Leisten SHALL `data-material="semi-transparent"` verwenden
3. Aktive/selektierte Buttons SHALL `data-material="inverted"` zusammen mit `data-container-contrast="max"` verwenden
4. CTA-Buttons (OK/Speichern) SHALL `variant="primary"` verwenden
5. Abbrechen-Buttons SHALL das Default-Material (filled) verwenden
6. Inputs SHALL volle Breite einnehmen (`width: 100%` auf `.core-input-field`)

### Anforderung 7: NutritionView UX-Verbesserungen

**User Story:** Als Nutzer möchte ich eine übersichtliche und gut bedienbare Ernährungsansicht.

#### Akzeptanzkriterien

1. THE NutritionView SHALL eine `<h1>Ernährung</h1>` Überschrift am oberen Rand anzeigen
2. Zutaten-Einträge in expandierten Gerichten SHALL `className="adaptive" data-material="semi-transparent"` verwenden, um sie visuell von Gericht-Aktionen zu trennen
3. Der innere Löschen-Button (pro Zutat) SHALL `data-material="transparent"` verwenden
4. Gericht-Cards SHALL `role="button" tabIndex={0}` auf Card-Ebene haben und per Enter/Space bedienbar sein
5. Der "Hinzufügen"-Button für Zutaten SHALL als "+ Zutaten" beschriftet sein
