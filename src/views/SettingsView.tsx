import { useState, useEffect, useRef } from 'react'
import { isConnected, syncData, initiateAuth, disconnect } from '../services/fitbitService'
import { exportToFile, importFromFile } from '../services/serializationService'
import { getAllData, importData } from '../services/dataService'
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed } from '../services/pushService'
import './SettingsView.css'

function SettingsView() {
  const [fitbitConnected, setFitbitConnected] = useState(false)
  const [syncStatus, setSyncStatus] = useState('')
  const [importStatus, setImportStatus] = useState('')
  const [pushSubscribed, setPushSubscribed] = useState(() => localStorage.getItem('push_subscribed') === '1')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setFitbitConnected(isConnected())
    isPushSubscribed().then(setPushSubscribed)
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

      <section className="settings-section">
        <h2>Fitbit</h2>
        <div className="settings-buttons">
          {fitbitConnected ? (
            <>
              <button className="adaptive" data-interactive onClick={handleSync}>Fitbit Sync</button>
              <button className="adaptive" data-interactive onClick={async () => { await disconnect(); setFitbitConnected(false) }}>
                Fitbit trennen
              </button>
            </>
          ) : (
            <button className="adaptive" data-interactive onClick={() => initiateAuth()}>Fitbit verbinden</button>
          )}
        </div>
        {syncStatus && <p className="settings-status">{syncStatus}</p>}
      </section>

      <section className="settings-section">
        <h2>Daten</h2>
        <div className="settings-buttons">
          <button className="adaptive" data-interactive onClick={handleExport}>Export</button>
          <button className="adaptive" data-interactive onClick={() => fileInputRef.current?.click()}>Import</button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            hidden
            onChange={handleImportFile}
          />
        </div>
        {importStatus && <p className="settings-status">{importStatus}</p>}
      </section>

      <section className="settings-section">
        <h2>Benachrichtigungen</h2>
        <div className="settings-buttons">
          <button className="adaptive" data-interactive onClick={handleTogglePush}>
            {pushSubscribed ? 'Erinnerungen aus' : 'Erinnerungen an'}
          </button>
        </div>
      </section>
    </div>
  )
}

export default SettingsView
