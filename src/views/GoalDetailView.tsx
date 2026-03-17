import { useState, useEffect, useCallback } from 'react'
import { Pencil, Trash2, CircleCheck, TriangleAlert, HelpCircle, ShieldAlert } from 'lucide-react'
import { getGoal, calculateProjection, updateGoal, deleteGoal } from '../services/goalService'
import { getDailyMeasurements, getWeeklyMeasurements } from '../services/dataService'
import { normalizeDecimal } from '../utils/validation'
import type { Goal, GoalProjection } from '../types'
import Button from '../components/core/Button'
import Dialog from '../components/core/Dialog'
import Input from '../components/core/Input'
import Notification from '../components/core/Notification'
import Section from '../components/core/Section'
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
  unrealistic: 'Das benötigte Tempo ist ungesund — passe Zielwert oder Deadline an',
  'insufficient-data': 'Noch nicht genug Daten für eine Prognose',
}

const HEALTHY_LIMITS: Record<string, number> = {
  weight: 2.0,
  bodyFat: 0.5,
  circumference: 2.0,
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

interface GoalDetailViewProps {
  goalId: string
  open: boolean
  onClose: () => void
  onChanged: () => void
}

function GoalDetailView({ goalId, open, onClose, onChanged }: GoalDetailViewProps) {
  const [goal, setGoal] = useState<Goal | null>(null)
  const [projection, setProjection] = useState<GoalProjection | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editTarget, setEditTarget] = useState('')
  const [editDeadline, setEditDeadline] = useState('')
  const [editError, setEditError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const loadGoal = useCallback(async () => {
    if (!goalId) return
    setLoading(true)
    try {
      const g = await getGoal(goalId)
      if (!g) { setLoading(false); return }
      setGoal(g)

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
      setProjection(calculateProjection(g, measurements as never))
    } catch { /* ignore */ }
    setLoading(false)
  }, [goalId])

  useEffect(() => {
    if (open) loadGoal()
  }, [open, loadGoal])

  const handleDelete = async () => {
    await deleteGoal(goalId)
    onChanged()
    onClose()
  }

  const startEditing = () => {
    if (!goal) return
    setEditTarget(String(goal.targetValue))
    setEditDeadline(goal.deadline || '')
    setEditError('')
    setEditing(true)
  }

  const handleSave = async () => {
    if (!goal) return
    const target = Number(normalizeDecimal(editTarget))
    if (isNaN(target) || editTarget.trim() === '') {
      setEditError('Bitte einen gültigen Zielwert eingeben.')
      return
    }
    if (target === goal.startValue) {
      setEditError('Zielwert darf nicht dem Startwert entsprechen.')
      return
    }
    await updateGoal(goalId, { targetValue: target, deadline: editDeadline })
    setEditing(false)
    onChanged()
    loadGoal()
  }

  if (!open) return null

  const title = goal
    ? `${METRIC_LABELS[goal.metricType]}${goal.zone ? ` — ${ZONE_LABELS[goal.zone]}` : ''}`
    : 'Ziel'

  return (
    <>
      <Dialog title={title} open={open} onClose={onClose}>
        {loading ? (
          <p>Laden…</p>
        ) : !goal ? (
          <p>Ziel nicht gefunden.</p>
        ) : (
          <div className="goal-detail">
            {goal.status === 'reached' && (
              <div className="goal-detail-reached">
                <p className="goal-detail-reached-message">Glückwunsch! Ziel erreicht!</p>
                {goal.reachedAt && (
                  <p className="goal-detail-reached-duration">
                    Dauer: {formatDuration(calculateDurationDays(goal.createdAt, goal.reachedAt))}
                  </p>
                )}
              </div>
            )}

            <Section>
              <div className="goal-detail-values">
                <div className="goal-detail-row">
                  <span className="goal-detail-row-label">Startwert</span>
                  <span className="goal-detail-row-value">{goal.startValue.toFixed(1)} {getUnit(goal.metricType)}</span>
                </div>
                {projection && (
                  <div className="goal-detail-row">
                    <span className="goal-detail-row-label">Aktueller Wert</span>
                    <span className="goal-detail-row-value">{projection.currentValue.toFixed(1)} {getUnit(goal.metricType)}</span>
                  </div>
                )}
                <div className="goal-detail-row">
                  <span className="goal-detail-row-label">Zielwert</span>
                  <span className="goal-detail-row-value">{goal.targetValue.toFixed(1)} {getUnit(goal.metricType)}</span>
                </div>
                {projection && (
                  <div className="goal-detail-row">
                    <span className="goal-detail-row-label">Verbleibende Distanz</span>
                    <span className="goal-detail-row-value">{projection.remainingDistance.toFixed(1)} {getUnit(goal.metricType)}</span>
                  </div>
                )}
                <div className="goal-detail-row">
                  <span className="goal-detail-row-label">Deadline</span>
                  <span className="goal-detail-row-value">{goal.deadline ? formatDate(goal.deadline) : '—'}</span>
                </div>
                {goal.deadline && (
                  <div className="goal-detail-row">
                    <span className="goal-detail-row-label">Verbleibende Zeit</span>
                    <span className="goal-detail-row-value">
                      {daysRemaining(goal.deadline) > 0
                        ? `${daysRemaining(goal.deadline)} ${daysRemaining(goal.deadline) === 1 ? 'Tag' : 'Tage'}`
                        : 'Abgelaufen'}
                    </span>
                  </div>
                )}
              </div>
            </Section>

            {projection && (
              <Section title="Prognose">
                <div className="goal-detail-projection">
                  {projection.requiredWeeklyTempo !== null && (
                    <div className="goal-detail-row">
                      <span className="goal-detail-row-label">Benötigtes Wochentempo</span>
                      <span className="goal-detail-row-value">{projection.requiredWeeklyTempo.toFixed(2)} {getUnit(goal.metricType)}/Woche</span>
                    </div>
                  )}
                  {projection.currentWeeklyRate !== null && (
                    <div className="goal-detail-row">
                      <span className="goal-detail-row-label">Aktuelles Wochentempo</span>
                      <span className="goal-detail-row-value">{Math.abs(projection.currentWeeklyRate).toFixed(2)} {getUnit(goal.metricType)}/Woche</span>
                    </div>
                  )}
                  {projection.projectedDate && (
                    <div className="goal-detail-row">
                      <span className="goal-detail-row-label">Voraussichtliches Erreichen</span>
                      <span className="goal-detail-row-value">{formatDate(projection.projectedDate)}</span>
                    </div>
                  )}
                  {(() => {
                    const limit = HEALTHY_LIMITS[goal.metricType] ?? 1.0
                    const isUnrealistic = projection.requiredWeeklyTempo !== null && projection.requiredWeeklyTempo > limit
                    const feedback = isUnrealistic ? 'unrealistic' : projection.trendFeedback

                    const trendConfig: Record<string, { color: string; Icon: typeof CircleCheck }> = {
                      ahead: { color: 'green', Icon: CircleCheck },
                      'on-track': { color: 'green', Icon: CircleCheck },
                      behind: { color: 'orange', Icon: TriangleAlert },
                      unrealistic: { color: 'red', Icon: ShieldAlert },
                      'insufficient-data': { color: 'red', Icon: HelpCircle },
                    }
                    const { color, Icon } = trendConfig[feedback] ?? trendConfig['insufficient-data']
                    const unit = getUnit(goal.metricType)
                    const message = isUnrealistic
                      ? `${projection.requiredWeeklyTempo!.toFixed(1)} ${unit}/Woche benötigt — empfohlen sind max. ${limit} ${unit}/Woche. Passe Zielwert oder Deadline an.`
                      : TREND_MESSAGES[feedback]
                    return (
                      <Notification
                        icon={<Icon />}
                        data-color={color}
                        data-material="filled"
                        data-content-contrast="min"
                      >
                        {message}
                      </Notification>
                    )
                  })()}
                </div>
              </Section>
            )}

            <div className="goal-detail-actions">
              <Button className="goal-detail-icon-button" onClick={startEditing} aria-label="Bearbeiten">
                <Pencil />
              </Button>
              <Button className="goal-detail-icon-button" onClick={() => setConfirmDelete(true)} aria-label="Löschen">
                <Trash2 />
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog title="Ziel bearbeiten" open={editing} onClose={() => setEditing(false)}>
        <div className="goal-detail-edit-form">
          <Input
            id="edit-target"
            label={goal ? `Zielwert (${getUnit(goal.metricType)})` : 'Zielwert'}
            type="text"
            inputMode="decimal"
            value={editTarget}
            onChange={(e) => setEditTarget(e.target.value)}
          />
          <Input
            id="edit-deadline"
            label="Deadline"
            type="date"
            value={editDeadline}
            onChange={(e) => setEditDeadline(e.target.value)}
          />
          {editError && <span className="goal-detail-edit-error" role="alert">{editError}</span>}
          <Button onClick={handleSave}>Speichern</Button>
        </div>
      </Dialog>

      <Dialog title="Ziel löschen" open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <div className="goal-detail-edit-form">
          <p>Dieses Ziel wirklich löschen? Das kann nicht rückgängig gemacht werden.</p>
          <div className="goal-detail-dialog-actions">
            <Button onClick={handleDelete}>Löschen</Button>
            <Button data-material="transparent" onClick={() => setConfirmDelete(false)}>Abbrechen</Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}

export default GoalDetailView
