import type { CircumferenceZone } from '../types'
import './StepFlowScreen.css'

interface StepFlowScreenProps {
  zone: CircumferenceZone
  label: string
  hint: string
  value: string
  onChange: (value: string) => void
  onNext: () => void
  onSkip: () => void
  error?: string
  stepIndex: number
  totalSteps: number
}

function StepFlowScreen({
  label,
  hint,
  value,
  onChange,
  onNext,
  onSkip,
  error,
  stepIndex,
  totalSteps,
}: StepFlowScreenProps) {
  return (
    <div className="step-flow-screen adaptive">
      <span className="step-flow-progress">
        Schritt {stepIndex} von {totalSteps}
      </span>

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
