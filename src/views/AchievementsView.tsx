import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getEarnedMilestones, getStreaks } from '../services/gamificationService'
import AchievementCard from '../components/AchievementCard'
import type { Milestone, Streaks, StreakAchievement } from '../types'
import Button from '../components/core/Button'
import './AchievementsView.css'

function AchievementsView() {
  const navigate = useNavigate()
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [streaks, setStreaks] = useState<Streaks | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [ms, st] = await Promise.all([getEarnedMilestones(), getStreaks()])
      // Sort milestones by earnedAt descending
      ms.sort((a, b) => b.earnedAt.localeCompare(a.earnedAt))
      setMilestones(ms)
      setStreaks(st)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return <div className="achievements-loading adaptive">Laden…</div>
  }

  const hasMilestones = milestones.length > 0
  const hasActiveStreaks = streaks !== null && (streaks.dailyStreak > 0 || streaks.weeklyStreak > 0)
  const isEmpty = !hasMilestones && !hasActiveStreaks

  const dailyStreakAchievement: StreakAchievement | null = streaks && streaks.dailyStreak > 0
    ? { type: 'daily-streak', count: streaks.dailyStreak, label: `${streaks.dailyStreak} Tage am Stück gewogen` }
    : null

  const weeklyStreakAchievement: StreakAchievement | null = streaks && streaks.weeklyStreak > 0
    ? { type: 'weekly-streak', count: streaks.weeklyStreak, label: `${streaks.weeklyStreak} Wochen Umfänge gemessen` }
    : null

  return (
    <div className="achievements adaptive">
      <Button
        className="achievements-back"
        data-material="transparent"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={16} /> Zurück
      </Button>

      <h1>Erfolge</h1>

      <img
        className="achievements-hero"
        src={`${import.meta.env.BASE_URL}Party.png`}
        alt=""
      />

      {isEmpty && (
        <div className="achievements-empty adaptive">
          <p>Noch keine Meilensteine erreicht</p>
          <p>Noch keine aktive Serie</p>
        </div>
      )}

      {hasMilestones && (
        <div className="achievements-section adaptive" data-color="violet" data-material="filled">
          <h2>Meilensteine</h2>
          <div className="achievements-list">
            {milestones.map((m) => (
              <AchievementCard key={m.id} achievement={m} />
            ))}
          </div>
        </div>
      )}

      {hasActiveStreaks && (
        <div className="achievements-section adaptive" data-color="red" data-material="filled">
          <h2>Aktuelle Serien</h2>
          <img
            className="achievements-streak-icon"
            src={`${import.meta.env.BASE_URL}Flame.png`}
            alt=""
          />
          <div className="achievements-list">
            {dailyStreakAchievement && (
              <AchievementCard achievement={dailyStreakAchievement} />
            )}
            {weeklyStreakAchievement && (
              <AchievementCard achievement={weeklyStreakAchievement} />
            )}
          </div>
        </div>
      )}

      {!hasActiveStreaks && !isEmpty && (
        <div className="achievements-section adaptive">
          <h2>Aktuelle Serien</h2>
          <p className="achievements-no-streaks">Noch keine aktive Serie</p>
        </div>
      )}
    </div>
  )
}

export default AchievementsView
