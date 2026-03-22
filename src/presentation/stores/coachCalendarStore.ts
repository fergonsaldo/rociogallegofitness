import { create } from 'zustand';
import { CoachSession, CreateCoachSessionInput } from '@/domain/entities/CoachSession';
import { CoachSessionRemoteRepository } from '@/infrastructure/supabase/remote/CoachSessionRemoteRepository';
import {
  getSessionsForMonthUseCase,
  createSessionUseCase,
  deleteSessionUseCase,
} from '@/application/coach/CoachSessionUseCases';
import { Strings } from '@/shared/constants/strings';

const repo = new CoachSessionRemoteRepository();

interface CoachCalendarState {
  sessions:     CoachSession[];
  selectedDate: Date;
  isLoading:    boolean;
  error:        string | null;

  fetchMonth:     (coachId: string, year: number, month: number) => Promise<void>;
  addSession:     (input: CreateCoachSessionInput) => Promise<CoachSession>;
  removeSession:  (id: string) => Promise<void>;
  setSelectedDate:(date: Date) => void;
  clearError:     () => void;
}

export const useCoachCalendarStore = create<CoachCalendarState>((set, get) => ({
  sessions:     [],
  selectedDate: new Date(),
  isLoading:    false,
  error:        null,

  fetchMonth: async (coachId, year, month) => {
    set({ isLoading: true, error: null });
    try {
      const sessions = await getSessionsForMonthUseCase(coachId, year, month, repo);
      set({ sessions, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : Strings.errorFailedLoadSessions,
        isLoading: false,
      });
    }
  },

  addSession: async (input) => {
    try {
      const session = await createSessionUseCase(input, repo);
      set({ sessions: [...get().sessions, session].sort(
        (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime(),
      )});
      return session;
    } catch (err) {
      const message = err instanceof Error ? err.message : Strings.errorFailedCreateSession;
      set({ error: message });
      throw err;
    }
  },

  removeSession: async (id) => {
    try {
      await deleteSessionUseCase(id, repo);
      set({ sessions: get().sessions.filter((s) => s.id !== id) });
    } catch (err) {
      const message = err instanceof Error ? err.message : Strings.errorFailedDeleteSession;
      set({ error: message });
      throw err;
    }
  },

  setSelectedDate: (date) => set({ selectedDate: date }),

  clearError: () => set({ error: null }),
}));
