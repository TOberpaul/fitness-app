import type { GoalProjection, ConsistencyScore, MicroWin, Streaks } from '../types'
import Notification from './core/Notification'
import './LiveStatus.css'
import './core/Card.css'

interface LiveStatusProps {
  projection: GoalProjection | null
  consistencyScore: ConsistencyScore | null
  microWins: MicroWin[]
  streaks: Streaks | null
}

const TREND_TEXT: Record<string, string> = {
  ahead: 'leicht voraus',
  'on-track': 'auf Kurs',
  behind: 'hinter Plan',
  'insufficient-data': 'Noch nicht genug Daten',
}

function getTrendFeedback(projection: GoalProjection | null): {
  text: string
  trend: string
} {
  if (!projection) {
    return { text: 'Noch nicht genug Daten', trend: 'insufficient-data' }
  }
  const trend = projection.trendFeedback
  return { text: TREND_TEXT[trend] ?? 'Noch nicht genug Daten', trend }
}

function getConsistencyColor(score: number): string {
  if (score >= 80) return 'green'
  if (score >= 50) return 'yellow'
  return 'red'
}

function LiveStatus({ projection, consistencyScore, microWins, streaks }: LiveStatusProps) {
  const { text: trendText, trend } = getTrendFeedback(projection)

  return (
    <>
      {streaks && streaks.dailyStreak > 0 && (
        <div className="live-status-streak-card core-card adaptive">
          <img
            className="live-status-streak-img"
            src={`${import.meta.env.BASE_URL}Flame.png`}
            alt=""
          />
          <span className="live-status-streak-text">
            <strong>{streaks.dailyStreak}</strong> <span className="live-status-streak-weak">{streaks.dailyStreak === 1 ? 'Tag' : 'Tage'} in Folge gewogen</span>
          </span>
        </div>
      )}

      <div className="live-status core-card adaptive" data-testid="live-status">
        <span className="live-status-trend" data-trend={trend}>
          {trendText}
        </span>

        {consistencyScore && (
        <Notification data-color={getConsistencyColor(consistencyScore.score)}>
          Konsistenz: {consistencyScore.score}%
        </Notification>
      )}

      {microWins.length > 0 && (
        <div className="live-status-micro-wins">
          {microWins.map((win) => (
            <span key={win.metric} className="live-status-micro-win">
              {win.text}
            </span>
          ))}
        </div>
      )}
      </div>
    </>
  )
}

export default LiveStatus
