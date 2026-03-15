import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveDailyMeasurement } from '../services/dataService'
import { createGoal } from '../services/goalService'
import './GoalOnboarding.css'

function GoalOnboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  // Step 1: Starting weight
  const [weight, setWeight] = useState('')
  const [weightError, setWeightError] = useState('')

  // Step 2: Weight goal
  const [targetWeight, setTargetWeight] = useState('')
  const [goalError, setGoalError] = useState('')

  // Step 3: Reminder time
  const [reminderTime, setReminderTime] = useState('20:00')

  // Step 4: Weekly measurement toggle
  const [weeklyEnabled, setWeeklyEnabled] = useState(false)

  // Saved weight for goal validation
  const [savedWeight, setSavedWeight] = useState<number | null>(null)

  const totalSteps = 6 // 0-5

  const finishOnboarding = () => {
    localStorage.setItem('onboardingCompleted', 'true')
    navigate('/')
  }

  const handleWeightNext = async () => {
    setWeightError('')
    const val = Number(weight)
    if (isNaN(val) || weight.trim() === '' || val < 30 || val > 300) {
      setWeightError('Bitte einen Wert zwischen 30 und 300 kg eingeben.')
      return
    }
    try {
      const today = new Date().toISOString().slice(0, 10)
      await saveDailyMeasurement({
        date: today,
        weight: val,
        source: 'manual',
        updatedAt: new Date().toISOString(),
      })
      setSavedWeight(val)
      setStep(2)
    } catch {
      setWeightError('Fehler beim Speichern.')
    }
  }

  const handleGoalNext = async () => {
    setGoalError('')
    const target = Number(targetWeight)
    if (isNaN(target) || targetWeight.trim() === '' || target < 30 || target > 300) {
      setGoalError('Bitte einen Wert zwischen 30 und 300 kg eingeben.')
      return
    }
    if (savedWeight !== null && target === savedWeight) {
      setGoalError('Zielwert muss sich vom Startgewicht unterscheiden.')
      return
    }
    try {
      const startVal = savedWeight ?? target
      await createGoal({
        metricType: 'weight',
        startValue: startVal,
        targetValue: target,
      })
      setStep(3)
    } catch {
      setGoalError('Fehler beim Erstellen des Ziels.')
    }
  }

  const handleReminderActivate = () => {
    localStorage.setItem('reminderTime', reminderTime)
    setStep(4)
  }

  const handleWeeklyActivate = () => {
    localStorage.setItem('weeklyMeasurementEnabled', weeklyEnabled ? 'true' : 'false')
    setStep(5)
  }

  // Step 0: Welcome
  if (step === 0) {
    return (
      <div className="goal-onboarding adaptive">
        <ProgressDots current={step} total={totalSteps} />
        <h1>Willkommen!</h1>
        <p>Lass uns dein Tracking einrichten.</p>
        <div className="goal-onboarding-actions">
          <button
            className="adaptive"
            data-material="inverted"
            data-container-contrast="max"
            data-interactive
            onClick={() => setStep(1)}
          >
            Los geht's
          </button>
        </div>
      </div>
    )
  }

  // Step 1: Starting weight
  if (step === 1) {
    return (
      <div className="goal-onboarding adaptive">
        <ProgressDots current={step} total={totalSteps} />
        <h1>Startgewicht</h1>
        <p>Wie viel wiegst du aktuell?</p>
        <div className="goal-onboarding-field">
          <label htmlFor="onboarding-weight">Gewicht (kg)</label>
          <input
            id="onboarding-weight"
            className="adaptive"
            type="text"
            inputMode="decimal"
            placeholder="z.B. 85.0"
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value)
              setWeightError('')
            }}
            aria-invalid={!!weightError}
          />
        </div>
        {weightError && <p className="goal-onboarding-error" role="alert">{weightError}</p>}
        <div className="goal-onboarding-actions">
          <button
            className="adaptive"
            data-material="inverted"
            data-container-contrast="max"
            data-interactive
            onClick={handleWeightNext}
          >
            Weiter
          </button>
          <button
            className="goal-onboarding-skip adaptive"
            data-interactive
            onClick={() => setStep(2)}
          >
            Überspringen
          </button>
        </div>
      </div>
    )
  }

  // Step 2: Weight goal
  if (step === 2) {
    return (
      <div className="goal-onboarding adaptive">
        <ProgressDots current={step} total={totalSteps} />
        <h1>Gewichtsziel</h1>
        <p>Was ist dein Zielgewicht?</p>
        <div className="goal-onboarding-field">
          <label htmlFor="onboarding-target">Zielgewicht (kg)</label>
          <input
            id="onboarding-target"
            className="adaptive"
            type="text"
            inputMode="decimal"
            placeholder="z.B. 75.0"
            value={targetWeight}
            onChange={(e) => {
              setTargetWeight(e.target.value)
              setGoalError('')
            }}
            aria-invalid={!!goalError}
          />
        </div>
        {goalError && <p className="goal-onboarding-error" role="alert">{goalError}</p>}
        <div className="goal-onboarding-actions">
          <button
            className="adaptive"
            data-material="inverted"
            data-container-contrast="max"
            data-interactive
            onClick={handleGoalNext}
          >
            Ziel setzen
          </button>
          <button
            className="goal-onboarding-skip adaptive"
            data-interactive
            onClick={() => setStep(3)}
          >
            Überspringen
          </button>
        </div>
      </div>
    )
  }

  // Step 3: Reminder time
  if (step === 3) {
    return (
      <div className="goal-onboarding adaptive">
        <ProgressDots current={step} total={totalSteps} />
        <h1>Erinnerung</h1>
        <p>Wann möchtest du täglich erinnert werden?</p>
        <div className="goal-onboarding-field">
          <label htmlFor="onboarding-reminder">Uhrzeit</label>
          <input
            id="onboarding-reminder"
            className="adaptive"
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
          />
        </div>
        <div className="goal-onboarding-actions">
          <button
            className="adaptive"
            data-material="inverted"
            data-container-contrast="max"
            data-interactive
            onClick={handleReminderActivate}
          >
            Aktivieren
          </button>
          <button
            className="goal-onboarding-skip adaptive"
            data-interactive
            onClick={() => setStep(4)}
          >
            Überspringen
          </button>
        </div>
      </div>
    )
  }

  // Step 4: Weekly measurement
  if (step === 4) {
    return (
      <div className="goal-onboarding adaptive">
        <ProgressDots current={step} total={totalSteps} />
        <h1>Wöchentliche Messung</h1>
        <p>Möchtest du wöchentlich deine Umfänge messen?</p>
        <div className="goal-onboarding-toggle">
          <input
            id="onboarding-weekly"
            type="checkbox"
            checked={weeklyEnabled}
            onChange={(e) => setWeeklyEnabled(e.target.checked)}
          />
          <label htmlFor="onboarding-weekly">Umfangmessung aktivieren</label>
        </div>
        <div className="goal-onboarding-actions">
          <button
            className="adaptive"
            data-material="inverted"
            data-container-contrast="max"
            data-interactive
            onClick={handleWeeklyActivate}
          >
            Aktivieren
          </button>
          <button
            className="goal-onboarding-skip adaptive"
            data-interactive
            onClick={() => setStep(5)}
          >
            Überspringen
          </button>
        </div>
      </div>
    )
  }

  // Step 5: Done
  return (
    <div className="goal-onboarding adaptive">
      <ProgressDots current={step} total={totalSteps} />
      <h1>Alles eingerichtet!</h1>
      <p>Du kannst jederzeit in den Einstellungen Änderungen vornehmen.</p>
      <div className="goal-onboarding-actions">
        <button
          className="adaptive"
          data-material="inverted"
          data-container-contrast="max"
          data-interactive
          onClick={finishOnboarding}
        >
          Zum Dashboard
        </button>
      </div>
    </div>
  )
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="goal-onboarding-progress" aria-label={`Schritt ${current + 1} von ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`goal-onboarding-dot${i <= current ? ' goal-onboarding-dot--active' : ''}`}
        />
      ))}
    </div>
  )
}

export default GoalOnboarding
