import { useEffect, useRef, useCallback } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import DashboardView from './views/DashboardView'
import DailyInputView from './views/DailyInputView'
import WeeklyInputView from './views/WeeklyInputView'
import FitbitCallbackView from './views/FitbitCallbackView'
import SettingsView from './views/SettingsView'
import BottomNavigation from './components/BottomNavigation'
import { initConnectionState } from './services/fitbitService'
import './App.css'

const SWIPE_ROUTES = ['/', '/daily', '/weekly']
const SWIPE_THRESHOLD = 50

function SwipeContainer({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  const handleSwipe = useCallback((deltaX: number) => {
    const currentIndex = SWIPE_ROUTES.indexOf(location.pathname)
    if (currentIndex === -1) return

    if (deltaX < -SWIPE_THRESHOLD && currentIndex < SWIPE_ROUTES.length - 1) {
      navigate(SWIPE_ROUTES[currentIndex + 1])
    } else if (deltaX > SWIPE_THRESHOLD && currentIndex > 0) {
      navigate(SWIPE_ROUTES[currentIndex - 1])
    }
  }, [location.pathname, navigate])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const deltaY = e.changedTouches[0].clientY - touchStartY.current
    // Only swipe if horizontal movement is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      handleSwipe(deltaX)
    }
  }, [handleSwipe])

  return (
    <div className="swipe-container" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {children}
    </div>
  )
}

function AppContent() {
  useEffect(() => {
    initConnectionState()
  }, [])

  return (
    <div className="app" data-size="xl">
      <main className="app-content">
        <SwipeContainer>
          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/daily" element={<DailyInputView />} />
            <Route path="/weekly" element={<WeeklyInputView />} />
            <Route path="/callback" element={<FitbitCallbackView />} />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </SwipeContainer>
      </main>
      <BottomNavigation/>
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
