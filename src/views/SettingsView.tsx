import { useState, useEffect, useRef, useCallback } from 'react'
import { isConnected, syncData, initiateAuth, disconnect } from '../services/fitbitService'
import { exportToFile, importFromFile } from '../services/serializationService'
import { getAllData, importData } from '../services/dataService'
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed, updateReminderTime } from '../services/pushService'
import Button from '../components/core/Button'
import Section from '../components/core/Section'
import './SettingsView.css'

function SettingsView() {
  const [fitbitConnected, setFitbitConnected] = useState(false)
  const [syncStatus, setSyncStatus] = useState('')
  const [importStatus, setImportStatus] = useState('')
  const [pushSubscribed, setPushSubscribed] = useState(() => localStorage.getItem('push_subscribed') === '1')
  const [reminderTime, setReminderTime] = useState(() => localStorage.getItem('reminderTime') || '20:00')
  const fileInputRef = useRef<HTMLInputElement>(null)

  type ThemeMode = 'system' | 'light' | 'dark'
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('theme_mode') as ThemeMode) || 'system'
  })

  const applyTheme = useCallback((mode: ThemeMode) => {
    const html = document.documentElement
    if (mode === 'system') {
      html.removeAttribute('data-mode')
    } else {
      html.setAttribute('data-mode', mode)
    }
  }, [])

  useEffect(() => {
    applyTheme(themeMode)
  }, [themeMode, applyTheme])

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode)
    localStorage.setItem('theme_mode', mode)
  }

  useEffect(() => {
    const checkConnection = () => setFitbitConnected(isConnected())
    checkConnection()
    isPushSubscribed().then(setPushSubscribed)
    window.addEventListener('data-updated', checkConnection)
    return () => window.removeEventListener('data-updated', checkConnection)
  }, [])

  const showStatus = (setter: (s: string) => void, message: string) => {
    setter(message)
    setTimeout(() => setter(''), 3000)
  }

  const handleSync = async () => {
    setSyncStatus('Synchronisiere...')
    try {
      const result = await syncData()
      showStatus(setSyncStatus, `${result.newEntries} neu, ${result.updatedEntries} aktualisiert`)
    } catch (err) {
      showStatus(setSyncStatus, err instanceof Error ? err.message : 'Sync fehlgeschlagen')
    }
  }

  const handleExport = async () => {
    try {
      const allData = await getAllData()
      exportToFile(allData)
    } catch (err) {
      showStatus(setImportStatus, err instanceof Error ? err.message : 'Export fehlgeschlagen')
    }
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const parsed = await importFromFile(file)
      await importData(parsed)
      showStatus(setImportStatus, 'Import erfolgreich')
    } catch (err) {
      showStatus(setImportStatus, err instanceof Error ? err.message : 'Import fehlgeschlagen')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleTogglePush = async () => {
    if (pushSubscribed) {
      await unsubscribeFromPush()
      setPushSubscribed(false)
    } else {
      const ok = await subscribeToPush()
      setPushSubscribed(ok)
    }
  }

  return (
    <div className="settings adaptive">
      <h1>Einstellungen</h1>

      <Section title="Fitbit">
        <div className="settings-buttons">
          {fitbitConnected ? (
            <>
              <Button onClick={handleSync}>Fitbit Sync</Button>
              <Button onClick={async () => { await disconnect(); setFitbitConnected(false) }}>
                Fitbit trennen
              </Button>
            </>
          ) : (
            <Button onClick={() => initiateAuth()}>Fitbit verbinden</Button>
          )}
        </div>
        {syncStatus && <p className="settings-status">{syncStatus}</p>}
      </Section>

      <Section title="Daten">
        <div className="settings-buttons">
          <Button onClick={handleExport}>Export</Button>
          <Button onClick={() => fileInputRef.current?.click()}>Import</Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            hidden
            onChange={handleImportFile}
          />
        </div>
        {importStatus && <p className="settings-status">{importStatus}</p>}
      </Section>

      <Section title="Erscheinungsbild">
        <div className="dashboard-tabs adaptive" data-material="semi-transparent">
          {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => (
            <Button
              key={mode}
              data-size="lg"
              data-material={themeMode === mode ? 'inverted' : 'semi-transparent'}
              data-container-contrast={themeMode === mode ? 'max' : undefined}
              onClick={() => handleThemeChange(mode)}
            >
              {mode === 'system' ? 'System' : mode === 'light' ? 'Hell' : 'Dunkel'}
            </Button>
          ))}
        </div>
      </Section>

      <Section title="Benachrichtigungen">
        <label className="settings-toggle-row">
          <span>Erinnerungen</span>
          <Button
            iconOnly
            className={`toggle-switch${pushSubscribed ? ' toggle-on' : ''}`}
            role="switch"
            aria-checked={pushSubscribed}
            onClick={handleTogglePush}
            data-material={pushSubscribed ? 'inverted' : undefined}
            data-container-contrast={pushSubscribed ? 'max' : undefined}
          >
            <span
              className="toggle-knob"
              data-material={pushSubscribed ? 'filled' : 'inverted'}
              data-container-contrast="max"
            />
          </Button>
        </label>
        <label className="settings-toggle-row">
          <span>Uhrzeit</span>
          <input
            type="time"
            className="settings-time-input"
            value={reminderTime}
            onChange={e => {
              const val = e.target.value
              setReminderTime(val)
              updateReminderTime(val)
            }}
          />
        </label>
      </Section>

      <Section>
        <Button onClick={() => window.dispatchEvent(new CustomEvent('show-onboarding'))}>
          Einrichtung wiederholen
        </Button>
      </Section>
    </div>
  )
}

export default SettingsView
