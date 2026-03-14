# Implementation Plan: Fitness Tracker PWA

## Übersicht

Inkrementelle Implementierung der Fitness Tracker PWA mit React 18 + TypeScript, Vite, uPlot, idb und vite-plugin-pwa. Die Implementierung folgt einem Bottom-Up-Ansatz: zuerst Datenmodelle und Services, dann UI-Komponenten, dann PWA-Features und Integrationen.

## Tasks

- [ ] 1. Projekt-Setup und Grundstruktur
  - [x] 1.1 Initialize Vite project with React + TypeScript template
    - Run `npm create vite@latest . -- --template react-ts`
    - Install dependencies: `idb`, `uplot`, `react-router-dom`, `vite-plugin-pwa`
    - Install dev dependencies: `vitest`, `fast-check`, `@testing-library/react`, `jsdom`
    - Configure `vitest` in `vite.config.ts` with jsdom environment
    - Copy `foundation.css`, `foundation-size.css` into `src/styles/`
    - Import design system CSS in `src/main.tsx`
    - _Requirements: 8.1, 8.5, 8.6, 8.7_

  - [x] 1.2 Define core TypeScript interfaces and types
    - Create `src/types/index.ts` with `DailyMeasurement`, `WeeklyMeasurement`, `ExportData`, `FitbitTokens`, `DataPoint`, `TimeRange`, `SyncResult`, `ImportResult`
    - Include validation range constants: `WEIGHT_MIN=30`, `WEIGHT_MAX=300`, `BODY_FAT_MIN=1`, `BODY_FAT_MAX=60`, `CIRCUMFERENCE_MIN=10`, `CIRCUMFERENCE_MAX=200`
    - _Requirements: 3.1, 3.4, 3.5, 4.1, 4.4_

  - [x] 1.3 Create validation utility functions
    - Create `src/utils/validation.ts`
    - Implement `validateWeight(value: number): boolean` — range 30-300
    - Implement `validateBodyFat(value: number): boolean` — range 1-60
    - Implement `validateCircumference(value: number): boolean` — range 10-200
    - Implement `roundToOneDecimal(value: number): number`
    - Implement `validateDailyMeasurement(data: unknown): ValidationResult`
    - Implement `validateWeeklyMeasurement(data: unknown): ValidationResult`
    - _Requirements: 3.4, 3.5, 4.4_

  - [ ]* 1.4 Write property test for measurement validation (Property 1)
    - **Property 1: Messwert-Validierung**
    - Test that for any numeric value and measurement field, the validation function accepts the value if and only if it is within the defined range
    - Use `fc.float()` to generate values inside and outside ranges
    - **Validates: Requirements 3.4, 3.5, 4.4**

  - [x] 1.5 Create date utility functions
    - Create `src/utils/date.ts`
    - Implement `formatDate(date: Date): string` — returns YYYY-MM-DD
    - Implement `getWeekStart(date: Date): string` — returns Monday of the week
    - Implement `getDateRange(range: TimeRange): { from: string; to: string }`
    - Implement `calculatePercentChange(start: number, current: number): number`
    - Implement `determineTrend(data: DataPoint[]): 'up' | 'down' | 'flat'`
    - _Requirements: 5.3, 5.4, 5.8_

  - [ ]* 1.6 Write property tests for date utilities
    - [ ]* 1.6.1 Property test for percentage change calculation (Property 11)
      - **Property 11: Prozentuale Veränderung Berechnung**
      - For any start value (> 0) and current value, the calculated percentage change equals `((current - start) / start) * 100` rounded to one decimal
      - Use `fc.float({min: 0.1})` for start and current values
      - **Validates: Requirements 5.3**
    - [ ]* 1.6.2 Property test for time range filter calculation (Property 12)
      - **Property 12: Zeitraum-Filter Berechnung**
      - For every TimeRange value and reference date, `getDateRange` returns a range whose difference matches the expected period
      - Use `fc.constantFrom('1W','1M','3M','6M','1J','Max')`
      - **Validates: Requirements 5.4**
    - [ ]* 1.6.3 Property test for trend direction (Property 13)
      - **Property 13: Trend-Richtung Bestimmung**
      - For any data series with at least two points, trend direction is correctly determined based on first vs last value
      - Use `fc.array(fc.record())` for DataPoint arrays
      - **Validates: Requirements 5.8**

