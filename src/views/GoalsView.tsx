import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import GoalCard from '../components/GoalCard'
import AchievementCard from '../components/AchievementCard'
import CoachingSummary from '../components/CoachingSummary'
import BodyCompass from '../components/BodyCompass'
import { getAllData } from '../services/dataService'
import { getActiveGoals, calculateProjection } from '../services/goalService'
import { calculateConsistencyScore, getEarnedMilestones, detectNonScaleVictories, getStreaks } from '../services/gamificationService'
import { getWeekStart } from '../utils/date'
import type { DailyMeasurement, WeeklyMeasurement, Goal, GoalProjection, ConsistencyScore, Milestone, CircumferenceZone, TrendDirection, NonScaleVictory, Streaks, StreakAchievement } from '../types'
import GoalCreateView from './GoalCreateView'
import './GoalsView.css'

function calculateTrends(weeklyMeasurements: WeeklyMeasurement[]): Record<CircumferenceZone, TrendDirection | null> {
  const zones: CircumferenceZone[] = ['chest', 'waist', 'belly', 'hip', 'upperArm', 'thigh']
  const trends: Record<CircumferenceZone, TrendDirection | null> = {
    chest: null, waist: null, belly: null, hip: null, upperArm: null, thigh: null
  }
  const sorted = [...weeklyMeasurements].sort((a, b) => a.date.localeCompare(b.date))
  for (const zone of zones) {
    const values = sorted.map(m => m[zone]).filter((v): v is number => v != null)
    if (values.length < 3) { trends[zone] = null; continue }
    const last3 = values.slice(-3)
    if (last3[0] > last3[1] && last3[1] > last3[2]) trends[zone] = 'improving'
    else if (last3[0] < last3[1] && last3[1] < last3[2]) trends[zone] = 'declining'
    else trends[zone] = 'stable'
  }
  return trends
}

