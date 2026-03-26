import {
  Recipe,
  RecipeWithIngredients,
  RecipeIngredientWithFood,
  RecipeMacros,
  CreateRecipeSchema,
  UpdateRecipeSchema,
} from '@/domain/entities/Recipe';
import { IRecipeRepository } from '@/domain/repositories/IRecipeRepository';

// ── GetRecipes ────────────────────────────────────────────────────────────────

export async function getRecipesUseCase(
  coachId: string,
  repo: IRecipeRepository,
): Promise<Recipe[]> {
  if (!coachId) throw new Error('coachId is required');
  return repo.getRecipesByCoach(coachId);
}

// ── GetRecipeDetail ───────────────────────────────────────────────────────────

export async function getRecipeDetailUseCase(
  id: string,
  coachId: string,
  repo: IRecipeRepository,
): Promise<RecipeWithIngredients> {
  if (!id)      throw new Error('id is required');
  if (!coachId) throw new Error('coachId is required');
  return repo.getRecipeDetail(id, coachId);
}

// ── CreateRecipe ──────────────────────────────────────────────────────────────

export async function createRecipeUseCase(
  input: unknown,
  repo: IRecipeRepository,
): Promise<Recipe> {
  const validated = CreateRecipeSchema.parse(input);
  return repo.createRecipe(validated);
}

// ── UpdateRecipe ──────────────────────────────────────────────────────────────

export async function updateRecipeUseCase(
  id: string,
  coachId: string,
  input: unknown,
  repo: IRecipeRepository,
): Promise<Recipe> {
  if (!id)      throw new Error('id is required');
  if (!coachId) throw new Error('coachId is required');
  const validated = UpdateRecipeSchema.parse(input);
  return repo.updateRecipe(id, coachId, validated);
}

// ── DeleteRecipe ──────────────────────────────────────────────────────────────

export async function deleteRecipeUseCase(
  id: string,
  repo: IRecipeRepository,
): Promise<void> {
  if (!id) throw new Error('id is required');
  return repo.deleteRecipe(id);
}

// ── SetAllVisibility ──────────────────────────────────────────────────────────

export async function setAllRecipesVisibilityUseCase(
  coachId: string,
  visible: boolean,
  repo: IRecipeRepository,
): Promise<void> {
  if (!coachId) throw new Error('coachId is required');
  return repo.setAllVisibility(coachId, visible);
}

// ── filterRecipes (pure) ──────────────────────────────────────────────────────

export function filterRecipes(
  items: Recipe[],
  query: string,
  activeTags: string[],
): Recipe[] {
  let result = items;

  if (query.trim()) {
    const q = query.toLowerCase().trim();
    result = result.filter((r) => r.name.toLowerCase().includes(q));
  }

  if (activeTags.length > 0) {
    result = result.filter((r) =>
      activeTags.some((tag) => r.tags.includes(tag)),
    );
  }

  return result;
}

// ── computeRecipeMacros (pure) ────────────────────────────────────────────────

export function computeRecipeMacros(
  ingredients: RecipeIngredientWithFood[],
): RecipeMacros {
  const totals = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };

  for (const { food, quantityG } of ingredients) {
    const factor = quantityG / 100;
    totals.calories += food.caloriesPer100g * factor;
    totals.proteinG += food.proteinG        * factor;
    totals.carbsG   += food.carbsG          * factor;
    totals.fatG     += food.fatG            * factor;
    totals.fiberG   += food.fiberG          * factor;
  }

  return {
    calories: Math.round(totals.calories),
    proteinG: Math.round(totals.proteinG * 10) / 10,
    carbsG:   Math.round(totals.carbsG   * 10) / 10,
    fatG:     Math.round(totals.fatG     * 10) / 10,
    fiberG:   Math.round(totals.fiberG   * 10) / 10,
  };
}
