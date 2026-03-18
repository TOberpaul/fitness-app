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

function AchievementSection({ achievements }: AchievementSectionProps) {
  const filtered = achievements.filter(
    (a) => a.definition.category === 'progress' || a.definition.category === 'streak'
  )
  const sorted = sortAchievements(filtered)

  if (sorted.length === 0) return null

  return (
    <Section title="Achievements" data-testid="achievement-section">
      <div className="achievement-section-grid">
        {sorted.map((achievement) => (
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
