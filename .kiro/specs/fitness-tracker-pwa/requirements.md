# Anforderungsdokument

## Einführung

Minimalistische Fitness-Tracking Progressive Web App (PWA) zur täglichen Erfassung von Gewicht und Körperfett sowie wöchentlicher Erfassung von Körperumfängen. Die App integriert die Fitbit Web API zum automatischen Abruf von Waagen-Daten und stellt alle Messwerte in einer interaktiven Graphansicht dar (ähnlich dem Aktienchart-Stil von Trade Republic). Die App wird als React-Webanwendung entwickelt, die als PWA auf dem iPhone installierbar ist. Das bestehende Design System (foundation.css, foundation-size.css, DESIGN-SYSTEM-AI-GUIDE.md) wird als Styling-Grundlage verwendet.

## Glossar

- **App**: Die Fitness-Tracker PWA als Gesamtsystem
- **Fitbit_Service**: Modul zur Kommunikation mit der Fitbit Web API über OAuth 2.0
- **Dateneingabe_Formular**: UI-Komponente zur manuellen Eingabe von Messwerten
- **Graph_Ansicht**: UI-Komponente zur Darstellung von Messwerten als interaktives Liniendiagramm
- **Benachrichtigungs_Service**: Modul zum Versand von Push-Benachrichtigungen via Web Push API
- **Lokaler_Speicher**: Persistenzschicht zur Speicherung aller Messdaten im Browser (IndexedDB)
- **PWA_Shell**: Die installierbare App-Hülle mit Service Worker, Manifest und Offline-Fähigkeit
- **Tägliche_Messung**: Datensatz bestehend aus Datum, Gewicht (kg) und Körperfettanteil (%)
- **Wöchentliche_Messung**: Datensatz bestehend aus Datum und Umfangswerten (cm) für konfigurierbare Körperteile
- **Zeitraum_Filter**: UI-Steuerung zur Auswahl des angezeigten Zeitraums im Graphen (z.B. 1W, 1M, 3M, 6M, 1J, Max)

## Anforderungen

### Anforderung 1: PWA-Installation und Offline-Fähigkeit

**User Story:** Als Nutzer möchte ich die App auf meinem iPhone installieren können, damit ich schnellen Zugriff wie bei einer nativen App habe.

#### Akzeptanzkriterien

1. THE PWA_Shell SHALL ein gültiges Web App Manifest mit Name, Icons (192x192, 512x512), Startseite, Display-Modus "standalone" und Theme-Farbe bereitstellen
2. THE PWA_Shell SHALL einen Service Worker registrieren, der die App-Shell und statische Assets für Offline-Nutzung cached
3. WHEN der Nutzer die App im Safari öffnet, THE PWA_Shell SHALL die Kriterien für "Add to Home Screen" auf iOS erfüllen
4. WHILE die App offline ist, THE PWA_Shell SHALL zuvor gespeicherte Messdaten aus dem Lokaler_Speicher anzeigen
5. WHILE die App offline ist, THE Dateneingabe_Formular SHALL neue Einträge im Lokaler_Speicher speichern

### Anforderung 2: Fitbit API Integration

**User Story:** Als Nutzer möchte ich meine Fitbit-Waage mit der App verbinden, damit Gewicht und Körperfett automatisch synchronisiert werden.

#### Akzeptanzkriterien

1. WHEN der Nutzer die Fitbit-Verbindung initiiert, THE Fitbit_Service SHALL einen OAuth 2.0 Authorization Code Flow mit PKCE starten
2. WHEN der OAuth-Flow erfolgreich abgeschlossen ist, THE Fitbit_Service SHALL das Access Token und Refresh Token sicher im Lokaler_Speicher speichern
3. WHEN der Nutzer die App öffnet und ein gültiges Fitbit-Token vorhanden ist, THE Fitbit_Service SHALL die Gewichts- und Körperfettdaten der letzten 30 Tage von der Fitbit Web API abrufen
4. WHEN die Fitbit API Gewichtsdaten liefert, THE Fitbit_Service SHALL die Daten als Tägliche_Messung im Lokaler_Speicher speichern
5. IF das Access Token abgelaufen ist, THEN THE Fitbit_Service SHALL automatisch ein neues Token über das Refresh Token anfordern
6. IF die Fitbit API einen Fehler zurückgibt, THEN THE App SHALL eine verständliche Fehlermeldung anzeigen und den manuellen Eingabemodus weiterhin ermöglichen
7. WHEN der Nutzer die Fitbit-Verbindung trennen möchte, THE Fitbit_Service SHALL alle gespeicherten Tokens entfernen

