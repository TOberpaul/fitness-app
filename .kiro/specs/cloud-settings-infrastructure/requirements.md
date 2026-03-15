# Anforderungsdokument

## Einführung

Dieses Feature umfasst die Cloud-Infrastruktur, Push-Benachrichtigungen, Einstellungsseite, Theme-Umschaltung und Swipe-Navigation der Fitness Tracker PWA. Es ergänzt die Kern-App (fitness-tracker-pwa Spec) und das Coaching/Gamification-System (coaching-goals-gamification Spec) um persistente Cloud-Synchronisation via Supabase, serverseitige Web Push Notifications, eine zentrale Einstellungsseite und UX-Verbesserungen wie horizontales Wischen und Theme-Wahl.

## Glossar

- **Supabase_Sync**: Bidirektionaler Cloud-Synchronisationsdienst, der lokale IndexedDB-Daten mit einer Supabase-Datenbank abgleicht
- **Push_Service**: Modul zur Verwaltung von Web Push Subscriptions via VAPID-Schlüssel und Supabase-gespeicherten Endpoints
- **Settings_View**: Zentrale Einstellungsseite mit Fitbit-Verbindung, Daten-Export/Import, Theme-Umschaltung und Push-Toggle
- **Theme_Manager**: Logik zur Umschaltung zwischen System/Hell/Dunkel-Modus via `data-mode` Attribut auf `<html>`
- **Swipe_Navigation**: Touch-basierte horizontale Navigation zwischen den Hauptansichten der App
- **Device_ID**: Eindeutige Geräte-Kennung (UUID), die lokal generiert und in localStorage gespeichert wird, um Daten pro Gerät in Supabase zu trennen
- **Push_Subscription**: Web Push API Subscription-Objekt mit Endpoint, p256dh-Schlüssel und Auth-Token

## Anforderungen

### Anforderung 1: Supabase Cloud Sync

**User Story:** Als Nutzer möchte ich, dass meine Daten automatisch in die Cloud synchronisiert werden, damit ich kein manuelles Backup machen muss und meine Daten sicher sind.

#### Akzeptanzkriterien

1. WHEN die App gestartet wird und die letzte Synchronisation mehr als 24 Stunden zurückliegt, THE Supabase_Sync SHALL automatisch eine bidirektionale Synchronisation durchführen
2. THE Supabase_Sync SHALL eine eindeutige Device_ID pro Gerät generieren und in localStorage speichern, um Daten gerätebasiert zu trennen
3. WHEN lokale Daten neuer sind als die Remote-Daten (basierend auf `updatedAt`), THE Supabase_Sync SHALL die lokalen Daten nach Supabase pushen
4. WHEN Remote-Daten neuer sind als die lokalen Daten, THE Supabase_Sync SHALL die Remote-Daten in die lokale IndexedDB übernehmen
5. THE Supabase_Sync SHALL folgende Datentypen synchronisieren: tägliche Messungen, wöchentliche Messungen, Goals, Milestones und Streaks
6. WHEN die Synchronisation fehlschlägt (z.B. Netzwerkfehler), THE Supabase_Sync SHALL den Fehler in der Konsole loggen und die App normal weiter funktionieren lassen
7. THE Supabase_Sync SHALL beim Pull zuerst Remote-Daten laden und dann beim Push lokale Änderungen hochladen, um Datenverlust zu vermeiden

### Anforderung 2: Web Push Notifications

**User Story:** Als Nutzer möchte ich Push-Benachrichtigungen auf meinem Gerät empfangen können, auch wenn die App geschlossen ist, damit ich an meine Messungen erinnert werde.

#### Akzeptanzkriterien

1. WHEN der Nutzer Push-Benachrichtigungen aktiviert, THE Push_Service SHALL die Browser-Berechtigung anfragen und bei Genehmigung eine Web Push Subscription erstellen
2. THE Push_Service SHALL die Subscription (Endpoint, p256dh, Auth) in der Supabase-Tabelle `push_subscriptions` speichern
3. WHEN der Nutzer Push-Benachrichtigungen deaktiviert, THE Push_Service SHALL die Subscription beim Browser abmelden und aus Supabase löschen
4. THE Push_Service SHALL einen VAPID Public Key verwenden, um die Subscription zu erstellen
5. WHEN eine Push-Nachricht empfangen wird, THE Service Worker SHALL eine Notification mit Titel, Body und App-Icon anzeigen
6. WHEN der Nutzer auf eine Notification tippt, THE Service Worker SHALL die App öffnen und zur entsprechenden URL navigieren
7. THE Push_Service SHALL den Subscription-Status in localStorage cachen für schnelle UI-Aktualisierung

