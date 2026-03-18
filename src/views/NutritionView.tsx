import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2, Save, ChevronDown, ChevronUp, Camera, X, Pencil } from 'lucide-react'
import { getDailySummary, deleteFoodEntry, createMeal, deleteMeal, updateMeal, saveMealAsTemplate, getAllSavedMeals, applySavedMeal, deleteSavedMeal } from '../services/nutritionService'
import { compressImage } from '../utils/imageCompression'
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
  const [mealImage, setMealImage] = useState<string | null>(null)
  const mealImageInputRef = useRef<HTMLInputElement>(null)

  // New entry type selection dialog
  const [showEntryTypeDialog, setShowEntryTypeDialog] = useState(false)
  const [editingMeal, setEditingMeal] = useState<MealWithEntries | null>(null)
  const [editMealName, setEditMealName] = useState('')
  const [editMealImage, setEditMealImage] = useState<string | null>(null)
  const editMealImageInputRef = useRef<HTMLInputElement>(null)
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

  const handleMealImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await compressImage(file)
      setMealImage(dataUrl)
    } catch { /* ignore */ }
    e.target.value = ''
  }

  const handleEditMeal = (mealGroup: MealWithEntries) => {
    setEditingMeal(mealGroup)
    setEditMealName(mealGroup.meal.name)
    setEditMealImage(mealGroup.meal.image_url || null)
  }

  const handleEditMealImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await compressImage(file)
      setEditMealImage(dataUrl)
    } catch { /* ignore */ }
    e.target.value = ''
  }

  const handleSaveEditMeal = async () => {
    if (!editingMeal) return
    await updateMeal(editingMeal.meal.id, {
      name: editMealName.trim() || editingMeal.meal.name,
      image_url: editMealImage,
    })
    setEditingMeal(null)
    await loadSummary()
  }

  const handleCreateMeal = async () => {
    const name = newMealName.trim() || 'Neues Gericht'
    const meal = await createMeal(selectedDate, name, mealImage || undefined)
    setNewMealName('')
    setMealImage(null)
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
      <h1>Ernährung</h1>

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
              <Card key={mealGroup.meal.id} className="nutrition-meal" role="button" tabIndex={0} onClick={() => toggleMeal(mealGroup.meal.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMeal(mealGroup.meal.id) } }}>
                <div className="nutrition-meal-header">
                  {mealGroup.meal.image_url && (
                    <img src={mealGroup.meal.image_url} alt="" className="nutrition-meal-thumb" />
                  )}
                  <div className="nutrition-meal-title">
                    <span className="nutrition-meal-name">{mealGroup.meal.name}</span>
                    <span className="nutrition-meal-kcal" data-emphasis="weak">{mealGroup.total_kcal.toFixed(0)} kcal</span>
                  </div>
                  {isExpanded ? <ChevronUp className="nutrition-meal-chevron" /> : <ChevronDown className="nutrition-meal-chevron" />}
                </div>

                {isExpanded && (
                  <div className="nutrition-meal-body" onClick={e => e.stopPropagation()}>
                    {mealGroup.entries.map(entry => (
                      <div key={entry.id} className="nutrition-entry adaptive" data-material="semi-transparent">
                        <div className="nutrition-entry-info">
                          <span className="nutrition-entry-name">{entry.name}</span>
                          <span className="nutrition-entry-detail" data-emphasis="weak">{entry.amount_grams} g · {entry.kcal.toFixed(0)} kcal</span>
                        </div>
                        <Button iconOnly data-material="transparent" onClick={() => handleDeleteEntry(entry.id)} aria-label={`${entry.name} löschen`}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}

                    <div className="nutrition-meal-actions">
                      {!isUngrouped && (
                        <>
                          <Button width="full" onClick={() => handleAddFoodToMeal(mealGroup.meal.id)}>
                            <Plus size={16} /> Zutaten
                          </Button>
                          <Button iconOnly onClick={() => handleEditMeal(mealGroup)} aria-label="Gericht bearbeiten">
                            <Pencil size={16} />
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
          <>
            <div className="nutrition-new-meal-row">
              <Input
                id="new-meal-name"
                placeholder="Name des Gerichts"
                value={newMealName}
                onChange={e => setNewMealName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateMeal()}
              />
              <Button iconOnly onClick={() => mealImageInputRef.current?.click()} aria-label="Foto aufnehmen">
                <Camera size={16} />
              </Button>
            </div>
            {mealImage && (
              <div className="nutrition-meal-photo-preview">
                <img src={mealImage} alt="Vorschau" className="nutrition-meal-photo-img" />
                <Button iconOnly onClick={() => setMealImage(null)} aria-label="Foto entfernen">
                  <X size={16} />
                </Button>
              </div>
            )}
            <input
              ref={mealImageInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleMealImageCapture}
              className="nutrition-photo-input"
            />
            <Button variant="primary" width="full" onClick={handleCreateMeal}>OK</Button>
            <Button width="full" onClick={() => { setShowNewMealInput(false); setNewMealName(''); setMealImage(null) }}>Abbrechen</Button>
          </>
        ) : (
          <>
            <Button variant="primary" width="full" onClick={() => setShowEntryTypeDialog(true)}>
              <Plus size={20} /> Neuer Eintrag
            </Button>
            <Button width="full" onClick={handleShowSavedMeals}>
              Gespeicherte Gerichte
            </Button>
          </>
        )}
      </div>

      {/* Entry type selection dialog */}
      <Dialog title="Neuer Eintrag" open={showEntryTypeDialog} onClose={() => setShowEntryTypeDialog(false)}>
        <div className="nutrition-entry-type-grid">
          <Card className="nutrition-entry-type-card" role="button" tabIndex={0} onClick={() => { setShowEntryTypeDialog(false); setShowNewMealInput(true) }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowEntryTypeDialog(false); setShowNewMealInput(true) } }}>
            <span className="nutrition-entry-type-emoji">🍽️</span>
            <span data-emphasis="strong">Gericht</span>
            <span data-emphasis="weak">Mehrere Zutaten gruppiert</span>
          </Card>
          <Card className="nutrition-entry-type-card" role="button" tabIndex={0} onClick={() => { setShowEntryTypeDialog(false); setActiveMealId(null); setShowAddFood(true) }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowEntryTypeDialog(false); setActiveMealId(null); setShowAddFood(true) } }}>
            <span className="nutrition-entry-type-emoji">🥤</span>
            <span data-emphasis="strong">Einzelnes Lebensmittel</span>
            <span data-emphasis="weak">z.B. Getränk, Snack</span>
          </Card>
        </div>
      </Dialog>

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

      {/* Edit meal dialog */}
      <Dialog title="Gericht bearbeiten" open={!!editingMeal} onClose={() => setEditingMeal(null)}>
        {editingMeal && (
          <div className="nutrition-edit-meal-form">
            <Input
              id="edit-meal-name"
              label="Name"
              value={editMealName}
              onChange={e => setEditMealName(e.target.value)}
            />
            <div className="nutrition-new-meal-photo">
              {editMealImage ? (
                <>
                  <img src={editMealImage} alt="Vorschau" className="nutrition-meal-photo-img" />
                  <div className="nutrition-photo-actions">
                    <Button width="full" onClick={() => editMealImageInputRef.current?.click()}>
                      <Camera size={16} /> Foto ändern
                    </Button>
                    <Button iconOnly onClick={() => setEditMealImage(null)} aria-label="Foto entfernen">
                      <X size={16} />
                    </Button>
                  </div>
                </>
              ) : (
                <Button width="full" onClick={() => editMealImageInputRef.current?.click()}>
                  <Camera size={16} /> Foto aufnehmen
                </Button>
              )}
              <input
                ref={editMealImageInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleEditMealImageCapture}
                className="nutrition-photo-input"
              />
            </div>
            <div className="core-dialog-actions">
              <Button variant="primary" onClick={handleSaveEditMeal}>Speichern</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}

export default NutritionView
