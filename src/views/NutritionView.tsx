import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { getDailySummary, deleteFoodEntry } from '../services/nutritionService'
import Button from '../components/core/Button'
import Card from '../components/core/Card'
import Section from '../components/core/Section'
import AddFoodView from './AddFoodView'
import FoodDetailView from './FoodDetailView'
import RecipeListView from './RecipeListView'
import RecipeDetailView from './RecipeDetailView'
import type { DailySummary } from '../types'
import './NutritionView.css'

function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDateDE(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('de-DE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function NutritionView() {
  const [selectedDate, setSelectedDate] = useState(todayString)
  const [summary, setSummary] = useState<DailySummary | null>(null)

  // Dialog states
  const [showAddFood, setShowAddFood] = useState(false)
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null)
  const [showRecipeList, setShowRecipeList] = useState(false)
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)

  const loadSummary = useCallback(async () => {
    const data = await getDailySummary(selectedDate)
    setSummary(data)
  }, [selectedDate])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  // Reload summary when any dialog closes (data may have changed)
  const handleAddFoodClose = () => {
    setShowAddFood(false)
    loadSummary()
  }

  const handleFoodDetailClose = () => {
    setSelectedFoodId(null)
    loadSummary()
  }

  const handleDelete = async (id: string) => {
    await deleteFoodEntry(id)
    await loadSummary()
  }

  return (
    <div className="nutrition-view">
      {/* Date navigation */}
      <Card className="nutrition-date-nav">
        <Button
          onClick={() => setSelectedDate(prev => shiftDate(prev, -1))}
          aria-label="Vorheriger Tag"
        >
          <ChevronLeft size={20} />
        </Button>
        <span className="nutrition-date-label">{formatDateDE(selectedDate)}</span>
        <Button
          onClick={() => setSelectedDate(prev => shiftDate(prev, 1))}
          aria-label="Nächster Tag"
        >
          <ChevronRight size={20} />
        </Button>
      </Card>

      {/* Calorie + Macro summary */}
      <Card className="nutrition-summary">
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
      </Card>

      {/* Food entries list */}
      <Section title="Einträge">
        {summary && summary.entries.length > 0 ? (
          summary.entries.map(entry => (
            <Card key={entry.id} className="nutrition-entry">
              <div className="nutrition-entry-info">
                <span className="nutrition-entry-name">{entry.name}</span>
                <span className="nutrition-entry-detail" data-emphasis="weak">
                  {entry.amount_grams} g · {entry.kcal.toFixed(0)} kcal
                </span>
              </div>
              <Button
                className="nutrition-entry-delete"
                onClick={() => handleDelete(entry.id)}
                aria-label={`${entry.name} löschen`}
              >
                <Trash2 size={18} />
              </Button>
            </Card>
          ))
        ) : (
          <div className="nutrition-empty" data-emphasis="weak">
            Noch keine Einträge für diesen Tag
          </div>
        )}
      </Section>

      {/* Add button */}
      <Button className="nutrition-add-btn" onClick={() => setShowAddFood(true)}>
        <Plus size={20} />
        Hinzufügen
      </Button>

      {/* Dialogs */}
      <AddFoodView
        open={showAddFood}
        onClose={handleAddFoodClose}
        date={selectedDate}
        onFoodSelect={(foodId) => {
          setShowAddFood(false)
          setSelectedFoodId(foodId)
        }}
      />

      {selectedFoodId && (
        <FoodDetailView
          open={!!selectedFoodId}
          onClose={handleFoodDetailClose}
          foodId={selectedFoodId}
          date={selectedDate}
        />
      )}

      <RecipeListView
        open={showRecipeList}
        onClose={() => { setShowRecipeList(false); loadSummary() }}
        onRecipeSelect={(id) => {
          setShowRecipeList(false)
          setSelectedRecipeId(id)
        }}
        onNewRecipe={() => {
          setShowRecipeList(false)
          setSelectedRecipeId('new')
        }}
      />

      {selectedRecipeId && (
        <RecipeDetailView
          open={!!selectedRecipeId}
          onClose={() => { setSelectedRecipeId(null); loadSummary() }}
          recipeId={selectedRecipeId}
        />
      )}
    </div>
  )
}

export default NutritionView
