import { useState } from 'react'
import { saveDailyMeasurement } from '../services/dataService'
import { createGoal } from '../services/goalService'
import { requestPermission } from '../services/notificationService'
import { subscribeToPush, updateReminderTime } from '../services/pushService'
import Dialog from '../components/core/Dialog'
import './GoalOnboarding.css'

const TOTAL = 4

function GoalOnboarding({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const [weight, setWeight] = useState('')
  const [targetWeight, setTargetWeight] = useState('')
  const [reminderTime, setReminderTime] = useState('20:00')
  const [weeklyEnabled, setWeeklyEnabled] = useState(false)
  const [error, setError] = useState('')
  const [savedWeight, setSavedWeight] = useState<number | null>(null)

  const finish = () => {
    localStorage.setItem('onboardingCompleted', 'true')
    onClose()
  }

  const back = () => {
    setError('')
    setStep(s => s - 1)
  }

  const handleWeight = async () => {
    setError('')
    const val = Number(weight.replace(',', '.'))
    if (!weight.trim() || isNaN(val) || val < 30 || val > 300) {
      setError('Zwischen 30 und 300 kg'); return
    }
    try {
      await saveDailyMeasurement({
        date: new Date().toISOString().slice(0, 10),
        weight: val, source: 'manual', updatedAt: new Date().toISOString(),
      })
      setSavedWeight(val)
      setStep(1)
    } catch { setError('Speichern fehlgeschlagen') }
  }

  const handleGoal = async () => {
    setError('')
    const val = Number(targetWeight.replace(',', '.'))
    if (!targetWeight.trim() || isNaN(val) || val < 30 || val > 300) {
      setError('Zwischen 30 und 300 kg'); return
    }
    if (savedWeight !== null && val === savedWeight) {
      setError('Muss sich vom Startgewicht unterscheiden'); return
    }
    try {
      await createGoal({ metricType: 'weight', startValue: savedWeight ?? val, targetValue: val })
      setStep(2)
    } catch { setError('Speichern fehlgeschlagen') }
  }

  const handleReminder = async () => {
    await updateReminderTime(reminderTime)
    const permission = await requestPermission()
    if (permission === 'granted') {
      await subscribeToPush()
    }
    setStep(3)
  }

  const handleWeekly = () => {
    localStorage.setItem('weeklyMeasurementEnabled', weeklyEnabled ? 'true' : 'false')
    finish()
  }

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <>
          <label htmlFor="ob-weight">Aktuelles Gewicht (kg)</label>
          <input id="ob-weight" className="ob-input" type="text" inputMode="decimal"
            placeholder="85.0" value={weight}
            onChange={e => { setWeight(e.target.value); setError('') }}
            aria-invalid={!!error} />
          {error && <p className="ob-error" role="alert">{error}</p>}
          <div className="core-dialog-actions">
            <button className="adaptive" data-material="inverted" data-container-contrast="max"
              data-interactive onClick={handleWeight}>Weiter</button>
            <button className="core-dialog-secondary" data-interactive onClick={() => setStep(1)}>Überspringen</button>
          </div>
        </>
      )
      case 1: return (
        <>
          <label htmlFor="ob-target">Zielgewicht (kg)</label>
          <input id="ob-target" className="ob-input" type="text" inputMode="decimal"
            placeholder="75.0" value={targetWeight}
            onChange={e => { setTargetWeight(e.target.value); setError('') }}
            aria-invalid={!!error} />
          {error && <p className="ob-error" role="alert">{error}</p>}
          <div className="core-dialog-actions">
            <button className="adaptive" data-material="inverted" data-container-contrast="max"
              data-interactive onClick={handleGoal}>Weiter</button>
            <div className="core-dialog-actions-row">
              <button className="core-dialog-secondary" data-interactive onClick={back}>Zurück</button>
              <button className="core-dialog-secondary" data-interactive onClick={() => setStep(2)}>Überspringen</button>
            </div>
          </div>
        </>
      )
      case 2: return (
        <>
          <label htmlFor="ob-time">Tägliche Erinnerung</label>
          <input id="ob-time" className="ob-input" type="time" value={reminderTime}
            onChange={e => setReminderTime(e.target.value)} />
          <div className="core-dialog-actions">
            <button className="adaptive" data-material="inverted" data-container-contrast="max"
              data-interactive onClick={handleReminder}>Aktivieren</button>
            <div className="core-dialog-actions-row">
              <button className="core-dialog-secondary" data-interactive onClick={back}>Zurück</button>
              <button className="core-dialog-secondary" data-interactive onClick={() => setStep(3)}>Überspringen</button>
            </div>
          </div>
        </>
      )
      case 3: return (
        <>
          <label className="ob-toggle">
            <input type="checkbox" checked={weeklyEnabled}
              onChange={e => setWeeklyEnabled(e.target.checked)} />
            Wöchentliche Umfangmessung
          </label>
          <div className="core-dialog-actions">
            <button className="adaptive" data-material="inverted" data-container-contrast="max"
              data-interactive onClick={handleWeekly}>Fertig</button>
            <button className="core-dialog-secondary" data-interactive onClick={back}>Zurück</button>
          </div>
        </>
      )
      default: return null
    }
  }

  return (
    <Dialog title={`Einrichtung (${step + 1}/${TOTAL})`} onClose={finish}>
      <img
        className="ob-hero"
        src={`${import.meta.env.BASE_URL}Running.png`}
        alt=""
      />
      {renderStep()}
    </Dialog>
  )
}

export default GoalOnboarding
