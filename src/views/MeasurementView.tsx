import { useState } from 'react'
import { Scale, Percent, RulerDimensionLine } from 'lucide-react'
import Card from '../components/core/Card'
import SleepyMascot from '../components/SleepyMascot'
import DailyInputView from './DailyInputView'
import WeeklyInputView from './WeeklyInputView'
import './MeasurementView.css'

function MeasurementView() {
  const [showWeight, setShowWeight] = useState(false)
  const [showBodyFat, setShowBodyFat] = useState(false)
  const [showWeekly, setShowWeekly] = useState(false)

  return (
    <div className="measurement-view">
      <h1>Messung</h1>

      <SleepyMascot />

      <div className="measurement-cards">
        <Card
          className="measurement-card"
          onClick={() => setShowWeight(true)}
          role="button"
          tabIndex={0}
          data-interactive
        >
          <Scale className="measurement-card-icon" />
          <div className="measurement-card-text">
            <span data-emphasis="strong">Gewicht</span>
            <span data-emphasis="weak">Tägliche Eingabe</span>
          </div>
        </Card>

        <Card
          className="measurement-card"
          onClick={() => setShowBodyFat(true)}
          role="button"
          tabIndex={0}
          data-interactive
        >
          <Percent className="measurement-card-icon" />
          <div className="measurement-card-text">
            <span data-emphasis="strong">Körperfett</span>
            <span data-emphasis="weak">Optionale Messung</span>
          </div>
        </Card>

        <Card
          className="measurement-card"
          onClick={() => setShowWeekly(true)}
          role="button"
          tabIndex={0}
          data-interactive
        >
          <RulerDimensionLine className="measurement-card-icon" />
          <div className="measurement-card-text">
            <span data-emphasis="strong">Umfangmessung</span>
            <span data-emphasis="weak">6 Körperstellen messen</span>
          </div>
        </Card>
      </div>

      <DailyInputView open={showWeight} onClose={() => setShowWeight(false)} mode="weight" />
      <DailyInputView open={showBodyFat} onClose={() => setShowBodyFat(false)} mode="bodyFat" />
      <WeeklyInputView open={showWeekly} onClose={() => setShowWeekly(false)} />
    </div>
  )
}

export default MeasurementView
