import type { Achievement } from '../types'
import Section from './core/Section'
import AchievementCard from './AchievementCard'
import './AchievementSection.css'

interface AchievementSectionProps {
  achievements: Achievement[]
}

function sortAchievements(achievements: Achievement[]): Achievement[] {
  return [...achievements].sort((a, b) => {
    if (a.status === b.status) return 0
    return a.status === 'earned' ? -1 : 1
  })
}

/** Show all earned + only the next locked per category */
function filterVisible(achievements: Achievement[]): Achievement[] {
  const earned = achievements.filter((a) => a.status === 'earned')
  const locked = achievements.filter((a) => a.status === 'locked')

  const nextLockedByCategory = new Map<string, Achievement>()
  for (const a of locked) {
    if (!nextLockedByCategory.has(a.definition.category)) {
      nextLockedByCategory.set(a.definition.category, a)
    }
  }

  return [...earned, ...nextLockedByCategory.values()]
}

function AchievementSection({ achievements }: AchievementSectionProps) {
  const filtered = achievements.filter(
    (a) => a.definition.category === 'progress' || a.definition.category === 'streak'
  )
  const sorted = sortAchievements(filtered)
  const visible = filterVisible(sorted)

  if (visible.length === 0) return null

  return (
    <Section title="Achievements" data-testid="achievement-section">
      <div className="achievement-section-grid">
        {visible.map((achievement) => (
          <AchievementCard
            key={achievement.definition.id}
            achievement={achievement}
          />
        ))}
      </div>
    </Section>
  )
}

export { sortAchievements }
export default AchievementSection