### Anforderung 3: Tägliche Dateneingabe (Gewicht und Körperfett)

**User Story:** Als Nutzer möchte ich täglich mein Gewicht und meinen Körperfettanteil manuell eintragen können, damit ich meine Werte auch ohne Fitbit-Waage tracken kann.

#### Akzeptanzkriterien

1. THE Dateneingabe_Formular SHALL Eingabefelder für Gewicht (in kg, eine Dezimalstelle) und Körperfettanteil (in %, eine Dezimalstelle) anzeigen
2. WHEN der Nutzer das Formular öffnet, THE Dateneingabe_Formular SHALL das aktuelle Datum vorausfüllen
3. WHEN der Nutzer gültige Werte eingibt und speichert, THE Dateneingabe_Formular SHALL die Tägliche_Messung im Lokaler_Speicher persistieren
4. IF der Nutzer einen Gewichtswert außerhalb von 30 kg bis 300 kg eingibt, THEN THE Dateneingabe_Formular SHALL eine Validierungsfehlermeldung anzeigen
5. IF der Nutzer einen Körperfettwert außerhalb von 1% bis 60% eingibt, THEN THE Dateneingabe_Formular SHALL eine Validierungsfehlermeldung anzeigen
6. WHEN für das aktuelle Datum bereits eine Tägliche_Messung existiert, THE Dateneingabe_Formular SHALL die vorhandenen Werte zum Bearbeiten anzeigen
7. THE Dateneingabe_Formular SHALL numerische Eingabefelder mit dem Attribut inputmode="decimal" verwenden, damit auf dem iPhone die Zahlentastatur erscheint

### Anforderung 4: Wöchentliche Körperumfang-Messung

**User Story:** Als Nutzer möchte ich wöchentlich den Umfang verschiedener Körperteile eintragen können, damit ich meinen Körperformverlauf verfolgen kann.

#### Akzeptanzkriterien

1. THE Dateneingabe_Formular SHALL Eingabefelder für Körperumfänge (in cm, eine Dezimalstelle) der folgenden Körperteile anzeigen: Brust, Taille, Hüfte, Oberarm (links/rechts), Oberschenkel (links/rechts)
2. WHEN der Nutzer das wöchentliche Formular öffnet, THE Dateneingabe_Formular SHALL das aktuelle Datum vorausfüllen
3. WHEN der Nutzer gültige Umfangswerte eingibt und speichert, THE Dateneingabe_Formular SHALL die Wöchentliche_Messung im Lokaler_Speicher persistieren
4. IF der Nutzer einen Umfangswert außerhalb von 10 cm bis 200 cm eingibt, THEN THE Dateneingabe_Formular SHALL eine Validierungsfehlermeldung anzeigen
5. WHEN für die aktuelle Woche bereits eine Wöchentliche_Messung existiert, THE Dateneingabe_Formular SHALL die vorhandenen Werte zum Bearbeiten anzeigen

### Anforderung 5: Graphansicht (Trade-Republic-Stil)

**User Story:** Als Nutzer möchte ich meine Messwerte in einem minimalistischen Liniendiagramm sehen, damit ich meinen Fortschritt über die Zeit visuell verfolgen kann.

#### Akzeptanzkriterien

1. THE Graph_Ansicht SHALL Messwerte als durchgezogene Linie ohne Gitterlinien, ohne Achsenbeschriftungen und mit minimalem Chrome darstellen (Trade-Republic-Aktienchart-Stil)
2. THE Graph_Ansicht SHALL den aktuellen Wert prominent über dem Graphen anzeigen
3. THE Graph_Ansicht SHALL die prozentuale Veränderung zum Startwert des gewählten Zeitraums anzeigen
4. WHEN der Nutzer einen Zeitraum_Filter auswählt (1W, 1M, 3M, 6M, 1J, Max), THE Graph_Ansicht SHALL die Daten des entsprechenden Zeitraums darstellen
5. WHEN der Nutzer mit dem Finger über den Graphen wischt, THE Graph_Ansicht SHALL den Wert und das Datum des berührten Datenpunkts anzeigen (Crosshair-Interaktion)
6. THE Graph_Ansicht SHALL separate Graphen für Gewicht, Körperfett und jeden Körperumfang bereitstellen
7. WHEN weniger als zwei Datenpunkte für den gewählten Zeitraum vorhanden sind, THE Graph_Ansicht SHALL einen Hinweistext anstelle des Graphen anzeigen
8. THE Graph_Ansicht SHALL die Linie in einer positiven Farbe (grün) darstellen, wenn der Trend abwärts geht (Gewichtsverlust), und in einer negativen Farbe (rot), wenn der Trend aufwärts geht

