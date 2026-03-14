import { useState, useEffect, useCallback, useRef } from 'react'
import GraphComponent from '../components/GraphComponent'
import { getDailyMeasurements, getWeeklyMeasurements, getAllData, importData } from '../services/dataService'
import { getDateRange, calculatePercentChange } from '../utils/date'
import { isConnected, syncData, initiateAuth, disconnect } from '../services/fitbitService'
import { exportToFile, importFromFile } from '../services/serializationService'
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed } from '../services/pushService'
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
  const [fitbitConnected, setFitbitConnected] = useState(false)
  const [syncStatus, setSyncStatus] = useState('')
  const [circumferenceField, setCircumferenceField] = useState<CircumferenceField>('waist')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [importStatus, setImportStatus] = useState('')
  const [pushSubscribed, setPushSubscribed] = useState(() => localStorage.getItem('push_subscribed') === '1')
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    setFitbitConnected(isConnected())
    isPushSubscribed().then(setPushSubscribed)
  }, [])

  const currentValue = crosshairPoint
    ? crosshairPoint.value
    : data.length > 0
      ? data[data.length - 1].value
      : null

  const percentChange = data.length >= 2
    ? calculatePercentChange(data[0].value, crosshairPoint ? crosshairPoint.value : data[data.length - 1].value)
    : null

  const handleSync = async () => {
    setSyncStatus('Synchronisiere...')
    try {
      const result = await syncData()
      setSyncStatus(`${result.newEntries} neu, ${result.updatedEntries} aktualisiert`)
      await loadData()
      setTimeout(() => setSyncStatus(''), 3000)
    } catch (err) {
      setSyncStatus(err instanceof Error ? err.message : 'Sync fehlgeschlagen')
      setTimeout(() => setSyncStatus(''), 3000)
    }
  }

  const showStatus = (message: string) => {
    setImportStatus(message)
    setTimeout(() => setImportStatus(''), 3000)
  }

  const handleExport = async () => {
    try {
      const allData = await getAllData()
      exportToFile(allData)
    } catch (err) {
      showStatus(err instanceof Error ? err.message : 'Export fehlgeschlagen')
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const parsed = await importFromFile(file)
      await importData(parsed)
      await loadData()
      showStatus('Import erfolgreich')
    } catch (err) {
      showStatus(err instanceof Error ? err.message : 'Import fehlgeschlagen')
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDeleteConfirm = () => {
    // placeholder — delete logic will be wired in task 14.3
    setShowDeleteConfirm(false)
  }

  return (
    <div className="dashboard adaptive">
      {/* Tab bar */}
      <div className="dashboard-tabs">
        <button
          className={`dashboard-tab${activeTab === 'weight' ? ' active' : ''}`}
          data-interactive
          onClick={() => setActiveTab('weight')}
        >
          Gewicht
        </button>
        <button
          className={`dashboard-tab${activeTab === 'bodyFat' ? ' active' : ''}`}
          data-interactive
          onClick={() => setActiveTab('bodyFat')}
        >
          Körperfett
        </button>
        <button
          className={`dashboard-tab${activeTab === 'circumference' ? ' active' : ''}`}
          data-interactive
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
              className={`dashboard-circumference-btn${circumferenceField === field ? ' active' : ''}`}
              data-interactive
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
                className="dashboard-percent-change"
                data-color={percentChange < 0 ? 'green' : percentChange > 0 ? 'red' : undefined}
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
            data-interactive
            {...(timeRange === range ? { 'data-material': 'vibrant' } : {})}
            onClick={() => setTimeRange(range)}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Actions: Fitbit sync, export, import */}
      <div className="dashboard-actions">
        {fitbitConnected ? (
          <>
            <button data-interactive onClick={handleSync}>
              Fitbit Sync
            </button>
            <button data-interactive onClick={async () => { await disconnect(); setFitbitConnected(false); }}>
              Fitbit trennen
            </button>
          </>
        ) : (
          <button data-interactive onClick={() => initiateAuth()}>
            Fitbit verbinden
          </button>
        )}
        <button data-interactive onClick={handleExport}>
          Export
        </button>
        <button data-interactive onClick={handleImportClick}>
          Import
        </button>
        <button
          data-interactive
          onClick={async () => {
            if (pushSubscribed) {
              await unsubscribeFromPush();
              setPushSubscribed(false);
            } else {
              const ok = await subscribeToPush();
              setPushSubscribed(ok);
            }
          }}
        >
          {pushSubscribed ? 'Erinnerungen aus' : 'Erinnerungen an'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleImportFile}
        />
      </div>

      {syncStatus && (
        <p className="dashboard-sync-status">{syncStatus}</p>
      )}

      {importStatus && (
        <p className="dashboard-import-status">{importStatus}</p>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="dashboard-confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="dashboard-confirm-dialog adaptive" onClick={(e) => e.stopPropagation()}>
            <p>Messung wirklich löschen?</p>
            <div className="dashboard-confirm-actions">
              <button data-interactive onClick={() => setShowDeleteConfirm(false)}>
                Abbrechen
              </button>
              <button data-interactive data-material="vibrant" onClick={handleDeleteConfirm}>
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardView
