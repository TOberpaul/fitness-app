import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2, Save, ChevronDown, ChevronUp } from 'lucide-react'
import { getDailySummary, deleteFoodEntry, createMeal, deleteMeal, saveMealAsTemplate, getAllSavedMeals, applySavedMeal, deleteSavedMeal } from '../services/nutritionService'
import Button from '../components/core/Button'
import Card from '../components/core/Card'
import Section from '../components/core/Section'
import Input from '../components/core/Input'
import Dialog from '../components/core/Dialog'
import AddFoodView from './AddFoodView'
import FoodDetailView from './FoodDetailView'
import type { DailySummary, MealWithEntries, SavedMeal } from '../types'
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
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set())

  // Dialog states
  const [showAddFood, setShowAddFood] = useState(false)
  const [activeMealId, setActiveMealId] = useState<string | null>(null)
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null)
  const [showNewMealInput, setShowNewMealInput] = useState(false)
  const [newMealName, setNewMealName] = useState('')
  const [showSavedMeals, setShowSavedMeals] = useState(false)
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([])

  const loadSummary = useCallback(async () => {
    const data = await getDailySummary(selectedDate)
    setSummary(data)
  }, [selectedDate])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  const toggleMeal = (mealId: string) => {
    setExpandedMeals(prev => {
      const next = new Set(prev)
      if (next.has(mealId)) next.delete(mealId)
      else next.add(mealId)
      return next
    })
  }

  const handleCreateMeal = async () => {
    const name = newMealName.trim() || 'Neues Gericht'
    const meal = await createMeal(selectedDate, name)
    setNewMealName('')
    setShowNewMealInput(false)
    setExpandedMeals(prev => new Set(prev).add(meal.id))
    await loadSummary()
  }

  const handleDeleteMeal = async (mealId: string) => {
    if (mealId === '__ungrouped__') return
    await deleteMeal(mealId)
    await loadSummary()
  }

  const handleDeleteEntry = async (entryId: string) => {
    await deleteFoodEntry(entryId)
    await loadSummary()
  }

  const handleAddFoodToMeal = (mealId: string) => {
    setActiveMealId(mealId)
    setShowAddFood(true)
  }

  const handleAddFoodClose = () => {
    setShowAddFood(false)
    setActiveMealId(null)
    loadSummary()
  }

  const handleFoodDetailClose = () => {
    setSelectedFoodId(null)
    setActiveMealId(null)
    loadSummary()
  }

  const handleSaveMealTemplate = async (mealGroup: MealWithEntries) => {
    if (mealGroup.entries.length === 0) return
    await saveMealAsTemplate(mealGroup.meal.id, mealGroup.meal.name)
    // Feedback could be added here
  }

  const handleShowSavedMeals = async () => {
    const meals = await getAllSavedMeals()
    setSavedMeals(meals)
    setShowSavedMeals(true)
  }

  const handleApplySavedMeal = async (savedMealId: string) => {
    await applySavedMeal(savedMealId, selectedDate)
    setShowSavedMeals(false)
    await loadSummary()
  }

  const handleDeleteSavedMeal = async (id: string) => {
    await deleteSavedMeal(id)
    const meals = await getAllSavedMeals()
    setSavedMeals(meals)
  }

  return (
    <div className="nutrition-view">
      {/* Date navigation */}
      <Card className="nutrition-date-nav" data-material="semi-transparent">
        <Button iconOnly data-size="lg" data-material="semi-transparent" onClick={() => setSelectedDate(prev => shiftDate(prev, -1))} aria-label="Vorheriger Tag">
          <ChevronLeft size={20} />
        </Button>
        <span className="nutrition-date-label">{formatDateDE(selectedDate)}</span>
        <Button iconOnly data-size="lg" data-material="semi-transparent" onClick={() => setSelectedDate(prev => shiftDate(prev, 1))} aria-label="Nächster Tag">
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

      {/* Meals list */}
      <Section title="Gerichte">
        {summary && summary.meals.length > 0 ? (
          summary.meals.map(mealGroup => {
            const isExpanded = expandedMeals.has(mealGroup.meal.id)
            const isUngrouped = mealGroup.meal.id === '__ungrouped__'
            return (
              <Card key={mealGroup.meal.id} className="nutrition-meal">
                <div className="nutrition-meal-header" onClick={() => toggleMeal(mealGroup.meal.id)} role="button" tabIndex={0}>
                  <div className="nutrition-meal-title">
                    <span className="nutrition-meal-name">{mealGroup.meal.name}</span>
                    <span className="nutrition-meal-kcal" data-emphasis="weak">{mealGroup.total_kcal.toFixed(0)} kcal</span>
                  </div>
                  {isExpanded ? <ChevronUp className="nutrition-meal-chevron" /> : <ChevronDown className="nutrition-meal-chevron" />}
                </div>

                {isExpanded && (
                  <div className="nutrition-meal-body">
                    {mealGroup.entries.map(entry => (
                      <div key={entry.id} className="nutrition-entry">
                        <div className="nutrition-entry-info">
                          <span className="nutrition-entry-name">{entry.name}</span>
                          <span className="nutrition-entry-detail" data-emphasis="weak">{entry.amount_grams} g · {entry.kcal.toFixed(0)} kcal</span>
                        </div>
                        <Button iconOnly onClick={() => handleDeleteEntry(entry.id)} aria-label={`${entry.name} löschen`}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}

                    <div className="nutrition-meal-actions">
                      {!isUngrouped && (
                        <>
                          <Button width="full" onClick={() => handleAddFoodToMeal(mealGroup.meal.id)}>
                            <Plus size={16} /> Hinzufügen
                          </Button>
                          <Button iconOnly onClick={() => handleSaveMealTemplate(mealGroup)} aria-label="Gericht speichern">
                            <Save size={16} />
                          </Button>
                          <Button iconOnly onClick={() => handleDeleteMeal(mealGroup.meal.id)} aria-label="Gericht löschen">
                            <Trash2 size={16} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )
          })
        ) : (
          <div className="nutrition-empty" data-emphasis="weak">
            Noch keine Gerichte für diesen Tag
          </div>
        )}
      </Section>

      {/* Action buttons */}
      <div className="nutrition-bottom-actions">
        {showNewMealInput ? (
          <div className="nutrition-new-meal-row">
            <Input
              id="new-meal-name"
              placeholder="Name des Gerichts"
              value={newMealName}
              onChange={e => setNewMealName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateMeal()}
            />
            <Button onClick={handleCreateMeal}>OK</Button>
          </div>
          <Button width="full" data-material="transparent" onClick={() => { setShowNewMealInput(false); setNewMealName('') }}>Abbrechen</Button>
        ) : (
          <>
            <Button variant="primary" width="full" onClick={() => setShowNewMealInput(true)}>
              <Plus size={20} /> Neues Gericht
            </Button>
            <Button width="full" onClick={handleShowSavedMeals}>
              Gespeicherte Gerichte
            </Button>
          </>
        )}
      </div>

      {/* Saved meals dialog */}
      <Dialog title="Gespeicherte Gerichte" open={showSavedMeals} onClose={() => setShowSavedMeals(false)}>
        <div className="nutrition-saved-list">
          {savedMeals.length > 0 ? (
            savedMeals.map(sm => (
              <Card key={sm.id} className="nutrition-saved-item">
                <div className="nutrition-saved-item-info" onClick={() => handleApplySavedMeal(sm.id)} role="button" tabIndex={0}>
                  <span className="nutrition-saved-item-name">{sm.name}</span>
                  <span data-emphasis="weak">{sm.total_kcal.toFixed(0)} kcal</span>
                </div>
                <Button iconOnly onClick={() => handleDeleteSavedMeal(sm.id)} aria-label={`${sm.name} löschen`}>
                  <Trash2 size={16} />
                </Button>
              </Card>
            ))
          ) : (
            <div className="nutrition-empty" data-emphasis="weak">Noch keine gespeicherten Gerichte</div>
          )}
        </div>
      </Dialog>

      {/* Add food dialog */}
      <AddFoodView
        open={showAddFood}
        onClose={handleAddFoodClose}
        date={selectedDate}
        mealId={activeMealId ?? undefined}
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
          mealId={activeMealId ?? undefined}
        />
      )}
    </div>
  )
}

export default NutritionView
