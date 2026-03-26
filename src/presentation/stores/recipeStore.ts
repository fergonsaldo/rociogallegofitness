import { create } from 'zustand';
import {
  Recipe,
  RecipeWithIngredients,
  CreateRecipeInput,
  UpdateRecipeInput,
} from '@/domain/entities/Recipe';
import { RecipeRemoteRepository } from '@/infrastructure/supabase/remote/RecipeRemoteRepository';
import {
  getRecipesUseCase,
  getRecipeDetailUseCase,
  createRecipeUseCase,
  updateRecipeUseCase,
  deleteRecipeUseCase,
} from '@/application/coach/RecipeUseCases';
import { Strings } from '@/shared/constants/strings';

interface RecipeState {
  recipes:         Recipe[];
  currentRecipe:   RecipeWithIngredients | null;
  isListLoading:   boolean;
  isDetailLoading: boolean;
  isSubmitting:    boolean;
  error:           string | null;

  fetchRecipes(coachId: string): Promise<void>;
  fetchRecipeDetail(id: string, coachId: string): Promise<void>;
  createRecipe(input: CreateRecipeInput, localImageUri?: string): Promise<Recipe | null>;
  updateRecipe(id: string, coachId: string, input: UpdateRecipeInput, localImageUri?: string, oldImagePath?: string | null): Promise<Recipe | null>;
  deleteRecipe(id: string, imagePath?: string | null): Promise<void>;
  clearCurrentRecipe(): void;
  clearError(): void;
}

const repo = new RecipeRemoteRepository();

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes:         [],
  currentRecipe:   null,
  isListLoading:   false,
  isDetailLoading: false,
  isSubmitting:    false,
  error:           null,

  fetchRecipes: async (coachId) => {
    set({ isListLoading: true, error: null });
    try {
      const recipes = await getRecipesUseCase(coachId, repo);
      set({ recipes });
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFallback });
    } finally {
      set({ isListLoading: false });
    }
  },

  fetchRecipeDetail: async (id, coachId) => {
    set({ isDetailLoading: true, error: null });
    try {
      const recipe = await getRecipeDetailUseCase(id, coachId, repo);
      set({ currentRecipe: recipe });
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFallback });
    } finally {
      set({ isDetailLoading: false });
    }
  },

  createRecipe: async (input, localImageUri) => {
    set({ isSubmitting: true, error: null });
    try {
      let imagePath: string | undefined;
      if (localImageUri) {
        imagePath = await repo.uploadImage(input.coachId, localImageUri);
      }
      const recipe = await createRecipeUseCase({ ...input, imagePath }, repo);
      set({ recipes: [...get().recipes, recipe].sort((a, b) => a.name.localeCompare(b.name)) });
      return recipe;
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFallback });
      return null;
    } finally {
      set({ isSubmitting: false });
    }
  },

  updateRecipe: async (id, coachId, input, localImageUri, oldImagePath) => {
    set({ isSubmitting: true, error: null });
    try {
      let imagePath = input.imagePath;
      if (localImageUri) {
        imagePath = await repo.uploadImage(coachId, localImageUri);
        if (oldImagePath) await repo.deleteImage(oldImagePath).catch(() => undefined);
      }
      const recipe = await updateRecipeUseCase(id, coachId, { ...input, imagePath }, repo);
      set({
        recipes: get().recipes
          .map((r) => (r.id === id ? recipe : r))
          .sort((a, b) => a.name.localeCompare(b.name)),
        currentRecipe: get().currentRecipe?.id === id
          ? { ...get().currentRecipe!, ...recipe }
          : get().currentRecipe,
      });
      return recipe;
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFallback });
      return null;
    } finally {
      set({ isSubmitting: false });
    }
  },

  deleteRecipe: async (id, imagePath) => {
    set({ error: null });
    try {
      await deleteRecipeUseCase(id, repo);
      if (imagePath) await repo.deleteImage(imagePath).catch(() => undefined);
      set({ recipes: get().recipes.filter((r) => r.id !== id) });
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFallback });
    }
  },

  clearCurrentRecipe: () => set({ currentRecipe: null }),
  clearError:         () => set({ error: null }),
}));
