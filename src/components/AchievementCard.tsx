import type { Milestone, StreakAchievement } from '../types'
import './AchievementCard.css'

interface AchievementCardProps {
  achievement: Milestone | StreakAchievement
  onClick?: () => void
}

function isMilestone(achievement: Milestone | StreakAchievement): achievement is Milestone {
  return 'id' in achievement
}

function getDetail(achievement: Milestone | StreakAchievement): string {
  if (isMilestone(achievement)) {
    return `Erreicht am ${achievement.earnedAt}`
  }
  const unit = achievement.type === 'daily-streak' ? 'Tage' : 'Wochen'
  return `${achievement.count} ${unit}`
}

function AchievementCard({ achievement, onClick }: AchievementCardProps) {
  const detail = getDetail(achievement)
  const isClickable = !!onClick

  return (
    <div
      className="achievement-card adaptive"
      {...(isClickable ? { 'data-interactive': true } : {})}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick!() } } : undefined}
    >
      <div className="achievement-card-content">
        <span className="achievement-card-label">{achievement.label}</span>
        <span className="achievement-card-detail">{detail}</span>
      </div>
    </div>
  )
}

export default AchievementCard
