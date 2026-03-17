import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CircleCheck, TriangleAlert, CircleX, Sparkles } from 'lucide-react'
import { staggerContainer, fadeIn, scaleIn, EASINGS } from '../animations/presets'
import { useReducedMotion, getVariants } from '../animations/hooks'
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
import GoalDetailView from './GoalDetailView'
import Button from '../components/core/Button'
import Notification from '../components/core/Notification'
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

function getConsistencyLevel(score: number) {
  if (score >= 70) return { color: 'green', icon: CircleCheck, label: 'Stark' } as const
  if (score >= 40) return { color: 'orange', icon: TriangleAlert, label: 'Dranbleiben' } as const
  return { color: 'red', icon: CircleX, label: 'Aufholen' } as const
}

function GoalsView() {
  const reducedMotion = useReducedMotion()
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
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)

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

          {(consistencyScore || nonScaleVictories.length > 0 || milestones.length > 0 || (streaks && (streaks.dailyStreak > 0 || streaks.weeklyStreak > 0))) && (
            <Section title="Fortschritt & Erfolge">

              {consistencyScore && (() => {
                const level = getConsistencyLevel(consistencyScore.score)
                const Icon = level.icon
                return (
                  <motion.div
                    variants={getVariants(scaleIn, reducedMotion)}
                    initial="initial"
                    animate="animate"
                  >
                    <Notification
                      icon={<Icon />}
                      data-color={level.color}
                      data-material="filled"
                      data-content-contrast="min"
                    >
                      Diese Woche: {consistencyScore.score}% on track
                    </Notification>
                  </motion.div>
                )
              })()}

              {nonScaleVictories.length > 0 && (
                <motion.div
                  className="goals-view-nsv"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {nonScaleVictories.map((nsv, i) => (
                    <motion.div
                      key={i}
                      className="goals-view-nsv-card core-card adaptive"
                      data-color="pink"
                      data-material="filled"
                      data-content-contrast="min"
                      variants={getVariants(fadeIn, reducedMotion)}
                    >
                      <Sparkles className="goals-view-icon" />
                      <span className="goals-view-nsv-message">{nsv.message}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {milestones.length > 0 && (
                <motion.div
                  className="goals-view-achievements"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {milestones.map((m) => (
                    <AchievementCard
                      key={m.id}
                      achievement={m}
                      color="violet"
                    />
                  ))}
                </motion.div>
              )}

              {streaks && (streaks.dailyStreak > 0 || streaks.weeklyStreak > 0) && (() => {
                const items: StreakAchievement[] = []
                if (streaks.dailyStreak > 0) items.push({ type: 'daily-streak', count: streaks.dailyStreak, label: `${streaks.dailyStreak} ${streaks.dailyStreak === 1 ? 'Tag' : 'Tage'} am Stück gewogen` })
                if (streaks.weeklyStreak > 0) items.push({ type: 'weekly-streak', count: streaks.weeklyStreak, label: `${streaks.weeklyStreak} ${streaks.weeklyStreak === 1 ? 'Woche' : 'Wochen'} Umfänge gemessen` })
                return (
                  <motion.div
                    className="goals-view-streaks"
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                    transition={EASINGS.bounce}
                  >
                    {items.map((s) => (
                      <AchievementCard key={s.type} achievement={s} icon={`${import.meta.env.BASE_URL}Flame.png`} color="red" />
                    ))}
                  </motion.div>
                )
              })()}
            </Section>
          )}
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
