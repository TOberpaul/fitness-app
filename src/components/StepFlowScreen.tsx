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
  onCancel,
  error,
  stepIndex,
  totalSteps,
}: StepFlowScreenProps) {
  return (
    <div className="step-flow-screen adaptive">
      <div className="step-flow-header">
        <button
          className="step-flow-cancel adaptive"
          data-interactive
          onClick={onCancel}
        >
          Abbrechen
        </button>
        <span className="step-flow-progress">
          {stepIndex} / {totalSteps}
        </span>
      </div>

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

      <div className="step-flow-actions">
        <button
          className="step-flow-next adaptive"
          data-interactive
          data-material="inverted"
          data-container-contrast="max"
          onClick={onNext}
        >
          Weiter
        </button>
        <button
          className="step-flow-skip adaptive"
          data-interactive
          onClick={onSkip}
        >
          Überspringen
        </button>
      </div>
    </div>
  )
}

export default StepFlowScreen
