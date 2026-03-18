import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePanelContext } from '../App'
import GraphComponent from '../components/GraphComponent'
import EmptyState from '../components/EmptyState'
import Badge from '../components/core/Badge'
import Button from '../components/core/Button'
import { getDailyMeasurements, getWeeklyMeasurements, getAllData } from '../services/dataService'
import { getDateRange, calculatePercentChange } from '../utils/date'
import { getActiveGoals, calculateProjection } from '../services/goalService'
import { getStreaks } from '../services/gamificationService'
import type { DataPoint, TimeRange, DailyMeasurement, WeeklyMeasurement, Streaks } from '../types'
import { useAnimatedNumber } from '../animations/hooks'
import './DashboardView.css'

type ActiveTab = 'weight' | 'bodyFat' | 'circumference'

type CircumferenceField = 'chest' | 'waist' | 'hip' | 'belly' | 'upperArm' | 'thigh'

const CIRCUMFERENCE_LABELS: Record<CircumferenceField, string> = {
  chest: 'Brust',
  waist: 'Taille',
  hip: 'Hüfte',
  belly: 'Bauch',
  upperArm: 'Oberarm',
  thigh: 'Oberschenkel',
}

const TIME_RANGES: TimeRange[] = ['1W', '1M', '3M', '6M', '1J', 'Max']

function getUnit(tab: ActiveTab): string {
  if (tab === 'weight') return 'kg'
  if (tab === 'bodyFat') return '%'
  return 'cm'
}

function toDataPoints(measurements: DailyMeasurement[], field: 'weight' | 'bodyFat'): DataPoint[] {
  const points: DataPoint[] = []
  for (const m of measurements) {
    const val = m[field]
    if (val != null) points.push({ date: m.date, value: val })
  }
  return points.sort((a, b) => a.date.localeCompare(b.date))
}

function circumferenceToDataPoints(measurements: WeeklyMeasurement[], field: CircumferenceField): DataPoint[] {
  const points: DataPoint[] = []
  for (const m of measurements) {
    const val = m[field]
    if (val != null) points.push({ date: m.date, value: val })
  }
  return points.sort((a, b) => a.date.localeCompare(b.date))
}

