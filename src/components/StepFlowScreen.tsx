import type { CircumferenceZone } from '../types'
import './StepFlowScreen.css'

interface StepFlowScreenProps {
  zone: CircumferenceZone
  label: string
  hint: string
  illustration?: string
  value: string
  onChange: (value: string) => void
  onNext: () => void
  onSkip: () => void
  onCancel: () => void
  onBack?: () => void
  error?: string
  stepIndex: number
  totalSteps: number
}

function StepFlowScreen({
  label,
  hint,
  illustration,
  value,
  onChange,
  onNext,
  onSkip,
  onBack,
  error,
  stepIndex,
}: StepFlowScreenProps) {
  return (
    <div className="step-flow-screen adaptive">
      {illustration && (
        <img
          className="step-flow-illustration"
          src={illustration}
          alt={`Messanleitung ${label}`}
        />
      )}

      <h2 className="step-flow-label">{label}</h2>

      <p className="step-flow-hint">{hint}</p>

      <input
        className="step-flow-input"
        type="text"
        inputMode="decimal"
        placeholder="cm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        aria-invalid={!!error}
      />

      {error && <p className="step-flow-error" role="alert">{error}</p>}

      <div className="core-dialog-actions">
        <button
          className="adaptive"
          data-interactive
          data-material="inverted"
          data-container-contrast="max"
          onClick={onNext}
        >
          Weiter
        </button>
        {stepIndex > 1 ? (
          <div className="core-dialog-actions-row">
            <button className="core-dialog-secondary" data-interactive onClick={onBack}>Zurück</button>
            <button className="core-dialog-secondary" data-interactive onClick={onSkip}>Überspringen</button>
          </div>
        ) : (
          <button className="core-dialog-secondary" data-interactive onClick={onSkip}>Überspringen</button>
        )}
      </div>
    </div>
  )
}

export default StepFlowScreen
