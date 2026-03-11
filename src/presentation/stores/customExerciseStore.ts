import { create } from 'zustand';
import { CustomExercise, CreateCustomExerciseInput } from '@/domain/entities/CustomExercise';
import { CustomExerciseRemoteRepository } from '@/infrastructure/supabase/remote/CustomExerciseRemoteRepository';
import {
  getCoachCustomExercisesUseCase,
  createCustomExerciseUseCase,
} from '@/application/coach/CustomExerciseUseCases';

const repo = new CustomExerciseRemoteRepository();

interface CustomExerciseState {
  exercises:  CustomExercise[];
  isLoading:  boolean;
  error:      string | null;

  fetchByCoach(coachId: string): Promise<void>;
  create(input: CreateCustomExerciseInput): Promise<CustomExercise | null>;
  clearError(): void;
}

export const useCustomExerciseStore = create<CustomExerciseState>((set, get) => ({
  exercises:  [],
  isLoading:  false,
  error:      null,

  async fetchByCoach(coachId) {
    set({ isLoading: true, error: null });
    try {
      const exercises = await getCoachCustomExercisesUseCase(coachId, repo);
      set({ exercises, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Error al cargar ejercicios', isLoading: false });
    }
  },

  async create(input) {
    set({ isLoading: true, error: null });
    try {
      const created = await createCustomExerciseUseCase(input, repo);
      set((state) => ({
        exercises:  [created, ...state.exercises],
        isLoading:  false,
      }));
      return created;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Error al crear ejercicio', isLoading: false });
      return null;
    }
  },

  clearError() {
    set({ error: null });
  },
}));
