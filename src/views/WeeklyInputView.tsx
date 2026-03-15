import { useState, useEffect, useCallback } from 'react'
import { saveWeeklyMeasurement, getWeeklyMeasurement, getAllData } from '../services/dataService'
import { validateCircumference, roundToOneDecimal, normalizeDecimal } from '../utils/validation'
import { getWeekStart } from '../utils/date'
import { CIRCUMFERENCE_MIN, CIRCUMFERENCE_MAX } from '../types'
import type { CircumferenceZone, StepFlowEntry, WeeklyMeasurement } from '../types'
import StepFlowScreen from '../components/StepFlowScreen'
import StepFlowSummary from '../components/StepFlowSummary'
import { updateWeeklyStreak, evaluateMilestones, getEarnedMilestones, getStreaks, detectNonScaleVictories } from '../services/gamificationService'
import { evaluateGoals, getAllGoals } from '../services/goalService'
import './WeeklyInputView.css'

/** Zone configuration in the required order */
const ZONE_CONFIG: { zone: CircumferenceZone; label: string; hint: string }[] = [
  { zone: 'chest', label: 'Brust', hint: 'Miss den Umfang auf Höhe der Brustwarzen' },
  { zone: 'waist', label: 'Taille', hint: 'Miss den schmalsten Punkt deines Oberkörpers' },
  { zone: 'belly', label: 'Bauch', hint: 'Miss auf Höhe des Bauchnabels' },
  { zone: 'hip', label: 'Hüfte', hint: 'Miss den breitesten Punkt deiner Hüfte' },
  { zone: 'upperArm', label: 'Oberarm', hint: 'Miss den dicksten Punkt deines Oberarms' },
  { zone: 'thigh', label: 'Oberschenkel', hint: 'Miss den dicksten Punkt deines Oberschenkels' },
]

const TOTAL_STEPS = ZONE_CONFIG.length

/** Get the previous week's Monday date string */
function getPreviousWeekStart(currentWeekStart: string): string {
  const d = new Date(currentWeekStart)
  d.setDate(d.getDate() - 7)
  return getWeekStart(d)
}

