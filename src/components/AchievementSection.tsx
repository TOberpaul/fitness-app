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

/**
 * Show all earned + next two locked per category.
 * First locked → status 'next' (real icon, disabled look).
 * Second locked → status 'locked' (Lock icon).
 */
function filterVisible(achievements: Achievement[]): Achievement[] {
  const earned = achievements.filter((a) => a.status === 'earned')
  const locked = achievements.filter((a) => a.status === 'locked')

  const extra: Achievement[] = []
  const seen = new Map<string, number>()

  for (const a of locked) {
    const cat = a.definition.category
    const count = seen.get(cat) ?? 0
    if (count === 0) {
      // Next up → show real icon but disabled
      extra.push({ ...a, status: 'next' })
    } else if (count === 1) {
      // After that → locked with Lock icon
      extra.push(a)
    }
    if (count < 2) seen.set(cat, count + 1)
  }

  return [...earned, ...extra]
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