### Anforderung 6: Push-Benachrichtigungen

**User Story:** Als Nutzer möchte ich erinnert werden, wenn ich meine tägliche oder wöchentliche Eingabe noch nicht gemacht habe, damit ich keine Messung vergesse.

#### Akzeptanzkriterien

1. WHEN der Nutzer die App zum ersten Mal öffnet, THE Benachrichtigungs_Service SHALL die Berechtigung für Push-Benachrichtigungen anfragen
2. WHEN um 20:00 Uhr keine Tägliche_Messung für den aktuellen Tag vorhanden ist, THE Benachrichtigungs_Service SHALL eine Erinnerungsbenachrichtigung senden
3. WHEN am Sonntag um 20:00 Uhr keine Wöchentliche_Messung für die aktuelle Woche vorhanden ist, THE Benachrichtigungs_Service SHALL eine Erinnerungsbenachrichtigung senden
4. WHEN der Nutzer auf eine Benachrichtigung tippt, THE App SHALL die entsprechende Eingabeseite öffnen
5. WHERE der Nutzer Benachrichtigungen deaktiviert hat, THE Benachrichtigungs_Service SHALL keine Benachrichtigungen senden

### Anforderung 7: Datenpersistenz und Datenverwaltung

**User Story:** Als Nutzer möchte ich, dass meine Daten sicher im Browser gespeichert werden, damit ich keine Daten verliere.

#### Akzeptanzkriterien

1. THE Lokaler_Speicher SHALL alle Tägliche_Messung und Wöchentliche_Messung Datensätze in IndexedDB speichern
2. THE Lokaler_Speicher SHALL Datensätze nach Datum indexieren, um effiziente Zeitraumabfragen zu ermöglichen
3. WHEN der Nutzer einen Datensatz löschen möchte, THE App SHALL eine Bestätigungsabfrage anzeigen, bevor der Datensatz entfernt wird
4. THE App SHALL eine Export-Funktion bereitstellen, die alle Messdaten als JSON-Datei herunterlädt
5. THE App SHALL eine Import-Funktion bereitstellen, die eine zuvor exportierte JSON-Datei einliest und die Daten im Lokaler_Speicher speichert
6. FÜR ALLE gültigen Messdaten-JSON-Objekte, Export gefolgt von Import gefolgt von Export SHALL ein identisches JSON-Ergebnis produzieren (Round-Trip-Eigenschaft)

### Anforderung 8: Minimalistisches UI-Design

**User Story:** Als Nutzer möchte ich eine extrem aufgeräumte und ablenkungsfreie Oberfläche, damit ich mich auf das Wesentliche konzentrieren kann.

#### Akzeptanzkriterien

1. THE App SHALL das DB UX Design System (foundation.css, foundation-size.css) als Styling-Grundlage verwenden und die Regeln aus DB-DESIGN-SYSTEM-AI-GUIDE.md befolgen
2. THE App SHALL maximal drei Hauptansichten haben: Dashboard (mit Graphen), Tägliche Eingabe, Wöchentliche Eingabe
3. THE App SHALL eine untere Navigationsleiste mit maximal drei Einträgen verwenden
4. THE App SHALL keine unnötigen Animationen, Schatten oder dekorativen Elemente verwenden
5. THE App SHALL den automatischen Light/Dark-Mode des Design Systems über prefers-color-scheme nutzen
6. THE App SHALL ausschließlich CSS-Variablen des Design Systems für Farben, Abstände und Größen verwenden (keine hardcodierten px- oder Farbwerte)
7. THE App SHALL die `.adaptive` Utility-Klasse und `data-*` Attribute des Design Systems für Theming verwenden

### Anforderung 9: Daten-Serialisierung

**User Story:** Als Nutzer möchte ich meine Daten exportieren und importieren können, damit ich ein Backup meiner Messwerte habe.

#### Akzeptanzkriterien

1. WHEN der Nutzer den Export auslöst, THE App SHALL alle Messdaten in ein definiertes JSON-Format serialisieren
2. WHEN der Nutzer eine JSON-Datei importiert, THE App SHALL die Datei parsen und die Messdaten validieren
3. IF die importierte JSON-Datei ungültige Daten enthält, THEN THE App SHALL eine beschreibende Fehlermeldung anzeigen
4. THE App SHALL einen Pretty-Printer bereitstellen, der Messdaten-Objekte in gültiges, lesbares JSON formatiert
5. FÜR ALLE gültigen Messdaten-Objekte, Parsen dann Formatieren dann Parsen SHALL ein äquivalentes Objekt produzieren (Round-Trip-Eigenschaft)