### Anforderung 3: Settings View

**User Story:** Als Nutzer möchte ich eine zentrale Einstellungsseite haben, auf der ich alle App-Konfigurationen verwalten kann.

#### Akzeptanzkriterien

1. THE Settings_View SHALL über die Bottom-Navigation erreichbar sein (Route `/settings`)
2. THE Settings_View SHALL eine Fitbit-Sektion anzeigen mit Verbinden/Trennen-Button und Sync-Button (wenn verbunden)
3. THE Settings_View SHALL eine Daten-Sektion anzeigen mit Export- und Import-Buttons
4. THE Settings_View SHALL eine Erscheinungsbild-Sektion anzeigen mit Theme-Umschaltung (System/Hell/Dunkel)
5. THE Settings_View SHALL eine Benachrichtigungs-Sektion anzeigen mit einem Toggle für Push-Erinnerungen
6. WHEN eine Aktion (Sync, Export, Import) ausgeführt wird, THE Settings_View SHALL eine temporäre Statusmeldung auf Deutsch anzeigen (3 Sekunden sichtbar)
7. THE Settings_View SHALL alle Texte auf Deutsch anzeigen und das DB UX Design System verwenden (`.adaptive`, `data-interactive`, CSS-Variablen)

### Anforderung 4: Theme-Umschaltung

**User Story:** Als Nutzer möchte ich zwischen hellem, dunklem und System-Modus wechseln können, damit die App meinen Vorlieben entspricht.

#### Akzeptanzkriterien

1. THE Theme_Manager SHALL drei Modi unterstützen: System (folgt `prefers-color-scheme`), Hell (erzwingt Light), Dunkel (erzwingt Dark)
2. WHEN der Nutzer einen Modus wählt, THE Theme_Manager SHALL das `data-mode` Attribut auf `<html>` setzen (oder entfernen bei System-Modus)
3. THE Theme_Manager SHALL die Auswahl in localStorage unter `theme_mode` persistieren
4. WHEN die App gestartet wird, THE Theme_Manager SHALL den gespeicherten Modus vor dem ersten Render anwenden, um einen Flash-of-Wrong-Theme zu vermeiden
5. THE Theme_Manager SHALL die Umschaltung als Tab-Leiste mit `data-material="semi-transparent"` darstellen

### Anforderung 5: Swipe-Navigation

**User Story:** Als Nutzer möchte ich durch horizontales Wischen zwischen den Hauptansichten navigieren können, damit die App sich wie eine native App anfühlt.

#### Akzeptanzkriterien

1. THE Swipe_Navigation SHALL horizontales Wischen zwischen den vier Hauptrouten ermöglichen: Dashboard (`/`), Täglich (`/daily`), Wöchentlich (`/weekly`), Einstellungen (`/settings`)
2. THE Swipe_Navigation SHALL einen Mindest-Schwellenwert von 50px für die Erkennung eines Swipes verwenden
3. THE Swipe_Navigation SHALL nur horizontale Gesten erkennen (horizontale Bewegung muss mindestens 0.7× der vertikalen Bewegung betragen)
4. THE Swipe_Navigation SHALL nur auf den vier Hauptrouten aktiv sein und nicht auf Unterseiten (Goals, Achievements, Onboarding)

### Anforderung 6: Service Worker und Push Handler

**User Story:** Als Entwickler möchte ich einen dedizierten Push-Handler im Service Worker haben, damit Push-Nachrichten auch bei geschlossener App verarbeitet werden.

#### Akzeptanzkriterien

1. THE Service Worker SHALL einen `push` Event-Listener registrieren, der eingehende Push-Nachrichten als Notifications anzeigt
2. THE Service Worker SHALL Push-Daten als JSON parsen und bei Fehler den Rohtext als Body verwenden
3. THE Service Worker SHALL einen `notificationclick` Event-Listener registrieren, der die App beim Tippen auf die Notification öffnet
4. THE Service Worker SHALL das App-Icon (192px) als Notification-Icon und Badge verwenden
5. THE Service Worker SHALL ein `tag`-Feld unterstützen, um doppelte Notifications zu vermeiden
