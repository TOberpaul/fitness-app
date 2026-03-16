import { useState, useEffect, useCallback } from 'react'
import { saveDailyMeasurement, getDailyMeasurement, getAllData } from '../services/dataService'
import { validateWeight, validateBodyFat, roundToOneDecimal, normalizeDecimal } from '../utils/validation'
import { formatDate } from '../utils/date'
import { WEIGHT_MIN, WEIGHT_MAX, BODY_FAT_MIN, BODY_FAT_MAX } from '../types'
import { updateDailyStreak, evaluateMilestones, getEarnedMilestones, getStreaks, detectNonScaleVictories } from '../services/gamificationService'
import { evaluateGoals, getAllGoals } from '../services/goalService'
import Button from '../components/core/Button'
import Input from '../components/core/Input'
import './DailyInputView.css'

function DailyInputView() {
  const [date, setDate] = useState(() => formatDate(new Date()))
  const [weightInput, setWeightInput] = useState('')
  const [bodyFatInput, setBodyFatInput] = useState('')
  const [weightError, setWeightError] = useState('')
  const [bodyFatError, setBodyFatError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const loadExistingData = useCallback(async (selectedDate: string) => {
    try {
      const existing = await getDailyMeasurement(selectedDate)
      if (existing) {
        setWeightInput(existing.weight != null ? String(existing.weight) : '')
        setBodyFatInput(existing.bodyFat != null ? String(existing.bodyFat) : '')
      } else {
        setWeightInput('')
        setBodyFatInput('')
      }
    } catch {
      setWeightInput('')
      setBodyFatInput('')
    }
    setWeightError('')
    setBodyFatError('')
    setSuccessMessage('')
  }, [])

  useEffect(() => {
    loadExistingData(date)
  }, [date, loadExistingData])

  const validateFields = (): boolean => {
    let valid = true

    if (weightInput.trim() !== '') {
      const value = Number(normalizeDecimal(weightInput))
      if (isNaN(value) || !validateWeight(value)) {
        setWeightError(`Gewicht muss zwischen ${WEIGHT_MIN} und ${WEIGHT_MAX} kg liegen`)
        valid = false
      } else {
        setWeightError('')
      }
    } else {
      setWeightError('')
    }

    if (bodyFatInput.trim() !== '') {
      const value = Number(normalizeDecimal(bodyFatInput))
      if (isNaN(value) || !validateBodyFat(value)) {
        setBodyFatError(`Körperfett muss zwischen ${BODY_FAT_MIN} und ${BODY_FAT_MAX}% liegen`)
        valid = false
      } else {
        setBodyFatError('')
      }
    } else {
      setBodyFatError('')
    }

    return valid
  }

  const handleSave = async () => {
    if (!validateFields()) return

    try {
      await saveDailyMeasurement({
        date,
        weight: weightInput.trim() !== '' ? roundToOneDecimal(Number(normalizeDecimal(weightInput))) : undefined,
        bodyFat: bodyFatInput.trim() !== '' ? roundToOneDecimal(Number(normalizeDecimal(bodyFatInput))) : undefined,
        source: 'manual',
        updatedAt: new Date().toISOString(),
      })
      setSuccessMessage('Gespeichert!')
      setTimeout(() => setSuccessMessage(''), 2000)
      window.dispatchEvent(new CustomEvent('data-updated'))

      // Fire-and-forget gamification hooks
      try {
        await updateDailyStreak(date)
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

  return (
    <div className="daily-input adaptive">
      <h1>Tägliche Eingabe</h1>

      <div className="daily-input-body">
        <Input
          id="daily-date"
          label="Datum"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <Input
          id="daily-weight"
          label="Gewicht (kg)"
          type="text"
          inputMode="decimal"
          placeholder={`${WEIGHT_MIN}–${WEIGHT_MAX}`}
          value={weightInput}
          error={weightError || undefined}
          onChange={(e) => {
            setWeightInput(e.target.value)
            setWeightError('')
          }}
        />

        <Input
          id="daily-bodyfat"
          label="Körperfett (%)"
          type="text"
          inputMode="decimal"
          placeholder={`${BODY_FAT_MIN}–${BODY_FAT_MAX}`}
          value={bodyFatInput}
          error={bodyFatError || undefined}
          onChange={(e) => {
            setBodyFatInput(e.target.value)
            setBodyFatError('')
          }}
        />
      </div>

      <Button
        data-material="inverted"
        data-container-contrast="max"
        onClick={handleSave}
      >
        Speichern
      </Button>

      {successMessage && (
        <p className="daily-input-success">{successMessage}</p>
      )}
    </div>
  )
}

export default DailyInputView
