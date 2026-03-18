import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Star } from 'lucide-react'
import { searchFoods } from '../services/foodSearchService'
import { getRecentFoods, getAllFavorites, getAllRecipes, saveFoodEntry, cacheFood } from '../services/nutritionService'
import Dialog from '../components/core/Dialog'
import Button from '../components/core/Button'
import Card from '../components/core/Card'
import Section from '../components/core/Section'
import Input from '../components/core/Input'
import type { Food, Recipe } from '../types'
import './AddFoodView.css'

type Tab = 'recent' | 'recipes' | 'favorites'

interface AddFoodViewProps {
  open: boolean
  onClose: () => void
  date: string
  onFoodSelect: (foodId: string) => void
}

function AddFoodView({ open, onClose, date, onFoodSelect }: AddFoodViewProps) {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Food[]>([])
  const [recentFoods, setRecentFoods] = useState<Food[]>([])
  const [favorites, setFavorites] = useState<Food[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('recent')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) return
    async function load() {
      const [r, f, rec] = await Promise.all([
        getRecentFoods(),
        getAllFavorites(),
        getAllRecipes(),
      ])
      setRecentFoods(r)
      setFavorites(f)
      setRecipes(rec)
    }
    load()
  }, [open])

  const handleSearch = useCallback((value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setSearchResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      const results = await searchFoods(value.trim())
      setSearchResults(results)
    }, 300)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const selectFood = async (food: Food) => {
    await cacheFood(food)
    onFoodSelect(food.id)
  }

  const selectRecipe = async (recipe: Recipe) => {
    const entry = {
      id: crypto.randomUUID(),
      user_id: 'local',
      date,
      food_id: recipe.id,
      name: recipe.name,
      amount_grams: 0,
      kcal: recipe.total_kcal,
      protein: recipe.total_protein,
      carbs: recipe.total_carbs,
      fat: recipe.total_fat,
      created_at: new Date().toISOString(),
    }
    await saveFoodEntry(entry)
    onClose()
  }

  const isSearching = query.trim().length > 0

  const renderFoodItem = (food: Food) => (
    <Card key={food.id} className="add-food-item" onClick={() => selectFood(food)} role="button" tabIndex={0}>
      <div className="add-food-item-info">
        <span className="add-food-item-name">{food.name}</span>
        {food.brand && (
          <span className="add-food-item-brand" data-emphasis="weak">{food.brand}</span>
        )}
      </div>
      <span className="add-food-item-kcal">{food.kcal_per_100g} kcal</span>
    </Card>
  )

  return (
    <Dialog title="Lebensmittel hinzufügen" onClose={onClose} open={open}>
      <div className="add-food-content">
        {/* Search */}
        <div className="add-food-search">
          <Search size={18} className="add-food-search-icon" data-emphasis="weak" />
          <Input
            type="text"
            placeholder="Lebensmittel suchen..."
            value={query}
            onChange={e => handleSearch(e.target.value)}
            aria-label="Lebensmittel suchen"
          />
        </div>

        {isSearching ? (
          <Section title="Suchergebnisse">
            <div className="add-food-list">
              {searchResults.length > 0 ? (
                searchResults.map(renderFoodItem)
              ) : (
                <div className="add-food-empty" data-emphasis="weak">
                  Keine Ergebnisse
                </div>
              )}
            </div>
          </Section>
        ) : (
          <>
            <div className="add-food-tabs">
              <Button
                className={`add-food-tab${activeTab === 'recent' ? ' add-food-tab--active' : ''}`}
                onClick={() => setActiveTab('recent')}
              >
                Letzte
              </Button>
              <Button
                className={`add-food-tab${activeTab === 'recipes' ? ' add-food-tab--active' : ''}`}
                onClick={() => setActiveTab('recipes')}
              >
                Rezepte
              </Button>
              <Button
                className={`add-food-tab${activeTab === 'favorites' ? ' add-food-tab--active' : ''}`}
                onClick={() => setActiveTab('favorites')}
              >
                <Star size={14} /> Favoriten
              </Button>
            </div>

            <Section>
              {activeTab === 'recent' && (
                <div className="add-food-list">
                  {recentFoods.length > 0 ? (
                    recentFoods.map(renderFoodItem)
                  ) : (
                    <div className="add-food-empty" data-emphasis="weak">
                      Noch keine letzten Einträge
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'recipes' && (
                <div className="add-food-list">
                  {recipes.length > 0 ? (
                    recipes.map(recipe => (
                      <Card key={recipe.id} className="add-food-item" onClick={() => selectRecipe(recipe)} role="button" tabIndex={0}>
                        <div className="add-food-item-info">
                          <span className="add-food-item-name">{recipe.name}</span>
                        </div>
                        <span className="add-food-item-kcal">{recipe.total_kcal} kcal</span>
                      </Card>
                    ))
                  ) : (
                    <div className="add-food-empty" data-emphasis="weak">
                      Noch keine Rezepte
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'favorites' && (
                <div className="add-food-list">
                  {favorites.length > 0 ? (
                    favorites.map(renderFoodItem)
                  ) : (
                    <div className="add-food-empty" data-emphasis="weak">
                      Noch keine Favoriten
                    </div>
                  )}
                </div>
              )}
            </Section>
          </>
        )}
      </div>
    </Dialog>
  )
}

export default AddFoodView
