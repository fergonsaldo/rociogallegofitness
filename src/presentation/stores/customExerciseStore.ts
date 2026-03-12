import { create } from 'zustand';
import { CustomExercise, CreateCustomExerciseInput } from '@/domain/entities/CustomExercise';
import { UpdateCustomExerciseInput } from '@/domain/repositories/ICustomExerciseRepository';
import { CustomExerciseRemoteRepository } from '@/infrastructure/supabase/remote/CustomExerciseRemoteRepository';
import {
  getCoachCustomExercisesUseCase,
  createCustomExerciseUseCase,
  updateCustomExerciseUseCase,
  deleteCustomExerciseUseCase,
} from '@/application/coach/CustomExerciseUseCases';

const repo = new CustomExerciseRemoteRepository();

interface CustomExerciseState {
  exercises:  CustomExercise[];
  isLoading:  boolean;
  error:      string | null;

  fetchByCoach(coachId: string): Promise<void>;
  create(input: CreateCustomExerciseInput): Promise<CustomExercise | null>;
  update(id: string, input: UpdateCustomExerciseInput): Promise<CustomExercise | null>;
  delete(id: string): Promise<boolean>;
  clearError(): void;
}

export const useCustomExerciseStore = create<CustomExerciseState>((set) => ({
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
      set((state) => ({ exercises: [created, ...state.exercises], isLoading: false }));
      return created;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Error al crear ejercicio', isLoading: false });
      return null;
    }
  },

  async update(id, input) {
    set({ isLoading: true, error: null });
    try {
      const updated = await updateCustomExerciseUseCase(id, input, repo);
      set((state) => ({
        exercises: state.exercises.map((ex) => ex.id === id ? updated : ex),
        isLoading: false,
      }));
      return updated;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Error al actualizar ejercicio', isLoading: false });
      return null;
    }
  },

  async delete(id) {
    set({ isLoading: true, error: null });
    try {
      await deleteCustomExerciseUseCase(id, repo);
      set((state) => ({
        exercises: state.exercises.filter((ex) => ex.id !== id),
        isLoading: false,
      }));
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Error al eliminar ejercicio', isLoading: false });
      return false;
    }
  },

  clearError() {
    set({ error: null });
  },
}));
