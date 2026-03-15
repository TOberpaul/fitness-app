import type { StepFlowEntry, WeeklyMeasurement, CircumferenceZone } from '../types'
import './StepFlowSummary.css'

interface StepFlowSummaryProps {
  entries: StepFlowEntry[]
  previousWeek: WeeklyMeasurement | undefined
  onConfirm: () => void
  onBack: () => void
}

type DiffClassification = 'decrease' | 'stable' | 'increase'

const POSITIVE_PHRASES = [
  'Starker Fortschritt!',
  'Weiter so!',
  'Tolle Entwicklung!',
]

function getPreviousValue(
  zone: CircumferenceZone,
  previousWeek: WeeklyMeasurement | undefined
): number | undefined {
  if (!previousWeek) return undefined
  return previousWeek[zone]
}

function classifyDiff(diff: number): DiffClassification {
  if (diff < -0.3) return 'decrease'
  if (diff > 0.3) return 'increase'
  return 'stable'
}

function getPositivePhrase(index: number): string {
  return POSITIVE_PHRASES[index % POSITIVE_PHRASES.length]
}

function StepFlowSummary({
  entries,
  previousWeek,
  onConfirm,
  onBack,
}: StepFlowSummaryProps) {
  const enteredEntries = entries.filter((e) => !e.skipped && e.value !== null)

  const classifications: { entry: StepFlowEntry; classification: DiffClassification | 'first' }[] =
    enteredEntries.map((entry) => {
      const prev = getPreviousValue(entry.zone, previousWeek)
      if (prev === undefined) {
        return { entry, classification: 'first' as const }
      }
      const diff = entry.value! - prev
      return { entry, classification: classifyDiff(diff) }
    })

  const allStableOrIncreased = classifications.length > 0 && classifications.every(
    (c) => c.classification === 'stable' || c.classification === 'increase'
  )

  return (
    <div className="step-flow-summary">
      <div className="step-flow-summary-list">
        {classifications.map(({ entry, classification }, index) => {
          const prev = getPreviousValue(entry.zone, previousWeek)
          const diff = prev !== undefined ? entry.value! - prev : null

          return (
            <div key={entry.zone} className="step-flow-summary-item adaptive">
              <div>
                <span className="step-flow-summary-item-label">{entry.label}</span>
                <span className="step-flow-summary-item-value"> {entry.value} cm</span>
              </div>
              <div>
                {classification === 'first' && (
                  <span className="step-flow-summary-item-first">Erster Eintrag</span>
                )}
                {classification === 'decrease' && diff !== null && (
                  <>
                    <span className="step-flow-summary-item-delta step-flow-summary-item-delta--decrease">
                      {diff > 0 ? '+' : ''}{diff.toFixed(1)} cm
                    </span>
                    {' '}
                    <span className="step-flow-summary-item-feedback">
                      {getPositivePhrase(index)}
                    </span>
                  </>
                )}
                {classification === 'stable' && diff !== null && (
                  <span className="step-flow-summary-item-delta">
                    {diff > 0 ? '+' : ''}{diff.toFixed(1)} cm
                  </span>
                )}
                {classification === 'increase' && diff !== null && (
                  <span className="step-flow-summary-item-delta">
                    +{diff.toFixed(1)} cm
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {allStableOrIncreased && (
        <p className="step-flow-summary-global-message">
          Dranbleiben — Veränderung braucht Zeit.
        </p>
      )}

      <div className="core-dialog-actions">
        <button
          className="adaptive"
          data-material="inverted"
          data-container-contrast="max"
          data-interactive
          onClick={onConfirm}
        >
          Bestätigen
        </button>
        <button
          className="core-dialog-secondary"
          data-interactive
          onClick={onBack}
        >
          Zurück
        </button>
      </div>
    </div>
  )
}

export default StepFlowSummary
