import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Camera, Search } from 'lucide-react'
import { searchFoods } from '../services/foodSearchService'
import { getRecipe, getRecipeItems, saveRecipe, saveRecipeItem, uploadRecipeImage } from '../services/nutritionService'
import { calculateNutrition, calculateRecipeTotals } from '../utils/calculationEngine'
import type { Food, RecipeItem } from '../types'
import './RecipeDetailView.css'

function RecipeDetailView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [recipeName, setRecipeName] = useState('')
  const [items, setItems] = useState<RecipeItem[]>([])
  const [imageUrl, setImageUrl] = useState<string | undefined>()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  // Inline ingredient search state
  const [ingredientQuery, setIngredientQuery] = useState('')
  const [ingredientResults, setIngredientResults] = useState<Food[]>([])
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [ingredientAmount, setIngredientAmount] = useState('100')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const recipeId = useRef(isNew ? crypto.randomUUID() : id!).current

  // Load existing recipe in edit mode
  useEffect(() => {
    if (isNew) return
    async function load() {
      const [recipe, recipeItems] = await Promise.all([
        getRecipe(id!),
        getRecipeItems(id!),
      ])
      if (recipe) {
        setRecipeName(recipe.name)
        setImageUrl(recipe.image_url)
      }
      setItems(recipeItems)
    }
    load()
  }, [id, isNew])

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // Debounced ingredient search
  const handleIngredientSearch = (value: string) => {
    setIngredientQuery(value)
    setSelectedFood(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setIngredientResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      const results = await searchFoods(value.trim())
      setIngredientResults(results)
    }, 300)
  }

  const handleSelectFood = (food: Food) => {
    setSelectedFood(food)
    setIngredientQuery(food.name)
    setIngredientResults([])
    setIngredientAmount('100')
  }

  const handleAddIngredient = () => {
    if (!selectedFood) return
    const grams = parseFloat(ingredientAmount)
    if (isNaN(grams) || grams <= 0) return

    const nutrition = calculateNutrition(selectedFood, grams)
    const newItem: RecipeItem = {
      id: crypto.randomUUID(),
      recipe_id: recipeId,
      food_id: selectedFood.id,
      name: selectedFood.name,
      amount_grams: grams,
      kcal: nutrition.kcal,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
    }
    setItems(prev => [...prev, newItem])
    setSelectedFood(null)
    setIngredientQuery('')
    setIngredientAmount('100')
  }

  const handleRemoveItem = (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImageUrl(URL.createObjectURL(file))
    }
  }

  const totals = calculateRecipeTotals(items)

  const handleSave = async () => {
    if (!recipeName.trim() || saving) return
    setSaving(true)
    try {
      let finalImageUrl = imageUrl
      if (imageFile) {
        finalImageUrl = await uploadRecipeImage(recipeId, imageFile)
      }

      const recipe = {
        id: recipeId,
        user_id: 'local',
        name: recipeName.trim(),
        image_url: finalImageUrl,
        total_kcal: totals.kcal,
        total_protein: totals.protein,
        total_carbs: totals.carbs,
        total_fat: totals.fat,
        created_at: new Date().toISOString(),
      }
      await saveRecipe(recipe)

      // Save each recipe item
      for (const item of items) {
        await saveRecipeItem(item)
      }

      navigate(-1)
    } catch {
      setSaving(false)
    }
  }

  return (
    <div className="recipe-detail-view">
      {/* Header */}
      <div className="recipe-detail-header">
        <button
          className="adaptive"
          data-interactive
          data-size="lg"
          onClick={() => navigate(-1)}
          aria-label="Zurück"
        >
          <ArrowLeft size={20} />
        </button>
        <h1>{isNew ? 'Neues Rezept' : 'Rezept bearbeiten'}</h1>
      </div>

      {/* Recipe name */}
      <input
        className="recipe-detail-name-input adaptive"
        data-material="semi-transparent"
        type="text"
        placeholder="Rezeptname"
        value={recipeName}
        onChange={e => setRecipeName(e.target.value)}
        aria-label="Rezeptname"
      />

      {/* Image upload */}
      <div className="recipe-detail-image">
        {imageUrl ? (
          <img src={imageUrl} alt={recipeName || 'Rezeptbild'} className="recipe-detail-image-preview" />
        ) : (
          <div className="recipe-detail-image-placeholder adaptive" data-material="semi-transparent">
            <Camera size={32} />
            <span data-emphasis="weak">Bild hinzufügen</span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageChange}
          className="recipe-detail-file-input"
          aria-label="Rezeptbild auswählen"
        />
        <button
          className="recipe-detail-image-btn adaptive"
          data-interactive
          data-material="semi-transparent"
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera size={16} />
          {imageUrl ? 'Bild ändern' : 'Foto aufnehmen'}
        </button>
      </div>

      {/* Ingredient list */}
      <div className="recipe-detail-items">
        <h2>Zutaten</h2>
        {items.length === 0 ? (
          <div className="recipe-detail-items-empty" data-emphasis="weak">
            Noch keine Zutaten hinzugefügt
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="recipe-detail-item adaptive" data-material="semi-transparent">
              <div className="recipe-detail-item-info">
                <span className="recipe-detail-item-name">{item.name}</span>
                <span className="recipe-detail-item-detail" data-emphasis="weak">
                  {item.amount_grams} g · {item.kcal} kcal
                </span>
              </div>
              <button
                className="recipe-detail-item-delete adaptive"
                data-interactive
                onClick={() => handleRemoveItem(item.id)}
                aria-label={`${item.name} entfernen`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add ingredient section */}
      <div className="recipe-detail-add-ingredient">
        <h2>Zutat hinzufügen</h2>
        <div className="recipe-detail-search adaptive" data-material="semi-transparent">
          <Search size={18} data-emphasis="weak" />
          <input
            type="text"
            placeholder="Lebensmittel suchen..."
            value={ingredientQuery}
            onChange={e => handleIngredientSearch(e.target.value)}
            aria-label="Zutat suchen"
          />
        </div>

        {/* Search results dropdown */}
        {ingredientResults.length > 0 && !selectedFood && (
          <div className="recipe-detail-search-results">
            {ingredientResults.map(food => (
              <button
                key={food.id}
                className="recipe-detail-search-item adaptive"
                data-material="semi-transparent"
                data-interactive
                onClick={() => handleSelectFood(food)}
              >
                <span>{food.name}</span>
                <span data-emphasis="weak">{food.kcal_per_100g} kcal/100g</span>
              </button>
            ))}
          </div>
        )}

        {/* Amount input when food is selected */}
        {selectedFood && (
          <div className="recipe-detail-add-row">
            <input
              type="number"
              className="recipe-detail-amount-input adaptive"
              data-material="semi-transparent"
              placeholder="Gramm"
              value={ingredientAmount}
              onChange={e => setIngredientAmount(e.target.value)}
              min="0"
              step="any"
              aria-label="Menge in Gramm"
            />
            <button
              className="recipe-detail-add-btn adaptive"
              data-interactive
              data-material="filled"
              data-emphasis="strong"
              onClick={handleAddIngredient}
            >
              <Plus size={16} />
              Hinzufügen
            </button>
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="recipe-detail-totals adaptive" data-material="semi-transparent">
        <h2>Gesamtnährwerte</h2>
        <div className="recipe-detail-totals-grid">
          <div className="recipe-detail-total">
            <span className="recipe-detail-total-value">{totals.kcal}</span>
            <span className="recipe-detail-total-label" data-emphasis="weak">kcal</span>
          </div>
          <div className="recipe-detail-total">
            <span className="recipe-detail-total-value">{totals.protein} g</span>
            <span className="recipe-detail-total-label" data-emphasis="weak">Protein</span>
          </div>
          <div className="recipe-detail-total">
            <span className="recipe-detail-total-value">{totals.carbs} g</span>
            <span className="recipe-detail-total-label" data-emphasis="weak">Kohlenhydrate</span>
          </div>
          <div className="recipe-detail-total">
            <span className="recipe-detail-total-value">{totals.fat} g</span>
            <span className="recipe-detail-total-label" data-emphasis="weak">Fett</span>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="recipe-detail-actions">
        <button
          className="recipe-detail-save-btn adaptive"
          data-interactive
          data-material="filled"
          data-emphasis="strong"
          data-size="lg"
          disabled={!recipeName.trim() || saving}
          onClick={handleSave}
        >
          {saving ? 'Speichern…' : 'Rezept speichern'}
        </button>
      </div>
    </div>
  )
}

export default RecipeDetailView
