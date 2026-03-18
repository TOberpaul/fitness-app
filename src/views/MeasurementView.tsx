import { useState } from 'react'
import { Scale, RulerDimensionLine } from 'lucide-react'
import Card from '../components/core/Card'
import DailyInputView from './DailyInputView'
import WeeklyInputView from './WeeklyInputView'
import './MeasurementView.css'

function MeasurementView() {
  const [showDaily, setShowDaily] = useState(false)
  const [showWeekly, setShowWeekly] = useState(false)

  return (
    <div className="measurement-view">
      <h1>Messung</h1>

      <div className="measurement-cards">
        <Card
          className="measurement-card"
          onClick={() => setShowDaily(true)}
          role="button"
          tabIndex={0}
          data-interactive
        >
          <Scale className="measurement-card-icon" />
          <div className="measurement-card-text">
            <span data-emphasis="strong">Gewicht & Körperfett</span>
            <span data-emphasis="weak">Tägliche Eingabe</span>
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

      <DailyInputView open={showDaily} onClose={() => setShowDaily(false)} />
      <WeeklyInputView open={showWeekly} onClose={() => setShowWeekly(false)} />
    </div>
  )
}

export default MeasurementView
