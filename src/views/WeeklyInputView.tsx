import { useState, useEffect, useCallback } from 'react'
import { saveWeeklyMeasurement, getWeeklyMeasurement, getAllData } from '../services/dataService'
import { validateCircumference, roundToOneDecimal, normalizeDecimal } from '../utils/validation'
import { getWeekStart } from '../utils/date'
import { CIRCUMFERENCE_MIN, CIRCUMFERENCE_MAX } from '../types'
import type { CircumferenceZone, StepFlowEntry, WeeklyMeasurement } from '../types'
import StepFlowScreen from '../components/StepFlowScreen'
import StepFlowSummary from '../components/StepFlowSummary'
import Dialog from '../components/core/Dialog'
import { updateWeeklyStreak, evaluateMilestones, getEarnedMilestones, getStreaks, detectNonScaleVictories } from '../services/gamificationService'
import { evaluateGoals, getAllGoals } from '../services/goalService'
import './WeeklyInputView.css'

/** Zone configuration in the required order */
const ZONE_CONFIG: { zone: CircumferenceZone; label: string; hint: string; illustration: string }[] = [
  { zone: 'chest', label: 'Brust', hint: 'Miss den Umfang auf Höhe der Brustwarzen', illustration: `${import.meta.env.BASE_URL}Measurement-Breast.svg` },
  { zone: 'waist', label: 'Taille', hint: 'Miss den schmalsten Punkt deines Oberkörpers', illustration: `${import.meta.env.BASE_URL}Measurement-Taille.svg` },
  { zone: 'belly', label: 'Bauch', hint: 'Miss auf Höhe des Bauchnabels', illustration: `${import.meta.env.BASE_URL}Measurement-belly.svg` },
  { zone: 'hip', label: 'Hüfte', hint: 'Miss den breitesten Punkt deiner Hüfte', illustration: `${import.meta.env.BASE_URL}Measurement-Hip.svg` },
  { zone: 'upperArm', label: 'Oberarm', hint: 'Miss den dicksten Punkt deines Oberarms', illustration: `${import.meta.env.BASE_URL}Measurement-Arm.svg` },
  { zone: 'thigh', label: 'Oberschenkel', hint: 'Miss den dicksten Punkt deines Oberschenkels', illustration: `${import.meta.env.BASE_URL}Measurement-Leg.svg` },
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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [step, setStep] = useState(1) // 1-6=Zones, 7=Summary
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

  const loadPreviousWeek = useCallback(async () => {
    try {
      const prevStart = getPreviousWeekStart(weekStart)
      const prev = await getWeeklyMeasurement(prevStart)
      setPreviousWeek(prev)
    } catch {
      setPreviousWeek(undefined)
    }
  }, [weekStart])

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

  // Sync currentInput when step changes
  useEffect(() => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      const entry = entries[step - 1]
      setCurrentInput(entry.value != null ? String(entry.value) : '')
      setError(undefined)
    }
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  const openDialog = () => {
    setStep(1)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
  }

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
      setDialogOpen(false)
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

  const dialogTitle = step <= TOTAL_STEPS
    ? `Messung (${step}/${TOTAL_STEPS})`
    : 'Zusammenfassung'

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
        onClick={openDialog}
      >
        Messung starten
      </button>
      {successMessage && (
        <p className="weekly-input-success">{successMessage}</p>
      )}

      {dialogOpen && (
        <Dialog title={dialogTitle} onClose={closeDialog}>
          {step <= TOTAL_STEPS ? (
            <StepFlowScreen
              zone={ZONE_CONFIG[step - 1].zone}
              label={ZONE_CONFIG[step - 1].label}
              hint={ZONE_CONFIG[step - 1].hint}
              illustration={ZONE_CONFIG[step - 1].illustration}
              value={currentInput}
              onChange={(val) => {
                setCurrentInput(val)
                setError(undefined)
              }}
              onNext={handleNext}
              onSkip={handleSkip}
              onCancel={closeDialog}
              onBack={() => setStep(s => s - 1)}
              error={error}
              stepIndex={step}
              totalSteps={TOTAL_STEPS}
            />
          ) : (
            <StepFlowSummary
              entries={entries}
              previousWeek={previousWeek}
              onConfirm={handleConfirm}
              onBack={handleBack}
            />
          )}
        </Dialog>
      )}
    </div>
  )
}

export default WeeklyInputView
