import type { Goal, GoalProjection } from '../types'
import './CoachingSummary.css'

interface CoachingSummaryProps {
  currentWeight: number | null
  weeklyWeightChange: number | null
  activeGoal: Goal | null
  projection: GoalProjection | null
}

const METRIC_LABELS: Record<string, string> = {
  weight: 'Gewicht',
  bodyFat: 'Körperfett',
  circumference: 'Umfang',
}

const TREND_LABELS: Record<string, string> = {
  ahead: 'Vor dem Plan',
  'on-track': 'Im Plan',
  behind: 'Hinter dem Plan',
  'insufficient-data': 'Noch nicht genug Daten',
}

function formatWeightChange(change: number): string {
  const prefix = change > 0 ? '+' : ''
  return `${prefix}${change.toFixed(1)} kg`
}

function CoachingSummary({ currentWeight, weeklyWeightChange, activeGoal, projection }: CoachingSummaryProps) {
  return (
    <div className="coaching-summary adaptive">
      <div className="coaching-summary-row">
        <span className="coaching-summary-label">Aktuelles Gewicht</span>
        <span className="coaching-summary-value">
          {currentWeight !== null ? `${currentWeight.toFixed(1)} kg` : 'Keine Daten'}
        </span>
      </div>

      {weeklyWeightChange !== null && (
        <div className="coaching-summary-row">
          <span className="coaching-summary-label">7-Tage-Änderung</span>
          <span
            className="coaching-summary-change"
            data-direction={weeklyWeightChange < 0 ? 'loss' : 'gain'}
          >
            {formatWeightChange(weeklyWeightChange)}
          </span>
        </div>
      )}

      <div className="coaching-summary-row">
        <span className="coaching-summary-label">Ziel</span>
        {activeGoal && projection ? (
          <span
            className="coaching-summary-goal"
            data-trend={projection.trendFeedback}
          >
            {METRIC_LABELS[activeGoal.metricType]} — {TREND_LABELS[projection.trendFeedback]}
          </span>
        ) : (
          <span className="coaching-summary-goal-none">Kein aktives Ziel</span>
        )}
      </div>
    </div>
  )
}

export default CoachingSummary
