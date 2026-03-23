import { create } from 'zustand';
import { Strings } from '@/shared/constants/strings';
import { CatalogCardio, CreateCardioInput } from '@/domain/entities/Cardio';
import { CardioRemoteRepository } from '@/infrastructure/supabase/remote/CardioRemoteRepository';
import {
  getAllCardiosUseCase,
  createCardioUseCase,
  deleteCardioUseCase,
  assignMultipleCardiosUseCase,
} from '@/application/coach/CardioUseCases';

const repo = new CardioRemoteRepository();

interface CardioState {
  catalog:    CatalogCardio[];
  isLoading:  boolean;
  isCreating: boolean;
  error:      string | null;

  fetchAll:                (coachId: string) => Promise<void>;
  create:                  (input: CreateCardioInput) => Promise<CatalogCardio | null>;
  delete:                  (id: string) => Promise<boolean>;
  assignMultipleToAthlete: (cardioIds: string[], athleteId: string) => Promise<boolean>;
  clearError:              () => void;
}

export const useCardioStore = create<CardioState>((set) => ({
  catalog:    [],
  isLoading:  false,
  isCreating: false,
  error:      null,

  fetchAll: async (coachId) => {
    set({ isLoading: true, error: null });
    try {
      const catalog = await getAllCardiosUseCase(coachId, repo);
      set({ catalog, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : Strings.errorFailedLoadCardios, isLoading: false });
    }
  },

  create: async (input) => {
    set({ isCreating: true, error: null });
    try {
      const cardio = await createCardioUseCase(input, repo);
      set((state) => ({
        catalog:    [cardio, ...state.catalog].sort((a, b) => a.name.localeCompare(b.name, 'es')),
        isCreating: false,
      }));
      return cardio;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : Strings.errorFailedCreateCardio, isCreating: false });
      return null;
    }
  },

  delete: async (id) => {
    set({ error: null });
    try {
      await deleteCardioUseCase(id, repo);
      set((state) => ({ catalog: state.catalog.filter((c) => c.id !== id) }));
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : Strings.errorFailedDeleteCardio });
      return false;
    }
  },

  assignMultipleToAthlete: async (cardioIds, athleteId) => {
    set({ error: null });
    try {
      await assignMultipleCardiosUseCase(cardioIds, athleteId, repo);
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : Strings.errorFailedAssignCardio });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