function WeeklyInputView() {
  const [weekStart] = useState(() => getWeekStart(new Date()))
  const [step, setStep] = useState(0) // 0=Intro, 1-6=Zones, 7=Summary
  const [entries, setEntries] = useState<StepFlowEntry[]>(() =>
    ZONE_CONFIG.map(({ zone, label }) => ({
      zone,
      label,
      value: null,
      skipped: false,
    }))
  )
  const [currentInput, setCurrentInput] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [previousWeek, setPreviousWeek] = useState<WeeklyMeasurement | undefined>(undefined)
  const [successMessage, setSuccessMessage] = useState('')

  // Load previous week data for comparison in summary
  const loadPreviousWeek = useCallback(async () => {
    try {
      const prevStart = getPreviousWeekStart(weekStart)
      const prev = await getWeeklyMeasurement(prevStart)
      setPreviousWeek(prev)
    } catch {
      setPreviousWeek(undefined)
    }
  }, [weekStart])

  // Load existing data for current week (pre-fill if already entered)
  const loadExistingData = useCallback(async () => {
    try {
      const existing = await getWeeklyMeasurement(weekStart)
      if (existing) {
        setEntries(
          ZONE_CONFIG.map(({ zone, label }) => {
            const val = existing[zone]
            return {
              zone,
              label,
              value: val != null ? val : null,
              skipped: val == null,
            }
          })
        )
      }
    } catch {
      // Keep default empty entries
    }
  }, [weekStart])

  useEffect(() => {
    loadPreviousWeek()
    loadExistingData()
  }, [loadPreviousWeek, loadExistingData])

  // When entering a zone step, sync currentInput from entries
  useEffect(() => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      const entry = entries[step - 1]
      setCurrentInput(entry.value != null ? String(entry.value) : '')
      setError(undefined)
    }
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleNext = () => {
    const raw = currentInput.trim()
    if (raw === '') {
      setError(`Bitte einen Wert eingeben oder überspringen`)
      return
    }
    const normalized = normalizeDecimal(raw)
    const value = Number(normalized)
    if (isNaN(value) || !validateCircumference(value)) {
      setError(`Wert muss zwischen ${CIRCUMFERENCE_MIN} und ${CIRCUMFERENCE_MAX} cm liegen`)
      return
    }
    const rounded = roundToOneDecimal(value)
    setEntries(prev => {
      const next = [...prev]
      next[step - 1] = { ...next[step - 1], value: rounded, skipped: false }
      return next
    })
    setCurrentInput('')
    setError(undefined)
    setStep(step + 1)
  }

  const handleSkip = () => {
    setEntries(prev => {
      const next = [...prev]
      next[step - 1] = { ...next[step - 1], value: null, skipped: true }
      return next
    })
    setCurrentInput('')
    setError(undefined)
    setStep(step + 1)
  }

  const handleConfirm = async () => {
    try {
      const measurement: WeeklyMeasurement = {
        date: weekStart,
        updatedAt: new Date().toISOString(),
      }
      for (const entry of entries) {
        if (!entry.skipped && entry.value !== null) {
          measurement[entry.zone] = entry.value
        }
      }
      await saveWeeklyMeasurement(measurement)
      setSuccessMessage('Gespeichert!')
      setTimeout(() => setSuccessMessage(''), 3000)

      // Fire-and-forget gamification hooks
      try {
        await updateWeeklyStreak(weekStart)
        const allData = await getAllData()
        await evaluateGoals(allData.dailyMeasurements, allData.weeklyMeasurements)
        const [goals, streaks, earned] = await Promise.all([
          getAllGoals(), getStreaks(), getEarnedMilestones()
        ])
        await evaluateMilestones({
          goals, streaks, dailyMeasurements: allData.dailyMeasurements, earnedMilestones: earned
        })
        detectNonScaleVictories(allData.dailyMeasurements, allData.weeklyMeasurements)
      } catch {
        // Gamification errors should not block the save flow
      }
    } catch {
      setSuccessMessage('Fehler beim Speichern')
    }
  }

  const handleBack = () => {
    setStep(1)
  }

  // Step 0: Intro screen
  if (step === 0) {
    return (
      <div className="weekly-input adaptive">
        <h1>Wöchentliche Umfangmessung</h1>
        <p className="weekly-input-intro-text">
          Woche ab {weekStart}
        </p>
        <p className="weekly-input-intro-text">
          Nimm dein Maßband und miss die folgenden 6 Körperstellen.
          Du kannst jede Messung auch überspringen.
        </p>
        <button
          className="weekly-input-start adaptive"
          data-material="inverted"
          data-container-contrast="max"
          data-interactive
          onClick={() => setStep(1)}
        >
          Weiter
        </button>
        {successMessage && (
          <p className="weekly-input-success">{successMessage}</p>
        )}
      </div>
    )
  }

  // Step 7: Summary screen
  if (step === TOTAL_STEPS + 1) {
    return (
      <div className="weekly-input adaptive">
        <StepFlowSummary
          entries={entries}
          previousWeek={previousWeek}
          onConfirm={handleConfirm}
          onBack={handleBack}
        />
        {successMessage && (
          <p className="weekly-input-success">{successMessage}</p>
        )}
      </div>
    )
  }

  // Steps 1-6: Zone input screens
  const zoneIndex = step - 1
  const config = ZONE_CONFIG[zoneIndex]

  return (
    <div className="weekly-input adaptive">
      <StepFlowScreen
        zone={config.zone}
        label={config.label}
        hint={config.hint}
        value={currentInput}
        onChange={(val) => {
          setCurrentInput(val)
          setError(undefined)
        }}
        onNext={handleNext}
        onSkip={handleSkip}
        error={error}
        stepIndex={step}
        totalSteps={TOTAL_STEPS}
      />
    </div>
  )
}

export default WeeklyInputView
