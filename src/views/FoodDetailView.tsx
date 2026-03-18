import { useState, useEffect } from 'react'
import { Star, Pencil } from 'lucide-react'
import { getCachedFood, saveFoodEntry, isFavorite, addFavorite, removeFavorite, updateCustomFood } from '../services/nutritionService'
import { calculateNutrition, portionToGrams } from '../utils/calculationEngine'
import Dialog from '../components/core/Dialog'
import Button from '../components/core/Button'
import Card from '../components/core/Card'
import Section from '../components/core/Section'
import Input from '../components/core/Input'
import type { Food } from '../types'
import './FoodDetailView.css'

interface FoodDetailViewProps {
  open: boolean
  onClose: () => void
  foodId: string | null
  date: string
  mealId?: string
}

function FoodDetailView({ open, onClose, foodId, date, mealId }: FoodDetailViewProps) {
  const [food, setFood] = useState<Food | null>(null)
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('100')
  const [usePortion, setUsePortion] = useState(false)
  const [isFav, setIsFav] = useState(false)

  // Edit custom food state
  const [showEdit, setShowEdit] = useState(false)
  const [editName, setEditName] = useState('')
  const [editKcal, setEditKcal] = useState('')
  const [editProtein, setEditProtein] = useState('')
  const [editCarbs, setEditCarbs] = useState('')
  const [editFat, setEditFat] = useState('')
  const [editError, setEditError] = useState('')

  const openEditDialog = () => {
    if (!food) return
    setEditName(food.name)
    setEditKcal(String(food.kcal_per_100g))
    setEditProtein(String(food.protein_per_100g))
    setEditCarbs(String(food.carbs_per_100g))
    setEditFat(String(food.fat_per_100g))
    setEditError('')
    setShowEdit(true)
  }

  const handleSaveEdit = async () => {
    if (!food) return
    setEditError('')
    const name = editName.trim()
    if (!name) { setEditError('Name ist erforderlich'); return }
    const kcal = Number(editKcal.replace(',', '.'))
    const protein = Number(editProtein.replace(',', '.') || '0')
    const carbs = Number(editCarbs.replace(',', '.') || '0')
    const fat = Number(editFat.replace(',', '.') || '0')
    if (isNaN(kcal) || kcal < 0) { setEditError('Kalorien müssen eine gültige Zahl sein'); return }
    if (isNaN(protein) || protein < 0 || isNaN(carbs) || carbs < 0 || isNaN(fat) || fat < 0) {
      setEditError('Nährwerte müssen gültige Zahlen sein'); return
    }
    try {
      const updated = await updateCustomFood(food.id, { name, kcal_per_100g: kcal, protein_per_100g: protein, carbs_per_100g: carbs, fat_per_100g: fat })
      setFood(updated)
      setShowEdit(false)
    } catch {
      setEditError('Speichern fehlgeschlagen')
    }
  }

  const isCustom = food?.source === 'custom'

  useEffect(() => {
    if (!open || !foodId) {
      setLoading(false)
      return
    }
    setLoading(true)
    async function load() {
      const cached = await getCachedFood(foodId!)
      setFood(cached ?? null)
      if (cached) {
        const fav = await isFavorite(cached.id)
        setIsFav(fav)
      }
      setLoading(false)
    }
    load()
  }, [open, foodId])

  const parsedAmount = parseFloat(amount)
  const isValid = !isNaN(parsedAmount) && parsedAmount > 0

  const effectiveGrams = usePortion && food?.portion_size_g
    ? portionToGrams(food.portion_size_g, parsedAmount)
    : parsedAmount

  const calculated = food && isValid
    ? calculateNutrition(food, effectiveGrams)
    : { kcal: 0, protein: 0, carbs: 0, fat: 0 }

  const handleToggleFavorite = async () => {
    if (!food) return
    if (isFav) {
      await removeFavorite(food.id)
    } else {
      await addFavorite(food)
    }
    setIsFav(!isFav)
  }

  const handleSave = async () => {
    if (!food || !isValid) return
    const entry = {
      id: crypto.randomUUID(),
      user_id: 'local',
      date,
      meal_id: mealId || '',
      food_id: food.id,
      name: food.name,
      amount_grams: effectiveGrams,
      kcal: calculated.kcal,
      protein: calculated.protein,
      carbs: calculated.carbs,
      fat: calculated.fat,
      created_at: new Date().toISOString(),
    }
    await saveFoodEntry(entry)
    onClose()
  }

  const title = loading ? 'Laden…' : food ? food.name : 'Nicht gefunden'

  return (
    <Dialog title={title} onClose={onClose} open={open}>
      <div className="food-detail-content">
        {loading ? (
          <div className="food-detail-loading" data-emphasis="weak">Laden…</div>
        ) : !food ? (
          <div className="food-detail-not-found" data-emphasis="weak">
            Lebensmittel nicht gefunden
          </div>
        ) : (
          <>
            {food.brand && <span className="food-detail-brand" data-emphasis="weak">{food.brand}</span>}

            <Section title={`Nährwerte pro 100 ${food.default_unit}`}>
              <Card className="food-detail-nutrition">
                <div className="food-detail-nutrition-grid">
                  <div className="food-detail-nutrient">
                    <span className="food-detail-nutrient-value">{food.kcal_per_100g}</span>
                    <span className="food-detail-nutrient-label" data-emphasis="weak">kcal</span>
                  </div>
                  <div className="food-detail-nutrient">
                    <span className="food-detail-nutrient-value">{food.protein_per_100g} g</span>
                    <span className="food-detail-nutrient-label" data-emphasis="weak">Protein</span>
                  </div>
                  <div className="food-detail-nutrient">
                    <span className="food-detail-nutrient-value">{food.carbs_per_100g} g</span>
                    <span className="food-detail-nutrient-label" data-emphasis="weak">Kohlenhydrate</span>
                  </div>
                  <div className="food-detail-nutrient">
                    <span className="food-detail-nutrient-value">{food.fat_per_100g} g</span>
                    <span className="food-detail-nutrient-label" data-emphasis="weak">Fett</span>
                  </div>
                </div>
              </Card>
            </Section>

            <Section title={`Menge ${usePortion && food.portion_label ? `(${food.portion_label})` : `(${food.default_unit})`}`}>
              <div className="food-detail-amount-row">
                <Input
                  id="amount-input"
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  min="0"
                  step="any"
                  error={!isValid && amount !== '' ? 'Bitte eine gültige Menge eingeben' : undefined}
                />
                {food.portion_size_g && (
                  <Button
                    data-material={usePortion ? 'inverted' : undefined}
                    data-container-contrast={usePortion ? 'max' : undefined}
                    onClick={() => setUsePortion(p => !p)}
                  >
                    {food.portion_label || 'Portion'}
                  </Button>
                )}
              </div>
            </Section>

            <Section title="Berechnete Nährwerte">
              <Card className="food-detail-calculated">
                <div className="food-detail-nutrition-grid">
                  <div className="food-detail-nutrient">
                    <span className="food-detail-nutrient-value">{calculated.kcal}</span>
                    <span className="food-detail-nutrient-label" data-emphasis="weak">kcal</span>
                  </div>
                  <div className="food-detail-nutrient">
                    <span className="food-detail-nutrient-value">{calculated.protein} g</span>
                    <span className="food-detail-nutrient-label" data-emphasis="weak">Protein</span>
                  </div>
                  <div className="food-detail-nutrient">
                    <span className="food-detail-nutrient-value">{calculated.carbs} g</span>
                    <span className="food-detail-nutrient-label" data-emphasis="weak">Kohlenhydrate</span>
                  </div>
                  <div className="food-detail-nutrient">
                    <span className="food-detail-nutrient-value">{calculated.fat} g</span>
                    <span className="food-detail-nutrient-label" data-emphasis="weak">Fett</span>
                  </div>
                </div>
              </Card>
            </Section>

            <div className="food-detail-actions">
              {isCustom && (
                <Button
                  iconOnly
                  onClick={openEditDialog}
                  aria-label="Lebensmittel bearbeiten"
                >
                  <Pencil size={20} />
                </Button>
              )}
              <Button
                iconOnly
                onClick={handleToggleFavorite}
                aria-label={isFav ? 'Favorit entfernen' : 'Als Favorit markieren'}
              >
                <Star size={20} fill={isFav ? 'currentColor' : 'none'} />
              </Button>
              <Button
                width="full"
                disabled={!isValid}
                onClick={handleSave}
              >
                Speichern
              </Button>
            </div>

            {/* Edit custom food dialog */}
            <Dialog title="Lebensmittel bearbeiten" open={showEdit} onClose={() => setShowEdit(false)}>
              <div className="food-detail-edit-form">
                <Input
                  id="edit-name"
                  label="Name"
                  value={editName}
                  onChange={e => { setEditName(e.target.value); setEditError('') }}
                />
                <Input
                  id="edit-kcal"
                  label="Kalorien pro 100g"
                  type="text"
                  inputMode="decimal"
                  value={editKcal}
                  onChange={e => { setEditKcal(e.target.value); setEditError('') }}
                />
                <Input
                  id="edit-protein"
                  label="Protein pro 100g (g)"
                  type="text"
                  inputMode="decimal"
                  value={editProtein}
                  onChange={e => { setEditProtein(e.target.value); setEditError('') }}
                />
                <Input
                  id="edit-carbs"
                  label="Kohlenhydrate pro 100g (g)"
                  type="text"
                  inputMode="decimal"
                  value={editCarbs}
                  onChange={e => { setEditCarbs(e.target.value); setEditError('') }}
                />
                <Input
                  id="edit-fat"
                  label="Fett pro 100g (g)"
                  type="text"
                  inputMode="decimal"
                  value={editFat}
                  onChange={e => { setEditFat(e.target.value); setEditError('') }}
                />
                {editError && <p className="food-detail-edit-error">{editError}</p>}
                <div className="core-dialog-actions">
                  <Button variant="primary" onClick={handleSaveEdit}>Speichern</Button>
                  <Button data-material="transparent" onClick={() => setShowEdit(false)}>Abbrechen</Button>
                </div>
              </div>
            </Dialog>
          </>
        )}
      </div>
    </Dialog>
  )
}

export default FoodDetailView
