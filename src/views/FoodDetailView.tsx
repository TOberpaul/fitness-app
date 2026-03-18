import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Star } from 'lucide-react'
import { getCachedFood, saveFoodEntry, isFavorite, addFavorite, removeFavorite } from '../services/nutritionService'
import { calculateNutrition, portionToGrams } from '../utils/calculationEngine'
import type { Food } from '../types'
import './FoodDetailView.css'

function FoodDetailView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const date = searchParams.get('date') || new Date().toISOString().slice(0, 10)

  const [food, setFood] = useState<Food | null>(null)
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('100')
  const [usePortion, setUsePortion] = useState(false)
  const [isFav, setIsFav] = useState(false)

  useEffect(() => {
    async function load() {
      if (!id) {
        setLoading(false)
        return
      }
      const cached = await getCachedFood(id)
      setFood(cached ?? null)
      if (cached) {
        const fav = await isFavorite(cached.id)
        setIsFav(fav)
      }
      setLoading(false)
    }
    load()
  }, [id])

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
    navigate(-1)
  }

  if (loading) {
    return (
      <div className="food-detail-view">
        <div className="food-detail-loading" data-emphasis="weak">Laden…</div>
      </div>
    )
  }

  if (!food) {
    return (
      <div className="food-detail-view">
        <div className="food-detail-header">
          <button
            className="adaptive"
            data-interactive
            data-size="lg"
            onClick={() => navigate(-1)}
            aria-label="Zurück"
          >
            <ArrowLeft size={20} />
          </button>
          <h1>Nicht gefunden</h1>
        </div>
        <div className="food-detail-not-found" data-emphasis="weak">
          Lebensmittel nicht gefunden
        </div>
      </div>
    )
  }

  return (
    <div className="food-detail-view">
      {/* Header */}
      <div className="food-detail-header">
        <button
          className="adaptive"
          data-interactive
          data-size="lg"
          onClick={() => navigate(-1)}
          aria-label="Zurück"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="food-detail-title">
          <h1>{food.name}</h1>
          {food.brand && <span className="food-detail-brand" data-emphasis="weak">{food.brand}</span>}
        </div>
      </div>

      {/* Nutrition per 100g */}
      <div className="food-detail-nutrition adaptive" data-material="semi-transparent">
        <h2>Nährwerte pro 100 {food.default_unit}</h2>
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
      </div>

      {/* Amount input */}
      <div className="food-detail-amount">
        <label htmlFor="amount-input">
          Menge {usePortion && food.portion_label ? `(${food.portion_label})` : `(${food.default_unit})`}
        </label>
        <div className="food-detail-amount-row">
          <input
            id="amount-input"
            type="number"
            className="adaptive"
            data-material="semi-transparent"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            min="0"
            step="any"
            aria-invalid={!isValid}
          />
          {food.portion_size_g && (
            <button
              className="food-detail-portion-toggle adaptive"
              data-interactive
              data-active={usePortion}
              onClick={() => setUsePortion(p => !p)}
            >
              {food.portion_label || 'Portion'}
            </button>
          )}
        </div>
        {!isValid && amount !== '' && (
          <span className="food-detail-error">Bitte eine gültige Menge eingeben</span>
        )}
      </div>

      {/* Calculated values */}
      <div className="food-detail-calculated adaptive" data-material="semi-transparent">
        <h2>Berechnete Nährwerte</h2>
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
      </div>

      {/* Actions */}
      <div className="food-detail-actions">
        <button
          className="food-detail-fav-btn adaptive"
          data-interactive
          data-active={isFav}
          onClick={handleToggleFavorite}
          aria-label={isFav ? 'Favorit entfernen' : 'Als Favorit markieren'}
        >
          <Star size={20} fill={isFav ? 'currentColor' : 'none'} />
        </button>
        <button
          className="food-detail-save-btn adaptive"
          data-interactive
          data-material="filled"
          data-emphasis="strong"
          data-size="lg"
          disabled={!isValid}
          onClick={handleSave}
        >
          Speichern
        </button>
      </div>
    </div>
  )
}

export default FoodDetailView
