import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import GoalCard from '../components/GoalCard'
import AchievementCard from '../components/AchievementCard'
import CoachingSummary from '../components/CoachingSummary'
import BodyCompass from '../components/BodyCompass'
import { getAllData } from '../services/dataService'
import { getActiveGoals, calculateProjection } from '../services/goalService'
import { calculateConsistencyScore, getEarnedMilestones, detectNonScaleVictories } from '../services/gamificationService'
import { getWeekStart } from '../utils/date'
import type { DailyMeasurement, WeeklyMeasurement, Goal, GoalProjection, ConsistencyScore, Milestone, CircumferenceZone, TrendDirection, NonScaleVictory } from '../types'
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
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null)
  const [projection, setProjection] = useState<GoalProjection | null>(null)
  const [consistencyScore, setConsistencyScore] = useState<ConsistencyScore | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [currentWeight, setCurrentWeight] = useState<number | null>(null)
  const [weeklyWeightChange, setWeeklyWeightChange] = useState<number | null>(null)
  const [bodyCompassTrends, setBodyCompassTrends] = useState<Record<CircumferenceZone, TrendDirection | null>>({
    chest: null, waist: null, belly: null, hip: null, upperArm: null, thigh: null
  })
  const [nonScaleVictories, setNonScaleVictories] = useState<NonScaleVictory[]>([])

  useEffect(() => {
    async function loadData() {
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
      } catch {
        setHasDailyData(false)
        setHasWeeklyData(false)
      }
      try {
        const goals = await getActiveGoals()
        setHasGoals(goals.length > 0)
        if (goals.length > 0) {
          const firstGoal = goals[0]
          setActiveGoal(firstGoal)
          const measurements = firstGoal.metricType === 'circumference' ? weeklyMeasurements : dailyMeasurements
          setProjection(calculateProjection(firstGoal, measurements))
        } else {
          setActiveGoal(null)
          setProjection(null)
        }
      } catch {
        setHasGoals(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="goals-view">
      <img
        className="goals-view-hero"
        src={`${import.meta.env.BASE_URL}Running.png`}
        alt="Fitness Illustration"
      />

      {hasDailyData && (
        <CoachingSummary
          currentWeight={currentWeight}
          weeklyWeightChange={weeklyWeightChange}
          activeGoal={activeGoal}
          projection={projection}
        />
      )}

      {hasGoals === false ? (
        <EmptyState
          message="Noch kein Ziel gesetzt"
          ctaLabel="Erstes Ziel erstellen"
          onCtaClick={() => navigate('/goals/new')}
        />
      ) : activeGoal && (
        <>
          {hasDailyData && (
            <CoachingSummary
              currentWeight={currentWeight}
              weeklyWeightChange={weeklyWeightChange}
              activeGoal={activeGoal}
              projection={projection}
            />
          )}

          <GoalCard
            goal={activeGoal}
            projection={projection}
            onClick={() => navigate('/goals/' + activeGoal.id)}
          />

          {hasWeeklyData && (
            <BodyCompass trends={bodyCompassTrends} />
          )}

          {consistencyScore && (
            <div className="goals-view-consistency adaptive">
              <span>Diese Woche: {consistencyScore.score}% on track</span>
            </div>
          )}

          {nonScaleVictories.length > 0 && (
            <div className="goals-view-nsv">
              {nonScaleVictories.map((nsv, i) => (
                <p key={i} className="goals-view-nsv-message">{nsv.message}</p>
              ))}
            </div>
          )}

          {milestones.length > 0 && (
            <div className="goals-view-achievements">
              {milestones.map((m) => (
                <AchievementCard
                  key={m.id}
                  achievement={m}
                  onClick={() => navigate('/achievements')}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default GoalsView
