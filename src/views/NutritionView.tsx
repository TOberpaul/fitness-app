import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { getDailySummary, deleteFoodEntry } from '../services/nutritionService'
import type { DailySummary } from '../types'
import './NutritionView.css'

function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatDateDE(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('de-DE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function NutritionView() {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(todayString)
  const [summary, setSummary] = useState<DailySummary | null>(null)

  const loadSummary = useCallback(async () => {
    const data = await getDailySummary(selectedDate)
    setSummary(data)
  }, [selectedDate])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  const handleDelete = async (id: string) => {
    await deleteFoodEntry(id)
    await loadSummary()
  }

  return (
    <div className="nutrition-view">
      {/* Date navigation */}
      <div className="nutrition-date-nav adaptive" data-material="semi-transparent">
        <button
          className="adaptive"
          data-interactive
          data-size="lg"
          onClick={() => setSelectedDate(prev => shiftDate(prev, -1))}
          aria-label="Vorheriger Tag"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="nutrition-date-label">{formatDateDE(selectedDate)}</span>
        <button
          className="adaptive"
          data-interactive
          data-size="lg"
          onClick={() => setSelectedDate(prev => shiftDate(prev, 1))}
          aria-label="Nächster Tag"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Calorie + Macro summary */}
      <div className="nutrition-summary">
        <div className="nutrition-kcal">
          {summary?.total_kcal.toFixed(0) ?? '0'}
          <span className="nutrition-kcal-unit"> kcal</span>
        </div>
        <div className="nutrition-macros">
          <div className="nutrition-macro">
            <span className="nutrition-macro-value">{summary?.total_protein.toFixed(1) ?? '0'} g</span>
            <span className="nutrition-macro-label" data-emphasis="weak">Protein</span>
          </div>
          <div className="nutrition-macro">
            <span className="nutrition-macro-value">{summary?.total_carbs.toFixed(1) ?? '0'} g</span>
            <span className="nutrition-macro-label" data-emphasis="weak">Kohlenhydrate</span>
          </div>
          <div className="nutrition-macro">
            <span className="nutrition-macro-value">{summary?.total_fat.toFixed(1) ?? '0'} g</span>
            <span className="nutrition-macro-label" data-emphasis="weak">Fett</span>
          </div>
        </div>
      </div>

      {/* Food entries list */}
      <div className="nutrition-entries">
        {summary && summary.entries.length > 0 ? (
          summary.entries.map(entry => (
            <div key={entry.id} className="nutrition-entry adaptive" data-material="semi-transparent">
              <div className="nutrition-entry-info">
                <span className="nutrition-entry-name">{entry.name}</span>
                <span className="nutrition-entry-detail" data-emphasis="weak">
                  {entry.amount_grams} g · {entry.kcal.toFixed(0)} kcal
                </span>
              </div>
              <button
                className="nutrition-entry-delete adaptive"
                data-interactive
                data-color="red"
                onClick={() => handleDelete(entry.id)}
                aria-label={`${entry.name} löschen`}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        ) : (
          <div className="nutrition-empty" data-emphasis="weak">
            Noch keine Einträge für diesen Tag
          </div>
        )}
      </div>

      {/* Add button */}
      <button
        className="nutrition-add-btn adaptive"
        data-interactive
        data-material="filled"
        data-emphasis="strong"
        data-size="lg"
        onClick={() => navigate(`/nutrition/add?date=${selectedDate}`)}
      >
        <Plus size={20} />
        Hinzufügen
      </button>
    </div>
  )
}

export default NutritionView
