import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Camera, Search } from 'lucide-react'
import { searchFoods } from '../services/foodSearchService'
import { getRecipe, getRecipeItems, saveRecipe, saveRecipeItem, uploadRecipeImage } from '../services/nutritionService'
import { calculateNutrition, calculateRecipeTotals } from '../utils/calculationEngine'
import Dialog from '../components/core/Dialog'
import Button from '../components/core/Button'
import Card from '../components/core/Card'
import Section from '../components/core/Section'
import Input from '../components/core/Input'
import type { Food, RecipeItem } from '../types'
import './RecipeDetailView.css'

interface RecipeDetailViewProps {
  open: boolean
  onClose: () => void
  recipeId: string | null
}

function RecipeDetailView({ open, onClose, recipeId }: RecipeDetailViewProps) {
  const isNew = recipeId === 'new'
  const [recipeName, setRecipeName] = useState('')
  const [items, setItems] = useState<RecipeItem[]>([])
  const [imageUrl, setImageUrl] = useState<string | undefined>()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const [ingredientQuery, setIngredientQuery] = useState('')
  const [ingredientResults, setIngredientResults] = useState<Food[]>([])
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [ingredientAmount, setIngredientAmount] = useState('100')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const internalId = useRef(isNew ? crypto.randomUUID() : recipeId!).current

  useEffect(() => {
    if (!open || isNew) return
    async function load() {
      const [recipe, recipeItems] = await Promise.all([
        getRecipe(recipeId!),
        getRecipeItems(recipeId!),
      ])
      if (recipe) {
        setRecipeName(recipe.name)
        setImageUrl(recipe.image_url)
      }
      setItems(recipeItems)
    }
    load()
  }, [open, recipeId, isNew])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

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
      recipe_id: internalId,
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
        finalImageUrl = await uploadRecipeImage(internalId, imageFile)
      }

      const recipe = {
        id: internalId,
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

      for (const item of items) {
        await saveRecipeItem(item)
      }

      onClose()
    } catch {
      setSaving(false)
    }
  }

  return (
    <Dialog title={isNew ? 'Neues Rezept' : 'Rezept bearbeiten'} onClose={onClose} open={open}>
      <div className="recipe-detail-content">
        <Input
          className="recipe-detail-name-input"
          type="text"
          placeholder="Rezeptname"
          value={recipeName}
          onChange={e => setRecipeName(e.target.value)}
          label="Rezeptname"
        />

        {/* Image upload */}
        <div className="recipe-detail-image">
          {imageUrl ? (
            <img src={imageUrl} alt={recipeName || 'Rezeptbild'} className="recipe-detail-image-preview" />
          ) : (
            <Card className="recipe-detail-image-placeholder">
              <Camera size={32} />
              <span data-emphasis="weak">Bild hinzufügen</span>
            </Card>
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
          <Button className="recipe-detail-image-btn" onClick={() => fileInputRef.current?.click()}>
            <Camera size={16} />
            {imageUrl ? 'Bild ändern' : 'Foto aufnehmen'}
          </Button>
        </div>

        {/* Ingredient list */}
        <Section title="Zutaten">
          {items.length === 0 ? (
            <div className="recipe-detail-items-empty" data-emphasis="weak">
              Noch keine Zutaten hinzugefügt
            </div>
          ) : (
            items.map(item => (
              <Card key={item.id} className="recipe-detail-item">
                <div className="recipe-detail-item-info">
                  <span className="recipe-detail-item-name">{item.name}</span>
                  <span className="recipe-detail-item-detail" data-emphasis="weak">
                    {item.amount_grams} g · {item.kcal} kcal
                  </span>
                </div>
                <Button
                  className="recipe-detail-item-delete"
                  onClick={() => handleRemoveItem(item.id)}
                  aria-label={`${item.name} entfernen`}
                >
                  <Trash2 size={16} />
                </Button>
              </Card>
            ))
          )}
        </Section>

        {/* Add ingredient */}
        <Section title="Zutat hinzufügen">
          <div className="recipe-detail-search">
            <Search size={18} data-emphasis="weak" />
            <Input
              type="text"
              placeholder="Lebensmittel suchen..."
              value={ingredientQuery}
              onChange={e => handleIngredientSearch(e.target.value)}
              aria-label="Zutat suchen"
            />
          </div>

          {ingredientResults.length > 0 && !selectedFood && (
            <div className="recipe-detail-search-results">
              {ingredientResults.map(food => (
                <Card
                  key={food.id}
                  className="recipe-detail-search-item"
                  onClick={() => handleSelectFood(food)}
                  role="button"
                  tabIndex={0}
                >
                  <span>{food.name}</span>
                  <span data-emphasis="weak">{food.kcal_per_100g} kcal/100g</span>
                </Card>
              ))}
            </div>
          )}

          {selectedFood && (
            <div className="recipe-detail-add-row">
              <Input
                type="number"
                placeholder="Gramm"
                value={ingredientAmount}
                onChange={e => setIngredientAmount(e.target.value)}
                min="0"
                step="any"
                aria-label="Menge in Gramm"
              />
              <Button className="recipe-detail-add-btn" onClick={handleAddIngredient}>
                <Plus size={16} />
                Hinzufügen
              </Button>
            </div>
          )}
        </Section>

        {/* Totals */}
        <Section title="Gesamtnährwerte">
          <Card className="recipe-detail-totals">
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
          </Card>
        </Section>

        <div className="recipe-detail-actions">
          <Button
            className="recipe-detail-save-btn"
            disabled={!recipeName.trim() || saving}
            onClick={handleSave}
          >
            {saving ? 'Speichern…' : 'Rezept speichern'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

export default RecipeDetailView
