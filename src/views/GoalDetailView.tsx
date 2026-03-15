import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGoal, calculateProjection, updateGoalStatus, deleteGoal } from '../services/goalService'
import { getDailyMeasurements, getWeeklyMeasurements } from '../services/dataService'
import type { Goal, GoalProjection } from '../types'
import './GoalDetailView.css'

const METRIC_LABELS: Record<string, string> = {
  weight: 'Gewicht',
  bodyFat: 'Körperfett',
  circumference: 'Umfang',
}

const ZONE_LABELS: Record<string, string> = {
  chest: 'Brust',
  waist: 'Taille',
  hip: 'Hüfte',
  belly: 'Bauch',
  upperArm: 'Oberarm',
  thigh: 'Oberschenkel',
}

const TREND_MESSAGES: Record<string, string> = {
  ahead: 'Du liegst vor deinem Zielplan',
  'on-track': 'Du bist auf Kurs',
  behind: 'Etwas mehr Tempo nötig — du schaffst das',
  'insufficient-data': 'Noch nicht genug Daten für eine Prognose',
}

function getUnit(metricType: string): string {
  if (metricType === 'weight') return 'kg'
  if (metricType === 'bodyFat') return '%'
  return 'cm'
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function calculateDurationDays(from: string, to: string): number {
  const start = new Date(from)
  const end = new Date(to)
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDuration(days: number): string {
  if (days < 7) return `${days} Tag${days !== 1 ? 'e' : ''}`
  const weeks = Math.floor(days / 7)
  const remainingDays = days % 7
  if (remainingDays === 0) return `${weeks} Woche${weeks !== 1 ? 'n' : ''}`
  return `${weeks} Woche${weeks !== 1 ? 'n' : ''} und ${remainingDays} Tag${remainingDays !== 1 ? 'e' : ''}`
}

function daysRemaining(deadline: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const dl = new Date(deadline + 'T00:00:00')
  return Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function GoalDetailView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [goal, setGoal] = useState<Goal | null>(null)
  const [projection, setProjection] = useState<GoalProjection | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const loadGoal = useCallback(async () => {
    if (!id) {
      setNotFound(true)
      setLoading(false)
      return
    }

    try {
      const g = await getGoal(id)
      if (!g) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setGoal(g)

      // Load measurements for projection
      const to = new Date().toISOString().slice(0, 10)
      const fromDate = new Date()
      fromDate.setFullYear(fromDate.getFullYear() - 2)
      const from = fromDate.toISOString().slice(0, 10)

      let measurements: unknown[]
      if (g.metricType === 'circumference') {
        measurements = await getWeeklyMeasurements(from, to)
      } else {
        measurements = await getDailyMeasurements(from, to)
      }

      const proj = calculateProjection(g, measurements as never)
      setProjection(proj)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadGoal()
  }, [loadGoal])

  const handleArchive = async () => {
    if (!id) return
    await updateGoalStatus(id, 'archived')
    navigate(-1)
  }

  const handleDelete = async () => {
    if (!id) return
    await deleteGoal(id)
    navigate(-1)
  }

  if (loading) {
    return <div className="goal-detail-loading adaptive">Laden…</div>
  }

  if (notFound || !goal) {
    return <div className="goal-detail-not-found adaptive">Ziel nicht gefunden.</div>
  }

  const unit = getUnit(goal.metricType)
  const isReached = goal.status === 'reached'

  return (
    <div className="goal-detail adaptive">
      <button
        className="goal-detail-back adaptive"
        data-interactive
        onClick={() => navigate(-1)}
      >
        ← Zurück
      </button>

      <h1>{METRIC_LABELS[goal.metricType]}{goal.zone ? ` — ${ZONE_LABELS[goal.zone]}` : ''}</h1>

      {/* Reached goal congratulation */}
      {isReached && (
        <div className="goal-detail-reached adaptive">
          <p className="goal-detail-reached-message">🎉 Glückwunsch! Ziel erreicht!</p>
          {goal.reachedAt && (
            <p className="goal-detail-reached-duration">
              Dauer: {formatDuration(calculateDurationDays(goal.createdAt, goal.reachedAt))}
            </p>
          )}
        </div>
      )}

      {/* Values section */}
      <div className="goal-detail-section adaptive">
        <div className="goal-detail-values">
          <div className="goal-detail-row">
            <span className="goal-detail-row-label">Startwert</span>
            <span className="goal-detail-row-value">{goal.startValue.toFixed(1)} {unit}</span>
          </div>
          {projection && (
            <div className="goal-detail-row">
              <span className="goal-detail-row-label">Aktueller Wert</span>
              <span className="goal-detail-row-value">{projection.currentValue.toFixed(1)} {unit}</span>
            </div>
          )}
          <div className="goal-detail-row">
            <span className="goal-detail-row-label">Zielwert</span>
            <span className="goal-detail-row-value">{goal.targetValue.toFixed(1)} {unit}</span>
          </div>
          {projection && (
            <div className="goal-detail-row">
              <span className="goal-detail-row-label">Verbleibende Distanz</span>
              <span className="goal-detail-row-value">{projection.remainingDistance.toFixed(1)} {unit}</span>
            </div>
          )}
          {goal.deadline && (
            <div className="goal-detail-row">
              <span className="goal-detail-row-label">Deadline</span>
              <span className="goal-detail-row-value">{formatDate(goal.deadline)}</span>
            </div>
          )}
          {goal.deadline && (
            <div className="goal-detail-row">
              <span className="goal-detail-row-label">Verbleibende Zeit</span>
              <span className="goal-detail-row-value">
                {daysRemaining(goal.deadline) > 0
                  ? `${daysRemaining(goal.deadline)} Tage`
                  : 'Abgelaufen'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Projection section */}
      {projection && (
        <div className="goal-detail-section adaptive">
          <h2>Prognose</h2>
          <div className="goal-detail-projection">
            {projection.requiredWeeklyTempo !== null && (
              <div className="goal-detail-row">
                <span className="goal-detail-row-label">Benötigtes Wochentempo</span>
                <span className="goal-detail-row-value">{projection.requiredWeeklyTempo.toFixed(2)} {unit}/Woche</span>
              </div>
            )}
            {projection.currentWeeklyRate !== null && (
              <div className="goal-detail-row">
                <span className="goal-detail-row-label">Aktuelles Wochentempo</span>
                <span className="goal-detail-row-value">{Math.abs(projection.currentWeeklyRate).toFixed(2)} {unit}/Woche</span>
              </div>
            )}
            {projection.projectedDate && (
              <div className="goal-detail-row">
                <span className="goal-detail-row-label">Voraussichtliches Erreichen</span>
                <span className="goal-detail-row-value">{formatDate(projection.projectedDate)}</span>
              </div>
            )}
            <div className="goal-detail-trend" data-trend={projection.trendFeedback}>
              {TREND_MESSAGES[projection.trendFeedback]}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="goal-detail-actions">
        <button
          className="adaptive"
          data-material="semi-transparent"
          data-interactive
          onClick={handleArchive}
        >
          Archivieren
        </button>
        <button
          className="adaptive"
          data-material="semi-transparent"
          data-interactive
          onClick={handleDelete}
        >
          Löschen
        </button>
      </div>
    </div>
  )
}

export default GoalDetailView
