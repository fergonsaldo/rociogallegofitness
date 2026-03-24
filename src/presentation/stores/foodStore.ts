import { create } from 'zustand';
import { Food, CreateFoodInput } from '@/domain/entities/Food';
import { FoodRemoteRepository } from '@/infrastructure/supabase/remote/FoodRemoteRepository';
import {
  getFoodsUseCase,
  createFoodUseCase,
  deleteFoodUseCase,
} from '@/application/coach/FoodUseCases';
import { Strings } from '@/shared/constants/strings';

interface FoodState {
  foods:        Food[];
  isLoading:    boolean;
  isSubmitting: boolean;
  error:        string | null;

  fetchFoods:  (coachId: string) => Promise<void>;
  createFood:  (input: CreateFoodInput) => Promise<Food | null>;
  deleteFood:  (id: string) => Promise<void>;
  clearError:  () => void;
}

const repo = new FoodRemoteRepository();

export const useFoodStore = create<FoodState>((set, get) => ({
  foods:        [],
  isLoading:    false,
  isSubmitting: false,
  error:        null,

  fetchFoods: async (coachId) => {
    set({ isLoading: true, error: null });
    try {
      const foods = await getFoodsUseCase(coachId, repo);
      set({ foods });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : Strings.errorFallback });
    } finally {
      set({ isLoading: false });
    }
  },

  createFood: async (input) => {
    set({ isSubmitting: true, error: null });
    try {
      const food = await createFoodUseCase(input, repo);
      set({ foods: [...get().foods, food].sort((a, b) => a.name.localeCompare(b.name)) });
      return food;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : Strings.errorFallback });
      return null;
    } finally {
      set({ isSubmitting: false });
    }
  },

  deleteFood: async (id) => {
    set({ error: null });
    try {
      await deleteFoodUseCase(id, repo);
      set({ foods: get().foods.filter((f) => f.id !== id) });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : Strings.errorFallback });
    }
  },

  clearError: () => set({ error: null }),
}));
