import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { getCachedFood, saveFoodEntry, isFavorite, addFavorite, removeFavorite } from '../services/nutritionService'
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
}

function FoodDetailView({ open, onClose, foodId, date }: FoodDetailViewProps) {
  const [food, setFood] = useState<Food | null>(null)
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('100')
  const [usePortion, setUsePortion] = useState(false)
  const [isFav, setIsFav] = useState(false)

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
              <Button
                iconOnly
                className="food-detail-fav-btn"
                onClick={handleToggleFavorite}
                aria-label={isFav ? 'Favorit entfernen' : 'Als Favorit markieren'}
              >
                <Star size={20} fill={isFav ? 'currentColor' : 'none'} />
              </Button>
              <Button
                className="food-detail-save-btn"
                disabled={!isValid}
                onClick={handleSave}
              >
                Speichern
              </Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  )
}

export default FoodDetailView
