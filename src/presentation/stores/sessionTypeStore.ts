import { create } from 'zustand';
import { SessionType, CreateSessionTypeInput } from '@/domain/entities/SessionType';
import { UpdateSessionTypeInput } from '@/domain/repositories/ISessionTypeRepository';
import { SessionTypeRemoteRepository } from '@/infrastructure/supabase/remote/SessionTypeRemoteRepository';
import {
  getSessionTypesUseCase,
  createSessionTypeUseCase,
  updateSessionTypeUseCase,
  deleteSessionTypeUseCase,
  getSessionTypeUsageCountUseCase,
  deleteSessionTypeWithSubstitutionUseCase,
} from '@/application/coach/SessionTypeUseCases';
import { Strings } from '@/shared/constants/strings';

const repo = new SessionTypeRemoteRepository();

interface SessionTypeState {
  sessionTypes: SessionType[];
  isLoading:    boolean;
  error:        string | null;

  fetchSessionTypes:                  (coachId: string) => Promise<void>;
  createSessionType:                  (input: CreateSessionTypeInput) => Promise<SessionType>;
  updateSessionType:                  (id: string, input: UpdateSessionTypeInput) => Promise<SessionType>;
  deleteSessionType:                  (id: string) => Promise<void>;
  getSessionTypeUsageCount:           (typeId: string) => Promise<number>;
  deleteSessionTypeWithSubstitution:  (id: string, substitutionId?: string) => Promise<void>;
  clearError:                         () => void;
}

export const useSessionTypeStore = create<SessionTypeState>((set, get) => ({
  sessionTypes: [],
  isLoading:    false,
  error:        null,

  fetchSessionTypes: async (coachId) => {
    set({ isLoading: true, error: null });
    try {
      const sessionTypes = await getSessionTypesUseCase(coachId, repo);
      set({ sessionTypes, isLoading: false });
    } catch (err) {
      set({
        error: (err as any)?.message ?? Strings.errorFailedLoadSessionTypes,
        isLoading: false,
      });
    }
  },

  createSessionType: async (input) => {
    try {
      const sessionType = await createSessionTypeUseCase(input, repo);
      set({
        sessionTypes: [...get().sessionTypes, sessionType].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      });
      return sessionType;
    } catch (err) {
      const message = (err as any)?.message ?? Strings.errorFailedCreateSessionType;
      set({ error: message });
      throw err;
    }
  },

  updateSessionType: async (id, input) => {
    try {
      const updated = await updateSessionTypeUseCase(id, input, repo);
      set({
        sessionTypes: get().sessionTypes
          .map((t) => (t.id === id ? updated : t))
          .sort((a, b) => a.name.localeCompare(b.name)),
      });
      return updated;
    } catch (err) {
      const message = (err as any)?.message ?? Strings.errorFailedUpdateSessionType;
      set({ error: message });
      throw err;
    }
  },

  deleteSessionType: async (id) => {
    try {
      await deleteSessionTypeUseCase(id, repo);
      set({ sessionTypes: get().sessionTypes.filter((t) => t.id !== id) });
    } catch (err) {
      const message = err instanceof Error ? err.message : Strings.errorFailedDeleteSessionType;
      set({ error: message });
      throw err;
    }
  },

  getSessionTypeUsageCount: async (typeId) => {
    return getSessionTypeUsageCountUseCase(typeId, repo);
  },

  deleteSessionTypeWithSubstitution: async (id, substitutionId) => {
    try {
      await deleteSessionTypeWithSubstitutionUseCase(id, substitutionId, repo);
      set({ sessionTypes: get().sessionTypes.filter((t) => t.id !== id) });
    } catch (err) {
      const message = err instanceof Error ? err.message : Strings.errorFailedDeleteSessionType;
      set({ error: message });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
