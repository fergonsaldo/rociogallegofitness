import { create } from 'zustand';
import { CoachPreferencesRemoteRepository } from '@/infrastructure/supabase/remote/CoachPreferencesRemoteRepository';
import {
  getQuickAccessUseCase,
  saveQuickAccessUseCase,
} from '@/application/coach/CoachPreferencesUseCases';
import { DEFAULT_QUICK_ACCESS } from '@/shared/constants/quickAccessCatalog';
import { Strings } from '@/shared/constants/strings';

const repo = new CoachPreferencesRemoteRepository();

interface CoachPreferencesState {
  quickAccess: string[];
  isSaving:   boolean;
  error:      string | null;

  loadQuickAccess:  (coachId: string) => Promise<void>;
  saveQuickAccess:  (coachId: string, keys: string[]) => Promise<void>;
  clearError:       () => void;
}

export const useCoachPreferencesStore = create<CoachPreferencesState>((set) => ({
  quickAccess: DEFAULT_QUICK_ACCESS,
  isSaving:    false,
  error:       null,

  loadQuickAccess: async (coachId) => {
    try {
      const keys = await getQuickAccessUseCase(coachId, repo);
      set({ quickAccess: keys });
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFallback });
    }
  },

  saveQuickAccess: async (coachId, keys) => {
    set({ isSaving: true, error: null });
    try {
      await saveQuickAccessUseCase(coachId, keys, repo);
      set({ quickAccess: keys, isSaving: false });
    } catch (err) {
      set({
        error: (err as any)?.message ?? Strings.errorFallback,
        isSaving: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
