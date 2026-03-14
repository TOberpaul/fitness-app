import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DashboardView from './views/DashboardView'
import DailyInputView from './views/DailyInputView'
import WeeklyInputView from './views/WeeklyInputView'
import FitbitCallbackView from './views/FitbitCallbackView'
import BottomNavigation from './components/BottomNavigation'
import { initConnectionState } from './services/fitbitService'
import './App.css'

function App() {
  useEffect(() => {
    initConnectionState();
  }, []);

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="app adaptive">
        <main className="app-content">
          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/daily" element={<DailyInputView />} />
            <Route path="/weekly" element={<WeeklyInputView />} />
            <Route path="/callback" element={<FitbitCallbackView />} />
          </Routes>
        </main>
        <BottomNavigation />
      </div>
    </BrowserRouter>
  )
}

export default App
