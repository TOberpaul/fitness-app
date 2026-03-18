import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { staggerContainer, fadeIn } from '../animations/presets'
import { useReducedMotion, getVariants } from '../animations/hooks'
import EmptyState from '../components/EmptyState'
import GoalCard from '../components/GoalCard'
import CoachingSummary from '../components/CoachingSummary'
import BodyCompass from '../components/BodyCompass'
import ProgressJourney from '../components/ProgressJourney'
import AchievementSection from '../components/AchievementSection'
import { getAllData } from '../services/dataService'
import { getActiveGoals, getAllGoals, calculateProjection } from '../services/goalService'
import { getAllAchievements, evaluateMilestones, getStreaks, getEarnedMilestones } from '../services/gamificationService'
import type { DailyMeasurement, WeeklyMeasurement, Goal, GoalProjection, CircumferenceZone, TrendDirection, Achievement, Streaks } from '../types'
import GoalCreateView from './GoalCreateView'
import GoalDetailView from './GoalDetailView'
import Button from '../components/core/Button'
import Section from '../components/core/Section'
import '../components/core/Card.css'
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
  const reducedMotion = useReducedMotion()
  const [hasDailyData, setHasDailyData] = useState<boolean | null>(null)
  const [hasWeeklyData, setHasWeeklyData] = useState<boolean | null>(null)
  const [hasGoals, setHasGoals] = useState<boolean | null>(null)
  const [activeGoals, setActiveGoals] = useState<Goal[]>([])
  const [projections, setProjections] = useState<Map<string, GoalProjection>>(new Map())
  const [currentWeight, setCurrentWeight] = useState<number | null>(null)
  const [weeklyWeightChange, setWeeklyWeightChange] = useState<number | null>(null)
  const [bodyCompassTrends, setBodyCompassTrends] = useState<Record<CircumferenceZone, TrendDirection | null>>({
    chest: null, waist: null, belly: null, hip: null, upperArm: null, thigh: null
  })
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [streaks, setStreaks] = useState<Streaks | null>(null)
  const [dailyMeasurements, setDailyMeasurements] = useState<DailyMeasurement[]>([])
  const [weeklyMeasurements, setWeeklyMeasurements] = useState<WeeklyMeasurement[]>([])
  const [showCreateGoal, setShowCreateGoal] = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    let dailyMeas: DailyMeasurement[] = []
    let weeklyMeas: WeeklyMeasurement[] = []
    try {
      const allData = await getAllData()
      dailyMeas = allData.dailyMeasurements
      weeklyMeas = allData.weeklyMeasurements
      setDailyMeasurements(dailyMeas)
      setWeeklyMeasurements(weeklyMeas)
      setHasDailyData(dailyMeas.length > 0)
      setHasWeeklyData(weeklyMeas.length > 0)

      const sortedDaily = [...dailyMeas]
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

      setBodyCompassTrends(calculateTrends(weeklyMeas))

      // Retroactively evaluate milestones for newly added types
      const allGoals = await getAllGoals()
      const streaks = await getStreaks()
      setStreaks(streaks)
      const earnedMilestones = await getEarnedMilestones()
      await evaluateMilestones({ goals: allGoals, streaks, dailyMeasurements: dailyMeas, weeklyMeasurements: weeklyMeas, earnedMilestones })

      setAchievements(await getAllAchievements())
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
        const measurements = g.metricType === 'circumference' ? weeklyMeas : dailyMeas
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

          {streaks && streaks.dailyStreak > 0 && (
            <div className="goals-view-streak-card core-card adaptive">
              <img
                className="goals-view-streak-img"
                src={`${import.meta.env.BASE_URL}Flame.png`}
                alt=""
              />
              <span className="goals-view-streak-text">
                <strong>{streaks.dailyStreak}</strong> <span className="goals-view-streak-weak">{streaks.dailyStreak === 1 ? 'Tag' : 'Tage'} in Folge gewogen</span>
              </span>
            </div>
          )}

          <Section title="Aktive Ziele">
            <motion.div className="goals-view-list" variants={staggerContainer} initial="initial" animate="animate">
              <AnimatePresence>
                {activeGoals.map((goal) => (
                  <motion.div
                    key={goal.id}
                    layout
                    variants={getVariants(fadeIn, reducedMotion)}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <GoalCard
                      goal={goal}
                      projection={projections.get(goal.id) || null}
                      onClick={() => setSelectedGoalId(goal.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            <Button
              data-material="inverted"
              data-container-contrast="max"
              onClick={() => setShowCreateGoal(true)}
            >
              Neues Ziel erstellen
            </Button>
          </Section>

          {hasWeeklyData && (
            <Section title="Körperkompass">
              <div data-color="green" data-material="filled">
                <BodyCompass trends={bodyCompassTrends} />
              </div>
            </Section>
          )}

          <ProgressJourney
            goals={activeGoals}
            projections={projections}
            dailyMeasurements={dailyMeasurements}
            weeklyMeasurements={weeklyMeasurements}
          />

          <AchievementSection achievements={achievements} />
        </>
      )}

      <GoalCreateView
        open={showCreateGoal}
        onClose={() => setShowCreateGoal(false)}
        onCreated={() => { loadData(); window.dispatchEvent(new CustomEvent('data-updated')) }}
      />

      {selectedGoalId && (
        <GoalDetailView
          goalId={selectedGoalId}
          open={!!selectedGoalId}
          onClose={() => setSelectedGoalId(null)}
          onChanged={() => { loadData(); window.dispatchEvent(new CustomEvent('data-updated')) }}
        />
      )}
    </div>
  )
}

export default GoalsView
