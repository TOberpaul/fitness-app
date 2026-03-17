import { motion } from 'motion/react'
import type { Milestone, StreakAchievement } from '../types'
import { scaleIn, tapFeedback } from '../animations/presets'
import { useReducedMotion, getVariants } from '../animations/hooks'
import './AchievementCard.css'

interface AchievementCardProps {
  achievement: Milestone | StreakAchievement
  icon?: string
  color?: string
  onClick?: () => void
}

function isMilestone(achievement: Milestone | StreakAchievement): achievement is Milestone {
  return 'id' in achievement
}

function getDetail(achievement: Milestone | StreakAchievement): string {
  if (isMilestone(achievement)) {
    const d = new Date(achievement.earnedAt)
    return `Erreicht am ${d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
  }
  const unit = achievement.type === 'daily-streak'
    ? (achievement.count === 1 ? 'Tag' : 'Tage')
    : (achievement.count === 1 ? 'Woche' : 'Wochen')
  return `${achievement.count} ${unit}`
}

function AchievementCard({ achievement, icon, color, onClick }: AchievementCardProps) {
  const detail = getDetail(achievement)
  const isClickable = !!onClick
  const iconSrc = icon || `${import.meta.env.BASE_URL}Party.png`
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      className="achievement-card adaptive"
      {...(isClickable ? { 'data-interactive': true } : {})}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick!() } } : undefined}
      variants={getVariants(scaleIn, reducedMotion)}
      initial="initial"
      animate="animate"
      {...tapFeedback}
    >
      <div
        className="achievement-card-icon-area adaptive"
        data-material="filled-2"
        {...(color ? { 'data-color': color } : {})}
      >
        <img src={iconSrc} alt="" />
      </div>
      <div className="achievement-card-content">
        <span className="achievement-card-label">{achievement.label}</span>
        <span className="achievement-card-detail">{detail}</span>
      </div>
    </motion.div>
  )
}

export default AchievementCard
