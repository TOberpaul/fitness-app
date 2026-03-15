import { useState, useEffect, useCallback } from 'react'
import GraphComponent from '../components/GraphComponent'
import { getDailyMeasurements, getWeeklyMeasurements } from '../services/dataService'
import { getDateRange, calculatePercentChange } from '../utils/date'
import type { DataPoint, TimeRange, DailyMeasurement, WeeklyMeasurement } from '../types'
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
    if (val != null) {
      points.push({ date: m.date, value: val })
    }
  }
  return points.sort((a, b) => a.date.localeCompare(b.date))
}

function circumferenceToDataPoints(measurements: WeeklyMeasurement[], field: CircumferenceField): DataPoint[] {
  const points: DataPoint[] = []
  for (const m of measurements) {
    const val = m[field]
    if (val != null) {
      points.push({ date: m.date, value: val })
    }
  }
  return points.sort((a, b) => a.date.localeCompare(b.date))
}


function DashboardView() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('weight')
  const [timeRange, setTimeRange] = useState<TimeRange>('1M')
  const [crosshairPoint, setCrosshairPoint] = useState<DataPoint | null>(null)
  const [data, setData] = useState<DataPoint[]>([])
  const [circumferenceField, setCircumferenceField] = useState<CircumferenceField>('waist')

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
  }, [loadData])

  const currentValue = crosshairPoint
    ? crosshairPoint.value
    : data.length > 0
      ? data[data.length - 1].value
      : null

  const percentChange = data.length >= 2
    ? calculatePercentChange(data[0].value, crosshairPoint ? crosshairPoint.value : data[data.length - 1].value)
    : null

  return (
    <div className="dashboard adaptive">
      {/* Tab bar */}
      <div className="dashboard-tabs adaptive" data-material="semi-transparent">
        <button
          className={`dashboard-tab adaptive${activeTab === 'weight' ? ' active' : ''}`}
          data-interactive
          data-size="lg"
          {...(activeTab === 'weight' ? { 'data-material': 'inverted', 'data-container-contrast': 'max' } : {})}
          onClick={() => setActiveTab('weight')}
        >
          Gewicht
        </button>
        <button
          className={`dashboard-tab adaptive${activeTab === 'bodyFat' ? ' active' : ''}`}
          data-interactive
          data-size="lg"
          {...(activeTab === 'bodyFat' ? { 'data-material': 'inverted', 'data-container-contrast': 'max' } : {})}
          onClick={() => setActiveTab('bodyFat')}
        >
          Körperfett
        </button>
        <button
          className={`dashboard-tab adaptive${activeTab === 'circumference' ? ' active' : ''}`}
          data-interactive
          data-size="lg"
          {...(activeTab === 'circumference' ? { 'data-material': 'inverted', 'data-container-contrast': 'max' } : {})}
          onClick={() => setActiveTab('circumference')}
        >
          Umfänge
        </button>
      </div>

      {/* Circumference sub-selector */}
      {activeTab === 'circumference' && (
        <div className="dashboard-circumference-selector">
          {(Object.keys(CIRCUMFERENCE_LABELS) as CircumferenceField[]).map((field) => (
            <button
              key={field}
              className={`dashboard-circumference-btn adaptive${circumferenceField === field ? ' active' : ''}`}
              data-interactive
              {...(circumferenceField === field ? { 'data-material': 'inverted', 'data-container-contrast': 'max' } : {})}
              onClick={() => setCircumferenceField(field)}
            >
              {CIRCUMFERENCE_LABELS[field]}
            </button>
          ))}
        </div>
      )}

      {/* Current value display */}
      <div className="dashboard-value-display">
        {currentValue != null ? (
          <>
            <div className="dashboard-current-value">
              {currentValue.toFixed(1)}
              <span className="dashboard-unit"> {getUnit(activeTab)}</span>
            </div>
            {percentChange != null && (
              <div
                className="dashboard-percent-change adaptive"
                data-color={percentChange < 0 ? 'green' : percentChange > 0 ? 'red' : undefined}
                data-content-contrast="min"
              >
                {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%
              </div>
            )}
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
      <div className="dashboard-time-range">
        {TIME_RANGES.map((range) => (
          <button
            key={range}
            className={`adaptive${timeRange === range ? ' active' : ''}`}
            data-interactive
            {...(timeRange === range ? { 'data-material': 'inverted', 'data-container-contrast': 'max' } : {})}
            onClick={() => setTimeRange(range)}
          >
            {range}
          </button>
        ))}
      </div>
    </div>
  )
}

export default DashboardView
