import type { Goal, GoalProjection, DailyMeasurement, WeeklyMeasurement } from '../types'
import { computeLevelInfo } from '../services/gamificationService'
import Section from './core/Section'
import './ProgressJourney.css'
import './core/Card.css'

interface ProgressJourneyProps {
  goals: Goal[]
  projections: Map<string, GoalProjection>
  dailyMeasurements: DailyMeasurement[]
  weeklyMeasurements: WeeklyMeasurement[]
}

const GOAL_LABELS: Record<string, string> = {
  weight: 'Gewicht',
  bodyFat: 'Körperfett',
  circumference: 'Umfang',
}

function getTrendColor(trendFeedback: string): string {
  switch (trendFeedback) {
    case 'ahead':
    case 'on-track':
      return 'green'
    case 'behind':
      return 'yellow'
    default:
      return ''
  }
}

function getGoalLabel(goal: Goal): string {
  if (goal.metricType === 'circumference' && goal.zone) {
    const zoneLabels: Record<string, string> = {
      chest: 'Brust',
      waist: 'Taille',
      hip: 'Hüfte',
      belly: 'Bauch',
      upperArm: 'Oberarm',
      thigh: 'Oberschenkel',
    }
    return zoneLabels[goal.zone] ?? goal.zone
  }
  return GOAL_LABELS[goal.metricType] ?? goal.metricType
}

function ProgressJourney({ goals, projections }: ProgressJourneyProps) {
  const activeGoals = goals.filter((g) => g.status === 'active')

  if (activeGoals.length === 0) return null

  return (
    <Section title="Fortschritt" data-testid="progress-journey">
      {activeGoals.map((goal) => {
        const projection = projections.get(goal.id)
        if (!projection) return null

        const levelInfo = computeLevelInfo(goal, projection.currentValue)
        const trendColor = getTrendColor(projection.trendFeedback)

        return (
          <div key={goal.id} className="progress-journey-goal core-card adaptive" data-color={trendColor || undefined}>
            <div className="progress-journey-header">
              <span className="progress-journey-label">{getGoalLabel(goal)}</span>
              <span className="progress-journey-level">
                Level {levelInfo.level} / {levelInfo.totalLevels}
              </span>
            </div>

            <div className="progress-journey-bar-track">
              <div
                className="progress-journey-bar-fill"
                style={{ '--progress': `${levelInfo.overallProgress}%` } as React.CSSProperties}
              />
            </div>

            <span className="progress-journey-absolute" data-emphasis="weak">
              {levelInfo.absoluteText}
            </span>
          </div>
        )
      })}
    </Section>
  )
}

export default ProgressJourney