- [x] 2. Checkpoint - Grundstruktur validieren
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Storage Layer (IndexedDB via idb)
  - [x] 3.1 Implement IndexedDB database setup
    - Create `src/services/db.ts`
    - Define `FitnessTrackerDB` schema with `DBSchema` from `idb`
    - Create object stores: `dailyMeasurements` (key: date), `weeklyMeasurements` (key: date), `fitbitAuth`
    - Add `by-date` index on both measurement stores
    - Implement `getDB()` singleton function to open/reuse the database connection
    - _Requirements: 7.1, 7.2_

  - [x] 3.2 Implement DataService
    - Create `src/services/dataService.ts`
    - Implement `saveDailyMeasurement(measurement: DailyMeasurement): Promise<void>` — validates then stores via `put()`
    - Implement `getDailyMeasurement(date: string): Promise<DailyMeasurement | undefined>`
    - Implement `getDailyMeasurements(from: string, to: string): Promise<DailyMeasurement[]>` — uses IDBKeyRange
    - Implement `deleteDailyMeasurement(date: string): Promise<void>`
    - Implement same CRUD methods for `WeeklyMeasurement`
    - Implement `getAllData(): Promise<ExportData>` and `importData(data: ExportData): Promise<ImportResult>`
    - Implement `clearAllData(): Promise<void>`
    - _Requirements: 3.3, 3.6, 4.3, 4.5, 7.1, 7.2, 7.3_

  - [ ]* 3.3 Write property test for measurement storage round-trip (Property 2)
    - **Property 2: Messdaten-Speicherung Round-Trip**
    - For any valid measurement, saving via DataService then retrieving by the same key returns an equivalent object
    - Use `fc.record()` to generate valid DailyMeasurement and WeeklyMeasurement objects
    - Requires fake-indexeddb or similar for testing
    - **Validates: Requirements 3.3, 3.6, 4.3, 4.5**

  - [ ]* 3.4 Write property test for date range queries (Property 3)
    - **Property 3: Zeitraum-Abfrage Korrektheit**
    - For any set of measurements and date range, `getMeasurements(from, to)` returns exactly those measurements whose date falls within [from, to]
    - Use `fc.date()` for ranges, `fc.array()` for measurements
    - **Validates: Requirements 7.2**

- [ ] 4. Serialization Service (JSON Export/Import)
  - [x] 4.1 Implement SerializationService
    - Create `src/services/serializationService.ts`
    - Implement `serialize(data: ExportData): string` — pretty-printed JSON with 2-space indent
    - Implement `deserialize(json: string): ExportData` — parse, validate schema, validate each measurement
    - Implement `validate(data: unknown): data is ExportData` — check version, arrays, measurement validity
    - Implement `exportToFile(data: ExportData): void` — create Blob, trigger download as `fitness-data-YYYY-MM-DD.json`
    - Implement `importFromFile(file: File): Promise<ExportData>` — read file, deserialize, return validated data
    - Throw descriptive errors for invalid data (missing fields, wrong types, out-of-range values)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 7.4, 7.5_

  - [ ]* 4.2 Write property tests for serialization
    - [ ]* 4.2.1 Property test for export-import round-trip (Property 4)
      - **Property 4: Export-Import Round-Trip**
      - For any valid ExportData, `serialize(importData(deserialize(serialize(data))))` is identical to `serialize(data)`
      - Use `fc.record()` to generate valid ExportData objects
      - **Validates: Requirements 7.6**
    - [ ]* 4.2.2 Property test for serialization round-trip (Property 5)
      - **Property 5: Serialisierung Round-Trip**
      - For any valid ExportData, `deserialize(serialize(data))` produces an equivalent object
      - **Validates: Requirements 9.5**
    - [ ]* 4.2.3 Property test for valid JSON output (Property 6)
      - **Property 6: Serialisierung erzeugt gültiges JSON**
      - For any valid ExportData, `serialize` produces valid JSON containing `version`, `exportedAt`, `dailyMeasurements`, `weeklyMeasurements`
      - **Validates: Requirements 9.1, 9.4**
    - [ ]* 4.2.4 Property test for deserialization validation (Property 7)
      - **Property 7: Deserialisierung und Validierung**
      - For any string, `deserialize` succeeds if and only if the string is valid JSON matching the ExportData schema; otherwise throws a descriptive error
      - Use `fc.string()`, `fc.json()`, `fc.record()`
      - **Validates: Requirements 9.2, 9.3**

