import { useState, useEffect, useCallback } from 'react'
import { createGoal } from '../services/goalService'
import { getDailyMeasurements, getWeeklyMeasurements } from '../services/dataService'
import { normalizeDecimal } from '../utils/validation'
import type { GoalMetricType, CircumferenceZone } from '../types'
import Dialog from '../components/core/Dialog'
import './GoalCreateView.css'

const METRIC_LABELS: Record<GoalMetricType, string> = {
  weight: 'Gewicht',
  bodyFat: 'Körperfett',
  circumference: 'Umfang',
}

const ZONE_LABELS: Record<CircumferenceZone, string> = {
  chest: 'Brust',
  waist: 'Taille',
  hip: 'Hüfte',
  belly: 'Bauch',
  upperArm: 'Oberarm',
  thigh: 'Oberschenkel',
}

const ZONES: CircumferenceZone[] = ['chest', 'waist', 'hip', 'belly', 'upperArm', 'thigh']
const METRIC_TYPES: GoalMetricType[] = ['weight', 'bodyFat', 'circumference']

function GoalCreateView({ open = true, onClose, onCreated }: { open?: boolean; onClose: () => void; onCreated: () => void }) {
  const [metricType, setMetricType] = useState<GoalMetricType>('weight')
  const [zone, setZone] = useState<CircumferenceZone>('waist')
  const [startValue, setStartValue] = useState('')
  const [startValueAuto, setStartValueAuto] = useState(false)
  const [targetValue, setTargetValue] = useState('')
  const [deadline, setDeadline] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadStartValue = useCallback(async (type: GoalMetricType, selectedZone: CircumferenceZone) => {
    try {
      const to = new Date().toISOString().slice(0, 10)
      const fromDate = new Date()
      fromDate.setFullYear(fromDate.getFullYear() - 2)
      const from = fromDate.toISOString().slice(0, 10)

      if (type === 'circumference') {
        const measurements = await getWeeklyMeasurements(from, to)
        const sorted = [...measurements].sort((a, b) => b.date.localeCompare(a.date))
        for (const m of sorted) {
          const val = m[selectedZone]
          if (val != null) {
            setStartValue(String(val))
            setStartValueAuto(true)
            return
          }
        }
      } else {
        const measurements = await getDailyMeasurements(from, to)
        const sorted = [...measurements].sort((a, b) => b.date.localeCompare(a.date))
        const field = type === 'weight' ? 'weight' : 'bodyFat'
        for (const m of sorted) {
          const val = m[field]
          if (val != null) {
            setStartValue(String(val))
            setStartValueAuto(true)
            return
          }
        }
      }
      // No data found — allow manual entry
      setStartValue('')
      setStartValueAuto(false)
    } catch {
      setStartValue('')
      setStartValueAuto(false)
    }
  }, [])

  useEffect(() => {
    loadStartValue(metricType, zone)
  }, [metricType, zone, loadStartValue])

  const handleSubmit = async () => {
    setError('')

    const start = Number(normalizeDecimal(startValue))
    const target = Number(normalizeDecimal(targetValue))

    if (isNaN(start) || startValue.trim() === '') {
      setError('Bitte einen gültigen Startwert eingeben.')
      return
    }

    if (isNaN(target) || targetValue.trim() === '') {
      setError('Bitte einen gültigen Zielwert eingeben.')
      return
    }

    if (target === start) {
      setError('Zielwert darf nicht dem Startwert entsprechen.')
      return
    }

    setSubmitting(true)
    try {
      await createGoal({
        metricType,
        ...(metricType === 'circumference' ? { zone } : {}),
        startValue: start,
        targetValue: target,
        ...(deadline ? { deadline } : {}),
      })
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen des Ziels.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog title="Neues Ziel erstellen" onClose={onClose} open={open}>
      <div className="goal-create-field">
        <label>Metrik-Typ</label>
        <div className="goal-create-metric-options">
          {METRIC_TYPES.map((type) => (
            <label key={type}>
              <input
                className="adaptive"
                type="radio"
                name="metricType"
                value={type}
                checked={metricType === type}
                onChange={() => setMetricType(type)}
              />
              {METRIC_LABELS[type]}
            </label>
          ))}
        </div>
      </div>

      {metricType === 'circumference' && (
        <div className="goal-create-field">
          <label htmlFor="goal-zone">Zone</label>
          <select
            id="goal-zone"
            className="adaptive"
            value={zone}
            onChange={(e) => setZone(e.target.value as CircumferenceZone)}
          >
            {ZONES.map((z) => (
              <option key={z} value={z}>{ZONE_LABELS[z]}</option>
            ))}
          </select>
        </div>
      )}

      <div className="goal-create-field">
        <label htmlFor="goal-start">Startwert</label>
        {startValueAuto ? (
          <p className="goal-create-start-display">
            {startValue} {metricType === 'weight' ? 'kg' : metricType === 'bodyFat' ? '%' : 'cm'} (letzte Messung)
          </p>
        ) : (
          <input
            id="goal-start"
            className="adaptive"
            type="text"
            inputMode="decimal"
            placeholder="Startwert eingeben"
            value={startValue}
            onChange={(e) => setStartValue(e.target.value)}
          />
        )}
      </div>

      <div className="goal-create-field">
        <label htmlFor="goal-target">Zielwert</label>
        <input
          id="goal-target"
          className="adaptive"
          type="text"
          inputMode="decimal"
          placeholder="Zielwert eingeben"
          value={targetValue}
          onChange={(e) => {
            setTargetValue(e.target.value)
            setError('')
          }}
        />
      </div>

      <div className="goal-create-field">
        <label htmlFor="goal-deadline">Deadline (optional)</label>
        <input
          id="goal-deadline"
          className="adaptive"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
      </div>

      {error && (
        <p className="goal-create-error">{error}</p>
      )}

      <button
        className="goal-create-submit adaptive"
        data-material="inverted"
        data-container-contrast="max"
        data-interactive
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? 'Wird erstellt…' : 'Ziel erstellen'}
      </button>
    </Dialog>
  )
}

export default GoalCreateView
