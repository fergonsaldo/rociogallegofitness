import { create } from 'zustand';
import { Food, CreateFoodInput, UpdateFoodInput } from '@/domain/entities/Food';
import { FoodRemoteRepository } from '@/infrastructure/supabase/remote/FoodRemoteRepository';
import {
  getFoodsUseCase,
  createFoodUseCase,
  editFoodUseCase,
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
  editFood:    (food: Food, input: UpdateFoodInput, coachId: string) => Promise<Food | null>;
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
      set({ error: (err as any)?.message ?? Strings.errorFallback });
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
      set({ error: (err as any)?.message ?? Strings.errorFallback });
      return null;
    } finally {
      set({ isSubmitting: false });
    }
  },

  editFood: async (food, input, coachId) => {
    set({ isSubmitting: true, error: null });
    try {
      const updated = await editFoodUseCase(food, input, coachId, repo);
      const current = get().foods;
      const isGenericClone = food.coachId === null;
      const next = isGenericClone
        ? [...current, updated].sort((a, b) => a.name.localeCompare(b.name))
        : current.map((f) => (f.id === food.id ? updated : f));
      set({ foods: next });
      return updated;
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFallback });
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
      set({ error: (err as any)?.message ?? Strings.errorFallback });
    }
  },

  clearError: () => set({ error: null }),
}));
