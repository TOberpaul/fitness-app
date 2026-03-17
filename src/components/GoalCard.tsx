import { ArrowRight, CircleCheck, TriangleAlert, HelpCircle, ShieldAlert } from 'lucide-react'
import { motion } from 'motion/react'
import type { Goal, GoalProjection } from '../types'
import { slideUp, tapFeedback, DURATIONS, EASINGS } from '../animations/presets'
import { useReducedMotion, getVariants } from '../animations/hooks'
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

const HEALTHY_LIMITS: Record<string, number> = {
  weight: 2.0,
  bodyFat: 0.5,
  circumference: 2.0,
}

type TrendStatus = 'ahead' | 'on-track' | 'behind' | 'unrealistic' | 'insufficient-data'

const STATUS_CONFIG: Record<TrendStatus, { color: string; Icon: typeof CircleCheck; label: string }> = {
  ahead: { color: 'green', Icon: CircleCheck, label: 'Vor dem Plan' },
  'on-track': { color: 'green', Icon: CircleCheck, label: 'Auf Kurs' },
  behind: { color: 'orange', Icon: TriangleAlert, label: 'Mehr Tempo nötig' },
  unrealistic: { color: 'red', Icon: ShieldAlert, label: 'Ziel anpassen' },
  'insufficient-data': { color: 'blue', Icon: HelpCircle, label: 'Noch nicht genug Daten' },
}

function getTrendStatus(goal: Goal, projection: GoalProjection | null): TrendStatus {
  if (!projection) return 'insufficient-data'
  const limit = HEALTHY_LIMITS[goal.metricType] ?? 1.0
  if (projection.requiredWeeklyTempo !== null && projection.requiredWeeklyTempo > limit) {
    return 'unrealistic'
  }
  return projection.trendFeedback as TrendStatus
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
  const reducedMotion = useReducedMotion()

  const status = getTrendStatus(goal, projection)
  const { color: statusColor, Icon: StatusIcon, label: statusLabel } = STATUS_CONFIG[status]

  return (
    <motion.div
      className="goal-card adaptive"
      data-interactive
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      variants={getVariants(slideUp, reducedMotion)}
      initial="initial"
      animate="animate"
      {...tapFeedback}
    >
      <div className="goal-card-icon-area adaptive" data-material="filled-2" data-color={statusColor}>
        <img src={`${import.meta.env.BASE_URL}Goal.png`} alt="" />
      </div>
      <div className="goal-card-content">
      <div className="goal-card-header">
        <span className="goal-card-label">{label}</span>
        {projection && (
          <span className="goal-card-status adaptive" data-size="md" data-color={statusColor} data-material="filled" data-content-contrast="min">
            <StatusIcon />
            {statusLabel}
          </span>
        )}
      </div>

      <div className="goal-card-values">
        {projection ? projection.currentValue.toFixed(1) : goal.startValue.toFixed(1)} <ArrowRight /> {goal.targetValue.toFixed(1)} {unit}
      </div>

      <div className="goal-card-progress-track">
        <motion.div
          className="goal-card-progress-fill"
          initial={{ width: '0%' }}
          animate={{ width: `${percentComplete}%` }}
          transition={{ duration: DURATIONS.entrance, ease: EASINGS.easeOut }}
        />
      </div>

      <div className="goal-card-footer">
        {projection?.requiredWeeklyTempo !== null && projection?.requiredWeeklyTempo !== undefined && (
          <span className="goal-card-tempo">
            {projection.requiredWeeklyTempo.toFixed(1)} {unit}/Woche
          </span>
        )}
      </div>
      </div>
    </motion.div>
  )
}

export default GoalCard
