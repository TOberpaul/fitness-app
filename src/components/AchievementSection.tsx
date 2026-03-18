import type { Achievement, Streaks } from '../types'
import Section from './core/Section'
import AchievementCard from './AchievementCard'
import './AchievementSection.css'

interface AchievementSectionProps {
  achievements: Achievement[]
  streaks: Streaks | null
}

function sortAchievements(achievements: Achievement[]): Achievement[] {
  return [...achievements].sort((a, b) => {
    if (a.status === b.status) return 0
    return a.status === 'earned' ? -1 : 1
  })
}

function getStreakImage(count: number): string {
  const base = import.meta.env.BASE_URL
  if (count >= 30) return `${base}Streak-30.png`
  if (count >= 14) return `${base}Streak-14.png`
  if (count >= 7) return `${base}Streak-7.png`
  return `${base}Streak-3.png`
}

function AchievementSection({ achievements, streaks }: AchievementSectionProps) {
  const filtered = achievements.filter(
    (a) => a.definition.category === 'progress' || a.definition.category === 'streak'
  )
  const sorted = sortAchievements(filtered)

  const hasStreaks = streaks && (streaks.dailyStreak > 0 || streaks.weeklyStreak > 0)

  if (sorted.length === 0 && !hasStreaks) return null

  return (
    <Section title="Achievements" data-testid="achievement-section">
      {hasStreaks && (
        <div className="achievement-section-streaks">
          {streaks.dailyStreak > 0 && (
            <div className="achievement-streak-card adaptive core-card">
              <img
                className="achievement-streak-img"
                src={getStreakImage(streaks.dailyStreak)}
                alt=""
              />
              <div className="achievement-streak-content">
                <span className="achievement-streak-value">{streaks.dailyStreak}</span>
                <span className="achievement-streak-label">
                  {streaks.dailyStreak === 1 ? 'Tag' : 'Tage'} in Folge
                </span>
              </div>
            </div>
          )}
          {streaks.weeklyStreak > 0 && (
            <div className="achievement-streak-card adaptive core-card">
              <img
                className="achievement-streak-img"
                src={getStreakImage(streaks.weeklyStreak)}
                alt=""
              />
              <div className="achievement-streak-content">
                <span className="achievement-streak-value">{streaks.weeklyStreak}</span>
                <span className="achievement-streak-label">
                  {streaks.weeklyStreak === 1 ? 'Woche' : 'Wochen'} in Folge
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      {sorted.length > 0 && (
        <div className="achievement-section-grid">
          {sorted.map((achievement) => (
            <AchievementCard
              key={achievement.definition.id}
              achievement={achievement}
            />
          ))}
        </div>
      )}
    </Section>
  )
}

export { sortAchievements }
export default AchievementSection