- [x] 5. Checkpoint - Services validieren
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Fitbit Service (OAuth 2.0 + PKCE)
  - [x] 6.1 Implement PKCE utilities
    - Create `src/services/fitbitService.ts`
    - Implement `generateCodeVerifier(): string` — random 128-char string
    - Implement `generateCodeChallenge(verifier: string): Promise<string>` — SHA-256 + base64url
    - Implement `buildAuthorizationUrl(codeChallenge: string, state: string): string` — Fitbit OAuth URL with required params
    - _Requirements: 2.1_

  - [ ]* 6.2 Write property test for PKCE code challenge (Property 8)
    - **Property 8: PKCE Code Challenge Generierung**
    - For any code verifier, the code challenge equals the base64url-encoded SHA-256 hash, and the authorization URL contains `code_challenge`, `code_challenge_method=S256`, `response_type=code`, `client_id`
    - Use `fc.string()` for code verifier generation
    - **Validates: Requirements 2.1**

  - [x] 6.3 Implement Fitbit OAuth flow and data sync
    - Implement `initiateAuth(): Promise<void>` — generate PKCE params, store verifier, redirect to Fitbit
    - Implement `handleCallback(code: string, state: string): Promise<void>` — exchange code for tokens, store in IndexedDB
    - Implement `refreshToken(): Promise<void>` — use refresh token to get new access token
    - Implement `isConnected(): boolean` and `disconnect(): Promise<void>` — check/remove tokens
    - Implement `syncData(): Promise<SyncResult>` — fetch last 30 days weight/body-fat from Fitbit API, merge into DataService
    - Implement Fitbit API response → DailyMeasurement transformation
    - Handle errors: 401 (refresh), 429 (retry), 500+ (user message)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 6.4 Write property tests for Fitbit data handling
    - [ ]* 6.4.1 Property test for Fitbit data transformation (Property 9)
      - **Property 9: Fitbit-Daten Transformation**
      - For any valid Fitbit Weight Log entry, the transformation produces a valid DailyMeasurement with `source: 'fitbit'`
      - Use `fc.record()` for Fitbit Weight Log entries
      - **Validates: Requirements 2.4**
    - [ ]* 6.4.2 Property test for token storage round-trip (Property 10)
      - **Property 10: Token-Speicherung Round-Trip**
      - For any valid FitbitTokens, save then retrieve returns an equivalent object; after disconnect, isConnected returns false
      - Use `fc.record()` for FitbitTokens
      - **Validates: Requirements 2.2, 2.7**

- [ ] 7. Notification Service
  - [x] 7.1 Implement NotificationService
    - Create `src/services/notificationService.ts`
    - Implement `requestPermission(): Promise<NotificationPermission>` — request Web Push API permission
    - Implement `isEnabled(): boolean` — check current permission state
    - Implement `shouldNotify(type: 'daily' | 'weekly', measurements: DailyMeasurement[] | WeeklyMeasurement[]): boolean` — check if measurement exists for current day/week
    - Implement `scheduleDailyReminder()` and `scheduleWeeklyReminder()` — schedule notifications at 20:00
    - Implement `cancelAll()` — cancel all scheduled notifications
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 7.2 Write property test for notification logic (Property 14)
    - **Property 14: Benachrichtigungs-Logik**
    - For any date and measurement type, `shouldNotify` returns true if and only if no measurement exists for the period and notifications are enabled
    - Use `fc.date()`, `fc.boolean()` for measurement existence
    - **Validates: Requirements 6.2, 6.3, 6.5**

- [x] 8. Checkpoint - Alle Services validieren
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. UI-Komponenten: App Shell und Navigation
  - [x] 9.1 Create App component with React Router
    - Create `src/App.tsx` with React Router v6
    - Define three routes: `/` (Dashboard), `/daily` (Tägliche Eingabe), `/weekly` (Wöchentliche Eingabe)
    - Set DB Design System attributes on `<html>`: no explicit `data-color` (neutral default), no `data-material` (filled default)
    - Use `.adaptive` utility class for theming
    - _Requirements: 8.2, 8.5, 8.7_

  - [x] 9.2 Create BottomNavigation component
    - Create `src/components/BottomNavigation.tsx`
    - Three entries: Dashboard, Täglich, Wöchentlich
    - Use `data-interactive` on active elements
    - Fixed at bottom via `position: fixed`
    - Use only CSS variables from the design system for colors, spacing, sizing
    - _Requirements: 8.3, 8.4, 8.6_

