import type { CircumferenceZone } from '../types'
import Button from './core/Button'
import Input from './core/Input'
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

      <Input
        className="step-flow-input"
        type="text"
        inputMode="decimal"
        placeholder="cm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        error={error}
      />

      <div className="core-dialog-actions">
        <Button data-material="inverted" data-container-contrast="max" onClick={onNext}>
          Weiter
        </Button>
        {stepIndex > 1 ? (
          <div className="core-dialog-actions-row">
            <Button data-material="transparent" onClick={onBack}>Zurück</Button>
            <Button data-material="transparent" onClick={onSkip}>Überspringen</Button>
          </div>
        ) : (
          <Button data-material="transparent" onClick={onSkip}>Überspringen</Button>
        )}
      </div>
    </div>
  )
}

export default StepFlowScreen
