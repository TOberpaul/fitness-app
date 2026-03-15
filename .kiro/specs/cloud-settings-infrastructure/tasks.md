# Implementation Plan: Cloud, Settings & Infrastruktur

## Übersicht

Dokumentation der bereits implementierten Infrastruktur-Features: Supabase Cloud Sync, Web Push Notifications, Settings View, Theme-Umschaltung und Swipe-Navigation. Alle Tasks sind abgeschlossen.

## Tasks

- [x] 1. Supabase Client Setup
  - [x] 1.1 `src/services/supabase.ts` erstellen
    - Supabase Client mit `createClient(SUPABASE_URL, SUPABASE_ANON_KEY)` initialisieren
    - _Requirements: 1.1_

- [x] 2. Cloud Sync Service
  - [x] 2.1 `src/services/cloudSync.ts` erstellen
    - `getDeviceId()`: UUID generieren und in localStorage speichern
    - `syncIfNeeded()`: Sync nur wenn letzte Synchronisation >24h her
    - _Requirements: 1.1, 1.2_

  - [x] 2.2 Push-to-Cloud Logik implementieren
    - Tägliche Messungen, wöchentliche Messungen nach Supabase pushen
    - "Newer wins" Strategie: nur pushen wenn `local.updatedAt > remote.updated_at`
    - Upsert mit `onConflict: 'device_id,date'`
    - _Requirements: 1.3, 1.5_

  - [x] 2.3 Pull-from-Cloud Logik implementieren
    - Remote-Daten laden und in lokale IndexedDB übernehmen
    - Nur überschreiben wenn `remote.updated_at > local.updatedAt`
    - Ungültige Rows per try/catch überspringen
    - _Requirements: 1.4, 1.7_

  - [x] 2.4 Goals, Milestones und Streaks Sync ergänzen
    - Goals-Tabelle mit `onConflict: 'device_id,id'` synchronisieren
    - Milestones-Tabelle synchronisieren (kein updatedAt, immer sync)
    - Streaks als Singleton pro Device synchronisieren
    - _Requirements: 1.5_

- [x] 3. Web Push Service
  - [x] 3.1 `src/services/pushService.ts` erstellen
    - `subscribeToPush()`: Permission anfragen, Subscription erstellen, in Supabase speichern
    - `unsubscribeFromPush()`: Subscription abmelden, aus Supabase löschen
    - `isPushSubscribed()`: Status prüfen (SW + localStorage Fallback)
    - VAPID Public Key für `pushManager.subscribe()` verwenden
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.7_

  - [x] 3.2 `public/sw-push.js` erstellen
    - `push` Event-Listener: JSON parsen, Notification anzeigen mit Icon und Badge
    - `notificationclick` Event-Listener: App öffnen via `clients.openWindow()`
    - Tag-Support für Deduplizierung
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 4. Settings View
  - [x] 4.1 `src/views/SettingsView.tsx` und `SettingsView.css` erstellen
    - Fitbit-Sektion: Verbinden/Trennen/Sync Buttons
    - Daten-Sektion: Export/Import Buttons
    - Erscheinungsbild-Sektion: Theme-Tab-Leiste (System/Hell/Dunkel)
    - Benachrichtigungs-Sektion: Push-Toggle mit Custom Switch
    - Temporäre Statusmeldungen (3s) für Sync/Export/Import
    - `.adaptive`, `data-interactive`, CSS-Variablen, deutsche Texte
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 4.2 Route `/settings` in App.tsx registrieren
    - _Requirements: 3.1_

- [x] 5. Theme-Umschaltung
  - [x] 5.1 Theme-Init in `src/main.tsx` implementieren
    - Gespeicherten Modus aus localStorage lesen vor `createRoot()`
    - `data-mode` Attribut auf `<html>` setzen um Flash-of-Wrong-Theme zu vermeiden
    - _Requirements: 4.3, 4.4_

  - [x] 5.2 Theme-Wechsel in SettingsView implementieren
    - Drei Modi: System (removeAttribute), Hell (data-mode=light), Dunkel (data-mode=dark)
    - Auswahl in localStorage persistieren
    - Tab-Leiste mit `data-material="semi-transparent"`
    - _Requirements: 4.1, 4.2, 4.5_

- [x] 6. Swipe-Navigation
  - [x] 6.1 SwipeContainer in `src/App.tsx` implementieren
    - Touch-Events: `onTouchStart`, `onTouchEnd`
    - Schwellenwert: 50px horizontal
    - Richtungserkennung: horizontal > vertikal * 0.7
    - Nur auf Hauptrouten aktiv: `/`, `/daily`, `/weekly`, `/settings`
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 7. Bottom Navigation erweitern
  - [x] 7.1 Vierten Tab "Mehr" (Settings) in BottomNavigation hinzufügen
    - Lucide React Icons: ChartLine, Scale, RulerDimensionLine, Settings
    - Active State: `data-material="inverted"`, `data-container-contrast="max"`
    - Inactive State: `data-material="transparent"`
    - sr-only Labels für Accessibility
    - _Requirements: 3.1_

## Hinweise

- Alle Tasks sind bereits implementiert und produktiv
- Diese Spec dokumentiert nachträglich die bestehende Implementierung
- Supabase-Tabellen müssen manuell in der Supabase Console erstellt werden (kein Migration-Script)
- Der VAPID Public Key ist im Code hardcoded — der Private Key liegt serverseitig
- Push-Nachrichten werden extern getriggert (z.B. Supabase Edge Function oder Cron)
