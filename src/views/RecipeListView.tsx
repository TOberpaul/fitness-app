import { useState, useEffect } from 'react'
import { Plus, UtensilsCrossed } from 'lucide-react'
import { getAllRecipes } from '../services/nutritionService'
import Dialog from '../components/core/Dialog'
import Button from '../components/core/Button'
import Card from '../components/core/Card'
import Section from '../components/core/Section'
import type { Recipe } from '../types'
import './RecipeListView.css'

interface RecipeListViewProps {
  open: boolean
  onClose: () => void
  onRecipeSelect: (recipeId: string) => void
  onNewRecipe: () => void
}

function RecipeListView({ open, onClose, onRecipeSelect, onNewRecipe }: RecipeListViewProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([])

  useEffect(() => {
    if (!open) return
    async function load() {
      const all = await getAllRecipes()
      setRecipes(all)
    }
    load()
  }, [open])

  return (
    <Dialog title="Rezepte" onClose={onClose} open={open}>
      <div className="recipe-list-content">
        <Button className="recipe-list-add-btn" onClick={onNewRecipe}>
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
                  onClick={() => onRecipeSelect(recipe.id)}
                  role="button"
                  tabIndex={0}
                >
                  {recipe.image_url ? (
                    <img className="recipe-list-image" src={recipe.image_url} alt={recipe.name} />
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
    </Dialog>
  )
}

export default RecipeListView