function GoalsView() {
  const navigate = useNavigate()
  const [hasDailyData, setHasDailyData] = useState<boolean | null>(null)
  const [hasWeeklyData, setHasWeeklyData] = useState<boolean | null>(null)
  const [hasGoals, setHasGoals] = useState<boolean | null>(null)
  const [activeGoals, setActiveGoals] = useState<Goal[]>([])
  const [projections, setProjections] = useState<Map<string, GoalProjection>>(new Map())
  const [consistencyScore, setConsistencyScore] = useState<ConsistencyScore | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [currentWeight, setCurrentWeight] = useState<number | null>(null)
  const [weeklyWeightChange, setWeeklyWeightChange] = useState<number | null>(null)
  const [bodyCompassTrends, setBodyCompassTrends] = useState<Record<CircumferenceZone, TrendDirection | null>>({
    chest: null, waist: null, belly: null, hip: null, upperArm: null, thigh: null
  })
  const [nonScaleVictories, setNonScaleVictories] = useState<NonScaleVictory[]>([])
  const [streaks, setStreaks] = useState<Streaks | null>(null)
  const [showCreateGoal, setShowCreateGoal] = useState(false)

  const loadData = useCallback(async () => {
    let dailyMeasurements: DailyMeasurement[] = []
    let weeklyMeasurements: WeeklyMeasurement[] = []
    try {
      const allData = await getAllData()
      dailyMeasurements = allData.dailyMeasurements
      weeklyMeasurements = allData.weeklyMeasurements
      setHasDailyData(dailyMeasurements.length > 0)
      setHasWeeklyData(weeklyMeasurements.length > 0)

      const sortedDaily = [...dailyMeasurements]
        .filter(m => m.weight != null)
        .sort((a, b) => a.date.localeCompare(b.date))
      if (sortedDaily.length > 0) {
        const mostRecent = sortedDaily[sortedDaily.length - 1]
        setCurrentWeight(mostRecent.weight ?? null)
        const recentDate = new Date(mostRecent.date)
        const sevenDaysAgo = new Date(recentDate)
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10)
        const olderEntries = sortedDaily.filter(m => m.date <= sevenDaysAgoStr)
        if (olderEntries.length > 0 && mostRecent.weight != null) {
          const olderWeight = olderEntries[olderEntries.length - 1].weight
          if (olderWeight != null) {
            setWeeklyWeightChange(+(mostRecent.weight - olderWeight).toFixed(1))
          }
        }
      }

      setBodyCompassTrends(calculateTrends(weeklyMeasurements))
      setNonScaleVictories(detectNonScaleVictories(dailyMeasurements, weeklyMeasurements))

      const weekStart = getWeekStart(new Date())
      setConsistencyScore(calculateConsistencyScore(weekStart, dailyMeasurements, weeklyMeasurements.length > 0))

      const earned = await getEarnedMilestones()
      setMilestones(earned.sort((a, b) => b.earnedAt.localeCompare(a.earnedAt)).slice(0, 3))
      setStreaks(await getStreaks())
    } catch {
      setHasDailyData(false)
      setHasWeeklyData(false)
    }
    try {
      const goals = await getActiveGoals()
      setHasGoals(goals.length > 0)
      setActiveGoals(goals)
      const projMap = new Map<string, GoalProjection>()
      for (const g of goals) {
        const measurements = g.metricType === 'circumference' ? weeklyMeasurements : dailyMeasurements
        projMap.set(g.id, calculateProjection(g, measurements))
      }
      setProjections(projMap)
    } catch {
      setHasGoals(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    window.addEventListener('data-updated', loadData)
    return () => window.removeEventListener('data-updated', loadData)
  }, [loadData])

  return (
    <div className="goals-view">
      <h1>Ziele</h1>
      <img
        className="goals-view-hero"
        src={`${import.meta.env.BASE_URL}Goal.png`}
        alt="Ziele Illustration"
      />

      {hasGoals === false ? (
        <EmptyState
          message="Noch kein Ziel gesetzt"
          ctaLabel="Erstes Ziel erstellen"
          onCtaClick={() => setShowCreateGoal(true)}
        />
      ) : activeGoals.length > 0 && (
        <>
          {hasDailyData && (() => {
            const weightGoal = activeGoals.find(g => g.metricType === 'weight') || activeGoals[0]
            const weightProj = projections.get(weightGoal.id) || null
            return (
              <CoachingSummary
                currentWeight={currentWeight}
                weeklyWeightChange={weeklyWeightChange}
                activeGoal={weightGoal}
                projection={weightProj}
              />
            )
          })()}

          {activeGoals.map((goal) => (
            <div key={goal.id} data-color="blue" data-material="origin">
              <GoalCard
                goal={goal}
                projection={projections.get(goal.id) || null}
                onClick={() => navigate('/goals/' + goal.id)}
              />
            </div>
          ))}

          <button
            className="goals-view-add adaptive"
            data-material="inverted"
            data-container-contrast="max"
            data-interactive
            onClick={() => setShowCreateGoal(true)}
          >
            Neues Ziel erstellen
          </button>

          {hasWeeklyData && (
            <div data-color="green" data-material="filled">
              <BodyCompass trends={bodyCompassTrends} />
            </div>
          )}

          {consistencyScore && (
            <div className="goals-view-consistency adaptive" data-color="orange" data-material="filled" data-content-contrast="min">
              <span>Diese Woche: {consistencyScore.score}% on track</span>
            </div>
          )}

          {nonScaleVictories.length > 0 && (
            <div className="goals-view-nsv" data-color="pink" data-material="filled" data-content-contrast="min">
              {nonScaleVictories.map((nsv, i) => (
                <p key={i} className="goals-view-nsv-message">{nsv.message}</p>
              ))}
            </div>
          )}

          {milestones.length > 0 && (
            <div className="goals-view-achievements" data-color="violet" data-material="filled">
              {milestones.map((m) => (
                <AchievementCard
                  key={m.id}
                  achievement={m}
                />
              ))}
            </div>
          )}

          {streaks && (streaks.dailyStreak > 0 || streaks.weeklyStreak > 0) && (() => {
            const items: StreakAchievement[] = []
            if (streaks.dailyStreak > 0) items.push({ type: 'daily-streak', count: streaks.dailyStreak, label: `${streaks.dailyStreak} Tage am Stück gewogen` })
            if (streaks.weeklyStreak > 0) items.push({ type: 'weekly-streak', count: streaks.weeklyStreak, label: `${streaks.weeklyStreak} Wochen Umfänge gemessen` })
            return (
              <div className="goals-view-streaks" data-color="red" data-material="filled">
                {items.map((s) => (
                  <AchievementCard key={s.type} achievement={s} icon={`${import.meta.env.BASE_URL}Flame.png`} />
                ))}
              </div>
            )
          })()}
        </>
      )}

      {showCreateGoal && (
        <GoalCreateView
          onClose={() => setShowCreateGoal(false)}
          onCreated={() => { loadData(); window.dispatchEvent(new CustomEvent('data-updated')) }}
        />
      )}
    </div>
  )
}

export default GoalsView
