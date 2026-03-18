import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DashboardView from './views/DashboardView'
import DailyInputView from './views/DailyInputView'
import WeeklyInputView from './views/WeeklyInputView'
import GoalsView from './views/GoalsView'
import FitbitCallbackView from './views/FitbitCallbackView'
import SettingsView from './views/SettingsView'
import AchievementsView from './views/AchievementsView'
import NutritionView from './views/NutritionView'
import GoalOnboarding from './views/GoalOnboarding'
import BottomNavigation from './components/BottomNavigation'
import { initConnectionState, isConnected, syncData } from './services/fitbitService'
import { syncIfNeeded } from './services/cloudSync'
import { getAllGoals } from './services/goalService'
import { getAllData } from './services/dataService'
import './App.css'

const SNAP_ROUTES = ['/', '/daily', '/weekly', '/nutrition', '/goals', '/settings']

// Context so BottomNavigation can read/set the active panel without re-rendering the snap container
const PanelContext = createContext<{
  activeIndex: number
  scrollTo: (index: number) => void
}>({ activeIndex: 0, scrollTo: () => {} })

export function usePanelContext() {
  return useContext(PanelContext)
}

function MainPanels() {
  const [activeIndex, setActiveIndex] = useState(() => {
    const path = window.location.pathname.replace(import.meta.env.BASE_URL.replace(/\/$/, ''), '') || '/'
    const idx = SNAP_ROUTES.indexOf(path)
    return idx >= 0 ? idx : 0
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const skipScrollUpdate = useRef(false)

  // On mount, scroll to the initial panel without animation
  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.scrollTo({ left: activeIndex * containerRef.current.offsetWidth })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to panel when requested programmatically (from nav click)
  const scrollTo = useCallback((index: number) => {
    if (!containerRef.current) return
    skipScrollUpdate.current = true
    setActiveIndex(index)
    containerRef.current.scrollTo({ left: index * containerRef.current.offsetWidth, behavior: 'smooth' })
    const base = import.meta.env.BASE_URL.replace(/\/$/, '')
    window.history.replaceState(null, '', base + SNAP_ROUTES[index])
  }, [])

  // Detect settled panel from scroll position and update URL
  const updateUrl = useCallback((idx: number) => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '')
    window.history.replaceState(null, '', base + SNAP_ROUTES[idx])
  }, [])

  // Live-update active index during scroll
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let urlTimer: ReturnType<typeof setTimeout>
    let skipResetTimer: ReturnType<typeof setTimeout>

    const onScroll = () => {
      if (container.offsetWidth === 0) return
      const idx = Math.round(container.scrollLeft / container.offsetWidth)

      if (skipScrollUpdate.current) {
        // Check if we've arrived at the target — then re-enable live tracking
        clearTimeout(skipResetTimer)
        skipResetTimer = setTimeout(() => { skipScrollUpdate.current = false }, 100)
        return
      }

      if (idx >= 0 && idx < SNAP_ROUTES.length) {
        setActiveIndex(idx)
        clearTimeout(urlTimer)
        urlTimer = setTimeout(() => updateUrl(idx), 150)
      }
    }

    container.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', onScroll)
      clearTimeout(urlTimer)
      clearTimeout(skipResetTimer)
    }
  }, [updateUrl])

  return (
    <PanelContext.Provider value={{ activeIndex, scrollTo }}>
      <div className="snap-container" ref={containerRef}>
        <div className="snap-panel"><DashboardView /></div>
        <div className="snap-panel"><DailyInputView /></div>
        <div className="snap-panel"><WeeklyInputView /></div>
        <div className="snap-panel"><NutritionView /></div>
        <div className="snap-panel"><GoalsView /></div>
        <div className="snap-panel"><SettingsView /></div>
      </div>
      <BottomNavigation />
    </PanelContext.Provider>
  )
}

function AppContent() {
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    async function init() {
      await initConnectionState()
      if (isConnected()) {
        try {
          await syncData()
          window.dispatchEvent(new CustomEvent('data-updated'))
        } catch {
          // Sync errors should not block app startup
        }
      }
    }
    init()
    syncIfNeeded()

    async function checkOnboarding() {
      const completed = localStorage.getItem('onboardingCompleted')
      if (completed === 'true') return
      try {
        const [goals, allData] = await Promise.all([getAllGoals(), getAllData()])
        if (goals.length === 0 && allData.dailyMeasurements.length === 0) {
          setShowOnboarding(true)
        }
      } catch {
        // If check fails, don't show onboarding
      }
    }
    checkOnboarding()

    const handleShowOnboarding = () => setShowOnboarding(true)
    window.addEventListener('show-onboarding', handleShowOnboarding)
    return () => window.removeEventListener('show-onboarding', handleShowOnboarding)
  }, [])

  return (
    <div className="app" data-size="xl">
      <main className="app-content">
        <Routes>
          {/* Main snap panels — all share the same component */}
          <Route path="/" element={<MainPanels />} />
          <Route path="/daily" element={<MainPanels />} />
          <Route path="/weekly" element={<MainPanels />} />
          <Route path="/nutrition" element={<MainPanels />} />
          <Route path="/goals" element={<MainPanels />} />
          <Route path="/settings" element={<MainPanels />} />
          {/* Detail routes (no snap) */}
          <Route path="/callback" element={<FitbitCallbackView />} />
          <Route path="/achievements" element={<AchievementsView />} />
          <Route path="/onboarding" element={<Navigate to="/" replace />} />
        </Routes>
        {showOnboarding && <GoalOnboarding onClose={() => setShowOnboarding(false)} />}
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
