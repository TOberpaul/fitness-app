import { motion } from 'motion/react'
import type { Achievement, Milestone, StreakAchievement } from '../types'
import { scaleIn, tapFeedback } from '../animations/presets'
import { useReducedMotion, getVariants } from '../animations/hooks'
import Badge from './core/Badge'
import './AchievementCard.css'

interface AchievementCardProps {
  achievement: Achievement | Milestone | StreakAchievement
  icon?: string
  color?: string
  onClick?: () => void
}

function isNewAchievement(achievement: Achievement | Milestone | StreakAchievement): achievement is Achievement {
  return 'definition' in achievement && 'status' in achievement
}

function isMilestone(achievement: Milestone | StreakAchievement): achievement is Milestone {
  return 'id' in achievement
}

function getDetail(achievement: Achievement | Milestone | StreakAchievement): string {
  if (isNewAchievement(achievement)) {
    if (achievement.status === 'earned' && achievement.earnedAt) {
      const d = new Date(achievement.earnedAt)
      const dateStr = `Erreicht am ${d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
      if (achievement.detail) {
        return `${achievement.detail} — ${dateStr}`
      }
      return dateStr
    }
    return ''
  }
  if (isMilestone(achievement)) {
    const d = new Date(achievement.earnedAt)
    return `Erreicht am ${d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
  }
  const unit = achievement.type === 'daily-streak'
    ? (achievement.count === 1 ? 'Tag' : 'Tage')
    : (achievement.count === 1 ? 'Woche' : 'Wochen')
  return `${achievement.count} ${unit}`
}

function getLabel(achievement: Achievement | Milestone | StreakAchievement): string {
  if (isNewAchievement(achievement)) {
    if (achievement.status === 'locked') return '???'
    return achievement.definition.label
  }
  return achievement.label
}

/** Resolve icon string to an image src. If it matches a known asset name, use the PNG. */
function resolveIcon(iconStr: string): { type: 'img'; src: string } | { type: 'emoji'; value: string } {
  const base = import.meta.env.BASE_URL
  const knownAssets = ['Trophy-Bronze', 'Trophy-Silver', 'Trophy-Gold', 'Streak-3', 'Streak-7', 'Streak-14', 'Streak-30']
  if (knownAssets.includes(iconStr)) {
    return { type: 'img', src: `${base}${iconStr}.png` }
  }
  return { type: 'emoji', value: iconStr }
}

function AchievementCard({ achievement, icon, color, onClick }: AchievementCardProps) {
  const detail = getDetail(achievement)
  const label = getLabel(achievement)
  const isClickable = !!onClick
  const reducedMotion = useReducedMotion()

  const isLocked = isNewAchievement(achievement) && achievement.status === 'locked'
  const isNext = isNewAchievement(achievement) && achievement.status === 'next'
  const isEarned = isNewAchievement(achievement) && achievement.status === 'earned'
  const isDisabled = isLocked || isNext

  const resolvedIcon = isNewAchievement(achievement)
    ? resolveIcon(achievement.definition.icon)
    : null

  const cardColor = isNewAchievement(achievement)
    ? (isEarned ? 'violet' : undefined)
    : color

  const iconSrc = icon || `${import.meta.env.BASE_URL}Party.png`

  return (
    <motion.div
      className={`achievement-card adaptive${isDisabled ? ' achievement-card--disabled' : ''}`}
      {...(isClickable ? { 'data-interactive': true } : {})}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick!() } } : undefined}
      variants={getVariants(scaleIn, reducedMotion)}
      initial="initial"
      animate="animate"
      {...tapFeedback}
      data-status={isNewAchievement(achievement) ? achievement.status : undefined}
    >
      <div
        className="achievement-card-icon-area adaptive"
        data-material="filled-2"
        {...(cardColor ? { 'data-color': cardColor } : {})}
      >
        {isNewAchievement(achievement) ? (
          isLocked ? (
            <img
              className="achievement-card-icon-img"
              src={`${import.meta.env.BASE_URL}Lock.png`}
              alt=""
              data-testid="achievement-icon-locked"
            />
          ) : resolvedIcon && resolvedIcon.type === 'img' ? (
            <img
              className="achievement-card-icon-img"
              src={resolvedIcon.src}
              alt=""
              data-testid={isNext ? 'achievement-icon-next' : 'achievement-icon-earned'}
            />
          ) : (
            <span className="achievement-card-status-icon" data-testid={isNext ? 'achievement-icon-next' : 'achievement-icon-earned'}>✓</span>
          )
        ) : (
          <img src={iconSrc} alt="" />
        )}
      </div>
      <div className="achievement-card-content">
        <span className="achievement-card-label">
          {label}
          {isEarned && <Badge count="✓" color="green" inline><span /></Badge>}
        </span>
        {detail && <span className="achievement-card-detail">{detail}</span>}
      </div>
    </motion.div>
  )
}

export default AchievementCard
