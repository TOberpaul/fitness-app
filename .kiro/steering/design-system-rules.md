# Design System Regeln für dieses Projekt

Dieses Steering-File enthält verbindliche Regeln für die Nutzung des DB UX Design Systems und der Core-Komponenten in diesem Projekt. Diese Regeln gelten immer und überall.

## Core-Komponenten

Verwende immer die DS Core-Komponenten statt roher HTML-Elemente:

- `Button` (`src/components/core/Button.tsx`) statt `<button>`
- `Card` (`src/components/core/Card.tsx`) statt `<div>` für Karten/Container
- `Section` (`src/components/core/Section.tsx`) statt `<section>` — nutze die `title`-Prop für Überschriften
- `Input` (`src/components/core/Input.tsx`) statt `<input>` — nutze `label` und `error` Props
- `Dialog` (`src/components/core/Dialog.tsx`) für alle Level-2-Seiten (Detail-Views, Formulare)
- `Badge` (`src/components/core/Badge.tsx`) für Badges/Zähler

Keine rohen `<button>`, `<input>`, `<section>` Elemente in Views verwenden.

## Button-Regeln

- Buttons haben `width: auto` als Default — sie sind nur so breit wie ihr Inhalt.
- Text-Buttons: `padding-left/right: var(--size-padding)` (größeres horizontales Padding).
- Icon-only Buttons: `iconOnly` Prop setzen → `padding: var(--size-padding-min)` rundrum.
- Alle Buttons haben `min-width: var(--size-container)` und `min-height: var(--size-container)`.
- Wenn ein Button full-width sein soll (z.B. "Speichern", "Hinzufügen" als CTA), setze `width: 100%` in der eigenen CSS-Klasse.
- Schreibe keine Custom-Styles für Buttons (kein eigenes `background`, `border`, `cursor`, `font` etc.) — das DS übernimmt das.

## Active/Selected State

- Für aktive/selektierte Elemente (Tabs, Toggle-Buttons) verwende `data-material="inverted"` zusammen mit `data-container-contrast="max"` auf dem aktiven Element.
- Keine Custom-CSS-Klassen wie `--active` mit eigenen Border/Background-Styles.
- Beispiel: `<Button data-material={isActive ? 'inverted' : undefined} data-container-contrast={isActive ? 'max' : undefined}>Tab</Button>`

## Level-2-Seiten (Detail-Views)

- Alle Detail-/Unter-Seiten werden als `Dialog`-Overlay gerendert, nicht als separate Routes.
- Pattern: Die Parent-View verwaltet den Dialog-State (`open`/`onClose` Props).
- Beispiel: `GoalCreateView`, `GoalDetailView`, `AddFoodView`, `FoodDetailView` sind alle Dialoge.

## Styling-Regeln

- Kein `margin` verwenden — nur `gap` und `padding`.
- Keine `px`-Werte — nutze DS-Tokens (`var(--size-gap)`, `var(--spacing-padding)`, etc.).
- Keine Inline-Styles für Farben/Größen — nutze Data-Attributes.
- Keine `!important`-Regeln.
- Schwacher Text: `data-emphasis="weak"` statt eigener Opacity/Color.
- Starker Text: `data-emphasis="strong"` statt eigenem `font-weight`.

## Defaults nicht explizit setzen

Folgende Attribute NICHT setzen, da sie bereits Default sind:
- `data-color="neutral"` (ist Default)
- `data-material="filled"` (ist Default)
- `data-size="md"` (ist Default)
- `data-spacing="md"` (ist Default)

## Badge

- Badge hat feste Größe (20×20px) — die `.core-badge-count` Klasse überschreibt adaptive Styles.
- Nutze `inline` Prop für Badges die im Textfluss stehen (nicht absolut positioniert).
