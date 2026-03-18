import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, UtensilsCrossed } from 'lucide-react'
import { getAllRecipes } from '../services/nutritionService'
import Button from '../components/core/Button'
import Card from '../components/core/Card'
import Section from '../components/core/Section'
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
        <Button onClick={() => navigate(-1)} aria-label="Zurück">
          <ArrowLeft size={20} />
        </Button>
        <h1>Rezepte</h1>
      </div>

      {/* New recipe button */}
      <Button
        className="recipe-list-add-btn"
        onClick={() => navigate('/nutrition/recipe/new')}
      >
        <Plus size={18} />
        Neues Rezept
      </Button>

      <Section title="Meine Rezepte">
        {recipes.length === 0 ? (
          <div className="recipe-list-empty" data-emphasis="weak">
            Noch keine Rezepte erstellt
          </div>
        ) : (
          <div className="recipe-list-grid">
            {recipes.map(recipe => (
              <Card
                key={recipe.id}
                className="recipe-list-card"
                onClick={() => navigate(`/nutrition/recipe/${recipe.id}`)}
                role="button"
                tabIndex={0}
              >
                {recipe.image_url ? (
                  <img
                    className="recipe-list-image"
                    src={recipe.image_url}
                    alt={recipe.name}
                  />
                ) : (
                  <div className="recipe-list-placeholder">
                    <UtensilsCrossed size={32} />
                  </div>
                )}
                <div className="recipe-list-card-info">
                  <span className="recipe-list-card-name">{recipe.name}</span>
                  <span className="recipe-list-card-kcal">{recipe.total_kcal} kcal</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

export default RecipeListView
