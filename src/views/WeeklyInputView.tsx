import { useState, useEffect, useCallback } from 'react'
import { saveWeeklyMeasurement, getWeeklyMeasurement } from '../services/dataService'
import { validateCircumference, roundToOneDecimal, normalizeDecimal } from '../utils/validation'
import { getWeekStart } from '../utils/date'
import { CIRCUMFERENCE_MIN, CIRCUMFERENCE_MAX } from '../types'
import './WeeklyInputView.css'

interface FieldConfig {
  key: string
  label: string
  id: string
}

const FIELDS: FieldConfig[] = [
  { key: 'chest', label: 'Brust (cm)', id: 'weekly-chest' },
  { key: 'waist', label: 'Taille (cm)', id: 'weekly-waist' },
  { key: 'hip', label: 'Hüfte (cm)', id: 'weekly-hip' },
  { key: 'belly', label: 'Bauch (cm)', id: 'weekly-belly' },
  { key: 'upperArm', label: 'Oberarm (cm)', id: 'weekly-upperArm' },
  { key: 'thigh', label: 'Oberschenkel (cm)', id: 'weekly-thigh' },
]

function WeeklyInputView() {
  const [weekStart] = useState(() => getWeekStart(new Date()))
  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const f of FIELDS) initial[f.key] = ''
    return initial
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')

  const loadExistingData = useCallback(async (date: string) => {
    try {
      const existing = await getWeeklyMeasurement(date)
      if (existing) {
        const loaded: Record<string, string> = {}
        for (const f of FIELDS) {
          const val = existing[f.key as keyof typeof existing]
          loaded[f.key] = val != null ? String(val) : ''
        }
        setInputs(loaded)
      } else {
        const empty: Record<string, string> = {}
        for (const f of FIELDS) empty[f.key] = ''
        setInputs(empty)
      }
    } catch {
      const empty: Record<string, string> = {}
      for (const f of FIELDS) empty[f.key] = ''
      setInputs(empty)
    }
    setErrors({})
    setSuccessMessage('')
  }, [])

  useEffect(() => {
    loadExistingData(weekStart)
  }, [weekStart, loadExistingData])

  const validateFields = (): boolean => {
    let valid = true
    const newErrors: Record<string, string> = {}

    for (const f of FIELDS) {
      const raw = inputs[f.key].trim()
      if (raw !== '') {
        const value = Number(normalizeDecimal(raw))
        if (isNaN(value) || !validateCircumference(value)) {
          newErrors[f.key] = `${f.label.replace(' (cm)', '')} muss zwischen ${CIRCUMFERENCE_MIN} und ${CIRCUMFERENCE_MAX} cm liegen`
          valid = false
        }
      }
    }

    setErrors(newErrors)
    return valid
  }

  const handleInputChange = (key: string, value: string) => {
    setInputs(prev => ({ ...prev, [key]: value }))
    setErrors(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handleSave = async () => {
    if (!validateFields()) return

    try {
      const measurement: Record<string, unknown> = {
        date: weekStart,
        updatedAt: new Date().toISOString(),
      }
      for (const f of FIELDS) {
        const raw = inputs[f.key].trim()
        measurement[f.key] = raw !== '' ? roundToOneDecimal(Number(normalizeDecimal(raw))) : undefined
      }
      await saveWeeklyMeasurement(measurement as unknown as Parameters<typeof saveWeeklyMeasurement>[0])
      setSuccessMessage('Gespeichert!')
      setTimeout(() => setSuccessMessage(''), 2000)
    } catch {
      setSuccessMessage('Fehler beim Speichern')
    }
  }

  return (
    <div className="weekly-input adaptive">
      <h1>Wöchentliche Eingabe</h1>

      <h2>
        Woche ab {weekStart}
      </h2>

      {FIELDS.map(f => (
        <div className="weekly-input-field" key={f.key}>
          <label htmlFor={f.id}>{f.label}</label>
          <input
            id={f.id}
            className="adaptive"
            type="text"
            inputMode="decimal"
            placeholder={`${CIRCUMFERENCE_MIN}–${CIRCUMFERENCE_MAX}`}
            value={inputs[f.key]}
            onChange={e => handleInputChange(f.key, e.target.value)}
          />
          {errors[f.key] && (
            <span className="weekly-input-error" data-color="red">{errors[f.key]}</span>
          )}
        </div>
      ))}

      <button
        className="weekly-input-save adaptive"
        data-material="inverted"
        data-container-contrast="max"
        data-interactive
        onClick={handleSave}
      >
        Speichern
      </button>

      {successMessage && (
        <p className="weekly-input-success">{successMessage}</p>
      )}
    </div>
  )
}

export default WeeklyInputView