- [ ] 10. UI-Komponenten: Formulare
  - [x] 10.1 Implement DailyInputView
    - Create `src/views/DailyInputView.tsx`
    - Date field pre-filled with today's date
    - Weight input: `inputmode="decimal"`, validation 30-300 kg, one decimal place
    - Body fat input: `inputmode="decimal"`, validation 1-60%, one decimal place
    - Load existing values for selected date via DataService
    - Show inline validation errors for out-of-range values
    - Save button with `data-material="vibrant"` and `data-interactive`
    - On save: persist via `DataService.saveDailyMeasurement()`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 10.2 Implement WeeklyInputView
    - Create `src/views/WeeklyInputView.tsx`
    - Fields for: Brust, Taille, Hüfte, Oberarm links/rechts, Oberschenkel links/rechts
    - All fields: `inputmode="decimal"`, validation 10-200 cm, one decimal place
    - Date pre-filled with current date, stored as Monday of the week
    - Load existing values for current week via DataService
    - Show inline validation errors
    - Save via `DataService.saveWeeklyMeasurement()`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 11. UI-Komponenten: Dashboard und Graph
  - [x] 11.1 Implement GraphComponent with uPlot
    - Create `src/components/GraphComponent.tsx`
    - Canvas-based line chart using uPlot
    - No grid lines, no axis labels, minimal chrome (Trade Republic style)
    - Line color: green for downward trend, red for upward trend
    - Touch crosshair: show value + date on swipe
    - Fallback text when < 2 data points
    - Accept `GraphComponentProps` interface from design
    - _Requirements: 5.1, 5.5, 5.7, 5.8_

  - [x] 11.2 Implement DashboardView
    - Create `src/views/DashboardView.tsx`
    - Show current value prominently above graph
    - Show percentage change relative to start of selected time range
    - TimeRangeSelector: buttons for 1W, 1M, 3M, 6M, 1J, Max
    - Tab bar to switch between Gewicht, Körperfett, and Körperumfänge
    - Separate graphs for each measurement type
    - Integrate Fitbit sync button (if connected)
    - Data export/import buttons in settings area
    - Delete confirmation dialog for measurements
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 7.3, 7.4, 7.5_

- [x] 12. Checkpoint - UI-Komponenten validieren
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. PWA-Konfiguration
  - [x] 13.1 Configure PWA with vite-plugin-pwa
    - Configure `vite-plugin-pwa` in `vite.config.ts`
    - Create Web App Manifest: name, icons (192x192, 512x512), start_url, display: "standalone", theme_color
    - Configure Workbox for precaching app shell and static assets
    - Register service worker in `src/main.tsx`
    - Ensure offline access to cached app shell and IndexedDB data
    - Ensure new entries can be saved offline to IndexedDB
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 14. Integration und Verdrahtung
  - [x] 14.1 Wire Fitbit OAuth callback route
    - Add `/callback` route in App.tsx for Fitbit OAuth redirect
    - Parse `code` and `state` from URL params
    - Call `FitbitService.handleCallback()` and redirect to Dashboard
    - Show error state if callback fails
    - _Requirements: 2.1, 2.2_

  - [x] 14.2 Wire notification scheduling
    - Request notification permission on first app open
    - Schedule daily reminder at 20:00 if no measurement exists
    - Schedule weekly reminder on Sunday at 20:00 if no weekly measurement exists
    - Handle notification tap → navigate to corresponding input view
    - Respect disabled notification state
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 14.3 Wire data export/import in DashboardView
    - Connect export button to `SerializationService.exportToFile()`
    - Connect import button to file picker + `SerializationService.importFromFile()`
    - Show error messages for invalid import files
    - Refresh dashboard data after successful import
    - _Requirements: 7.4, 7.5, 9.1, 9.2, 9.3_

- [x] 15. Final Checkpoint - Gesamte App validieren
  - Ensure all tests pass, ask the user if questions arise.

## Hinweise

- Tasks mit `*` sind optional und können für ein schnelleres MVP übersprungen werden
- Jeder Task referenziert spezifische Anforderungen für Nachverfolgbarkeit
- Checkpoints stellen inkrementelle Validierung sicher
- Property-Tests validieren universelle Korrektheitseigenschaften
- Unit-Tests validieren spezifische Beispiele und Edge Cases
- Das DB UX Design System (foundation.css, foundation-size.css, DB-DESIGN-SYSTEM-AI-GUIDE.md) muss bei allen UI-Komponenten beachtet werden
