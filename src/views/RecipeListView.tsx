import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, UtensilsCrossed } from 'lucide-react'
import { getAllRecipes } from '../services/nutritionService'
import type { Recipe } from '../types'
import './RecipeListView.css'

function RecipeListView() {
  const navigate = useNavigate()
  const [recipes, setRecipes] = useState<Recipe[]>([])

  useEffect(() => {
    async function load() {
      const all = await getAllRecipes()
      setRecipes(all)
    }
    load()
  }, [])

  return (
    <div className="recipe-list-view">
      {/* Header */}
      <div className="recipe-list-header">
        <button
          className="adaptive"
          data-interactive
          data-size="lg"
          onClick={() => navigate(-1)}
          aria-label="Zurück"
        >
          <ArrowLeft size={20} />
        </button>
        <h1>Rezepte</h1>
      </div>

      {/* New recipe button */}
      <button
        className="recipe-list-add-btn adaptive"
        data-material="semi-transparent"
        data-interactive
        onClick={() => navigate('/nutrition/recipe/new')}
      >
        <Plus size={18} />
        Neues Rezept
      </button>

      {recipes.length === 0 ? (
        <div className="recipe-list-empty" data-emphasis="weak">
          Noch keine Rezepte erstellt
        </div>
      ) : (
        <div className="recipe-list-grid">
          {recipes.map(recipe => (
            <button
              key={recipe.id}
              className="recipe-list-card adaptive"
              data-material="semi-transparent"
              data-interactive
              onClick={() => navigate(`/nutrition/recipe/${recipe.id}`)}
            >
              {recipe.image_url ? (
                <img
                  className="recipe-list-image"
                  src={recipe.image_url}
                  alt={recipe.name}
                />
              ) : (
                <div className="recipe-list-placeholder adaptive" data-material="semi-transparent">
                  <UtensilsCrossed size={32} />
                </div>
              )}
              <div className="recipe-list-card-info">
                <span className="recipe-list-card-name">{recipe.name}</span>
                <span className="recipe-list-card-kcal">{recipe.total_kcal} kcal</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default RecipeListView