function DashboardView() {
  const navigate = useNavigate()
  const { scrollTo } = usePanelContext()
  const [activeTab, setActiveTab] = useState<ActiveTab>('weight')
  const [timeRange, setTimeRange] = useState<TimeRange>('1M')
  const [crosshairPoint, setCrosshairPoint] = useState<DataPoint | null>(null)
  const [data, setData] = useState<DataPoint[]>([])
  const [circumferenceField, setCircumferenceField] = useState<CircumferenceField>('waist')
  const [hasDailyData, setHasDailyData] = useState<boolean | null>(null)
  const [hasWeeklyData, setHasWeeklyData] = useState<boolean | null>(null)
  const [streaks, setStreaks] = useState<Streaks | null>(null)
  const [goalPercent, setGoalPercent] = useState<number | null>(null)

  useEffect(() => {
    async function checkDataExistence() {
      try {
        const allData = await getAllData()
        setHasDailyData(allData.dailyMeasurements.length > 0)
        setHasWeeklyData(allData.weeklyMeasurements.length > 0)

        const s = await getStreaks()
        setStreaks(s)

        const goals = await getActiveGoals()
        if (goals.length > 0) {
          const g = goals.find(gl => gl.metricType === 'weight') || goals[0]
          const measurements = g.metricType === 'circumference'
            ? allData.weeklyMeasurements
            : allData.dailyMeasurements
          const proj = calculateProjection(g, measurements as never)
          setGoalPercent(Math.min(100, Math.max(0, Math.round(proj.percentComplete))))
        }
      } catch {
        setHasDailyData(false)
        setHasWeeklyData(false)
      }
    }
    checkDataExistence()
  }, [])

  const loadData = useCallback(async () => {
    const { from, to } = getDateRange(timeRange)
    if (activeTab === 'circumference') {
      const measurements = await getWeeklyMeasurements(from, to)
      setData(circumferenceToDataPoints(measurements, circumferenceField))
    } else {
      const measurements = await getDailyMeasurements(from, to)
      setData(toDataPoints(measurements, activeTab))
    }
  }, [activeTab, timeRange, circumferenceField])

  useEffect(() => {
    loadData()
    const onDataUpdated = () => { loadData() }
    window.addEventListener('data-updated', onDataUpdated)
    return () => window.removeEventListener('data-updated', onDataUpdated)
  }, [loadData])

  const currentPoint = crosshairPoint
    ?? (data.length > 0 ? data[data.length - 1] : null)

  const currentValue = currentPoint?.value ?? null

  const percentChange = data.length >= 2 && currentPoint
    ? calculatePercentChange(data[0].value, currentPoint.value)
    : null

  const animatedValue = useAnimatedNumber(currentValue ?? 0, 1)
  const animatedPercent = useAnimatedNumber(percentChange ?? 0, 1)

  // Show empty state only when we know there's no data at all
  if (hasDailyData === false && hasWeeklyData === false) {
    return (
      <div className="dashboard">
        <EmptyState
          message="Noch keine Daten vorhanden"
          ctaLabel="Erste Messung eintragen"
          onCtaClick={() => navigate('/daily')}
        />
      </div>
    )
  }

  return (
    <div className="dashboard">
      {/* Tab bar */}
      <div className="dashboard-tabs adaptive" data-material="semi-transparent">
        <Button
          data-size="lg"
          data-material={activeTab === 'weight' ? 'inverted' : undefined}
          data-container-contrast={activeTab === 'weight' ? 'max' : undefined}
          onClick={() => setActiveTab('weight')}
        >
          Gewicht
        </Button>
        <Button
          data-size="lg"
          data-material={activeTab === 'bodyFat' ? 'inverted' : undefined}
          data-container-contrast={activeTab === 'bodyFat' ? 'max' : undefined}
          onClick={() => setActiveTab('bodyFat')}
        >
          Körperfett
        </Button>
        <Button
          data-size="lg"
          data-material={activeTab === 'circumference' ? 'inverted' : undefined}
          data-container-contrast={activeTab === 'circumference' ? 'max' : undefined}
          onClick={() => setActiveTab('circumference')}
        >
          Umfänge
        </Button>
      </div>

      {/* Circumference sub-selector */}
      {activeTab === 'circumference' && (
        <div className="dashboard-circumference-selector" data-size="lg" data-material="transparent">
          {(Object.keys(CIRCUMFERENCE_LABELS) as CircumferenceField[]).map((field) => (
            <Button
              key={field}
              data-material={circumferenceField === field ? 'inverted' : undefined}
              data-container-contrast={circumferenceField === field ? 'max' : undefined}
              data-emphasis={circumferenceField === field ? 'strong' : undefined}
              onClick={() => setCircumferenceField(field)}
            >
              {CIRCUMFERENCE_LABELS[field]}
            </Button>
          ))}
        </div>
      )}

      {/* Current value display */}
      <div className="dashboard-value-display">
        {currentValue != null && currentPoint ? (
          <>
            <span className="dashboard-current-date" data-emphasis="weak">
              {new Date(currentPoint.date + 'T00:00:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <div className="dashboard-current-value">
              {animatedValue}
              <span className="dashboard-unit"> {getUnit(activeTab)}</span>
            </div>
            <div className="dashboard-meta">
              {percentChange != null && (
                <span
                  className="dashboard-percent-change adaptive"
                  data-color={percentChange < 0 ? 'green' : percentChange > 0 ? 'red' : undefined}
                  data-content-contrast="min"
                >
                  {percentChange > 0 ? '+' : ''}{animatedPercent}%
                </span>
              )}
              {goalPercent != null && (
                <Button iconOnly className="dashboard-badge-button" onClick={() => scrollTo(3)} aria-label="Zu Zielen">
                  <Badge count={`${goalPercent}%`} color="blue">
                    <img className="dashboard-badge-icon" src={`${import.meta.env.BASE_URL}Goal.png`} alt="Ziel" />
                  </Badge>
                </Button>
              )}
              {streaks && streaks.dailyStreak > 0 && (
                <Button iconOnly className="dashboard-badge-button" onClick={() => scrollTo(3)} aria-label="Zu Zielen">
                  <Badge count={streaks.dailyStreak} color="red">
                    <img className="dashboard-badge-icon" src={`${import.meta.env.BASE_URL}Flame.png`} alt="Streak" />
                  </Badge>
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="dashboard-no-data">Keine Daten vorhanden</div>
        )}
      </div>

      {/* Graph */}
      <GraphComponent
        data={data}
        timeRange={timeRange}
        onCrosshair={setCrosshairPoint}
        trendDirection="lower-is-better"
      />

      {/* Time range selector */}
      <div className="dashboard-time-range" data-size="lg" data-material="transparent">
        {TIME_RANGES.map((range) => (
          <Button
            key={range}
            data-material={timeRange === range ? 'inverted' : undefined}
            data-container-contrast={timeRange === range ? 'max' : undefined}
            data-emphasis={timeRange === range ? 'strong' : undefined}
            onClick={() => setTimeRange(range)}
          >
            {range}
          </Button>
        ))}
      </div>
    </div>
  )
}

export default DashboardView
