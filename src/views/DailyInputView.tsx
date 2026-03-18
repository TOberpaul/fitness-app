import { useState, useEffect, useCallback } from 'react'
import { saveDailyMeasurement, getDailyMeasurement, getAllData } from '../services/dataService'
import { validateWeight, validateBodyFat, roundToOneDecimal, normalizeDecimal } from '../utils/validation'
import { formatDate } from '../utils/date'
import { WEIGHT_MIN, WEIGHT_MAX, BODY_FAT_MIN, BODY_FAT_MAX } from '../types'
import { updateDailyStreak, evaluateMilestones, getEarnedMilestones, getStreaks, detectNonScaleVictories } from '../services/gamificationService'
import { evaluateGoals, getAllGoals } from '../services/goalService'
import Button from '../components/core/Button'
import Input from '../components/core/Input'
import Dialog from '../components/core/Dialog'

interface DailyInputViewProps {
  open: boolean
  onClose: () => void
  mode?: 'weight' | 'bodyFat' | 'both'
}

function DailyInputView({ open, onClose, mode = 'both' }: DailyInputViewProps) {
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
    if (open) loadExistingData(date)
  }, [date, open, loadExistingData])

  const validateFields = (): boolean => {
    let valid = true
    if ((mode === 'weight' || mode === 'both') && weightInput.trim() !== '') {
      const value = Number(normalizeDecimal(weightInput))
      if (isNaN(value) || !validateWeight(value)) {
        setWeightError(`Gewicht muss zwischen ${WEIGHT_MIN} und ${WEIGHT_MAX} kg liegen`)
        valid = false
      } else { setWeightError('') }
    } else { setWeightError('') }

    if ((mode === 'bodyFat' || mode === 'both') && bodyFatInput.trim() !== '') {
      const value = Number(normalizeDecimal(bodyFatInput))
      if (isNaN(value) || !validateBodyFat(value)) {
        setBodyFatError(`Körperfett muss zwischen ${BODY_FAT_MIN} und ${BODY_FAT_MAX}% liegen`)
        valid = false
      } else { setBodyFatError('') }
    } else { setBodyFatError('') }
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
      setTimeout(() => { setSuccessMessage(''); onClose() }, 1000)
      window.dispatchEvent(new CustomEvent('data-updated'))

      try {
        await updateDailyStreak(date)
        const allData = await getAllData()
        await evaluateGoals(allData.dailyMeasurements, allData.weeklyMeasurements)
        const [goals, streaks, earned] = await Promise.all([
          getAllGoals(), getStreaks(), getEarnedMilestones()
        ])
        await evaluateMilestones({
          goals, streaks, dailyMeasurements: allData.dailyMeasurements, weeklyMeasurements: allData.weeklyMeasurements, earnedMilestones: earned
        })
        detectNonScaleVictories(allData.dailyMeasurements, allData.weeklyMeasurements)
      } catch { /* gamification errors non-blocking */ }
    } catch {
      setSuccessMessage('Fehler beim Speichern')
    }
  }

  const dialogTitle = mode === 'weight' ? 'Gewicht' : mode === 'bodyFat' ? 'Körperfett' : 'Gewicht & Körperfett'

  return (
    <Dialog title={dialogTitle} open={open} onClose={onClose}>
      <Input
        id="daily-date"
        label="Datum"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      {(mode === 'weight' || mode === 'both') && (
        <Input
          id="daily-weight"
          label="Gewicht (kg)"
          type="text"
          inputMode="decimal"
          placeholder={`${WEIGHT_MIN}–${WEIGHT_MAX}`}
          value={weightInput}
          error={weightError || undefined}
          onChange={(e) => { setWeightInput(e.target.value); setWeightError('') }}
        />
      )}
      {(mode === 'bodyFat' || mode === 'both') && (
        <Input
          id="daily-bodyfat"
          label="Körperfett (%)"
          type="text"
          inputMode="decimal"
          placeholder={`${BODY_FAT_MIN}–${BODY_FAT_MAX}`}
          value={bodyFatInput}
          error={bodyFatError || undefined}
          onChange={(e) => { setBodyFatInput(e.target.value); setBodyFatError('') }}
        />
      )}
      {successMessage && <p data-emphasis="weak" style={{ textAlign: 'center' }}>{successMessage}</p>}
      <div className="core-dialog-actions">
        <Button variant="primary" onClick={handleSave}>Speichern</Button>
      </div>
    </Dialog>
  )
}

export default DailyInputView
