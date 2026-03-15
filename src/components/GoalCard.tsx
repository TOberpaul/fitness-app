import type { Goal, GoalProjection } from '../types'
import './GoalCard.css'

interface GoalCardProps {
  goal: Goal
  projection: GoalProjection | null
  onClick: () => void
}

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
  ahead: 'Vor dem Plan',
  'on-track': 'Auf Kurs',
  behind: 'Mehr Tempo nötig',
  'insufficient-data': 'Noch nicht genug Daten',
}

function getUnit(metricType: string): string {
  if (metricType === 'weight') return 'kg'
  if (metricType === 'bodyFat') return '%'
  return 'cm'
}

function GoalCard({ goal, projection, onClick }: GoalCardProps) {
  const unit = getUnit(goal.metricType)
  const label = METRIC_LABELS[goal.metricType] + (goal.zone ? ` — ${ZONE_LABELS[goal.zone]}` : '')
  const percentComplete = projection ? Math.min(100, Math.max(0, projection.percentComplete)) : 0

  return (
    <div
      className="goal-card adaptive"
      data-interactive
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
    >
      <div className="goal-card-header">
        <span className="goal-card-label">{label}</span>
        <span className="goal-card-values">
          {projection ? projection.currentValue.toFixed(1) : goal.startValue.toFixed(1)} → {goal.targetValue.toFixed(1)} {unit}
        </span>
      </div>

      <div className="goal-card-progress-track">
        <div
          className="goal-card-progress-fill"
          style={{ '--goal-progress': `${percentComplete}%` } as React.CSSProperties}
        />
      </div>

      <div className="goal-card-footer">
        {projection && (
          <span className="goal-card-trend" data-trend={projection.trendFeedback}>
            {TREND_MESSAGES[projection.trendFeedback]}
          </span>
        )}
        {projection?.requiredWeeklyTempo !== null && projection?.requiredWeeklyTempo !== undefined && (
          <span className="goal-card-tempo">
            {projection.requiredWeeklyTempo.toFixed(1)} {unit}/Woche
          </span>
        )}
      </div>
    </div>
  )
}

export default GoalCard
